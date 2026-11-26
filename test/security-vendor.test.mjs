import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import {
  ThoughtTranslatorService,
  normalizeOpenAiBaseUrl,
  validateOpenAiBaseUrl,
  isKeylessAllowedEndpoint,
} from '../vendor/thought-translator/translator-service.mjs';
import { createLiveHostAdapter } from '../vendor/sidebar-studio/live-host-adapter.mjs';
import { MetricsStore } from '../vendor/pulse-dashboard/sidecars/panel/store.mjs';
import { TrajectoryReader } from '../vendor/pulse-dashboard/sidecars/panel/trajectory-reader.mjs';
import { UsageLedger, DesktopUsage, LOCAL_SCOPE } from '../vendor/pulse-dashboard/sidecars/panel/usage.mjs';
import { BackgroundStatistics } from '../vendor/pulse-dashboard/sidecars/panel/background-statistics.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SIDEBAR_CLIENT_FILE = path.join(ROOT_DIR, 'vendor', 'sidebar-studio', 'sidebar-client.js');

function createSidebarClientHarness({
  initialBootCfg = null,
  assignments = {},
  startCascadeImpl = null,
  wrapperSendImpl = null,
  rawSendImpl = null,
} = {}) {
  const clientCode = fs.readFileSync(SIDEBAR_CLIENT_FILE, 'utf8');
  const docListeners = new Map();
  const winListeners = new Map();
  const timers = new Map();
  let nextTimerId = 1;
  let storeSubCount = 0;
  let storeUnsubCount = 0;
  let routerSubCount = 0;
  let routerUnsubCount = 0;

  const listenerKey = (type, capture) => `${type}:${capture ? 'cap' : 'bub'}`;
  const addToMap = (map, type, fn, opts) => {
    const cap = typeof opts === 'boolean' ? opts : Boolean(opts && opts.capture);
    const k = listenerKey(type, cap);
    if (!map.has(k)) map.set(k, new Set());
    map.get(k).add(fn);
  };
  const removeFromMap = (map, type, fn, opts) => {
    const cap = typeof opts === 'boolean' ? opts : Boolean(opts && opts.capture);
    const k = listenerKey(type, cap);
    map.get(k)?.delete(fn);
  };
  const countMapListeners = (map) => {
    let total = 0;
    for (const set of map.values()) total += set.size;
    return total;
  };

  const makeNode = (tag) => {
    const attrs = new Map();
    const classes = new Set();
    const node = {
      tagName: String(tag || 'DIV').toUpperCase(),
      nodeName: String(tag || 'DIV').toUpperCase(),
      id: '',
      children: [],
      style: {},
      classList: {
        add: (...cs) => cs.forEach((c) => classes.add(c)),
        remove: (...cs) => cs.forEach((c) => classes.delete(c)),
        contains: (c) => classes.has(c),
      },
      setAttribute(k, v) {
        attrs.set(k, String(v));
        if (k === 'id') this.id = String(v);
      },
      getAttribute(k) {
        return attrs.has(k) ? attrs.get(k) : null;
      },
      removeAttribute(k) {
        attrs.delete(k);
      },
      appendChild(c) {
        c.parentElement = node;
        node.children.push(c);
        return c;
      },
      insertBefore(c) {
        c.parentElement = node;
        node.children.push(c);
        return c;
      },
      remove() {
        if (this.parentElement) {
          const i = this.parentElement.children.indexOf(this);
          if (i >= 0) this.parentElement.children.splice(i, 1);
          this.parentElement = null;
        }
      },
      addEventListener() {},
      removeEventListener() {},
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      getBoundingClientRect() {
        return { width: 240, height: 600, top: 0, left: 0, bottom: 600, right: 240 };
      },
      get firstChild() {
        return node.children[0] || null;
      },
    };
    return node;
  };

  const startCalls = [];
  const rawSendCalls = [];
  const wrapperSendCalls = [];

  const origRawSend = async (req) => {
    rawSendCalls.push(req);
    if (typeof rawSendImpl === 'function') return await rawSendImpl(req);
    return {};
  };
  const origWrapperSend = async (req) => {
    wrapperSendCalls.push(req);
    if (typeof wrapperSendImpl === 'function') return await wrapperSendImpl(req);
    return {};
  };

  const fakeLsClient = {
    startCascade: async (req) => {
      startCalls.push(req);
      if (typeof startCascadeImpl === 'function') return await startCascadeImpl(req);
      return { cascadeId: req.cascadeId };
    },
    sendUserCascadeMessage: origRawSend,
    updateConversationAnnotations: async () => ({}),
    deleteCascadeTrajectory: async () => ({}),
  };

  const fakeLsWrapper = {
    startCascade: async (req) => ({ cascadeId: req.cascadeId }),
    sendUserCascadeMessage: origWrapperSend,
    deleteCascadeTrajectory: async () => ({}),
    updateConversationAnnotations: async () => ({}),
  };

  const fakeRouter = {
    state: { location: { pathname: '/' } },
    navigate() {},
    subscribe() {
      routerSubCount += 1;
      return () => {
        routerUnsubCount += 1;
      };
    },
  };

  const fakeStore = {
    getState: () => ({
      trajectorySummaries: { summaries: {} },
      userStatus: { cascadeModelConfigData: { clientModelConfigs: [] } },
    }),
    subscribe() {
      storeSubCount += 1;
      return () => {
        storeUnsubCount += 1;
      };
    },
    dispatch() {},
  };

  const rootEl = makeNode('div');
  rootEl.id = 'root';
  rootEl.__reactFiber$sec = {
    tag: 10,
    memoizedProps: { value: { store: fakeStore } },
    sibling: {
      tag: 10,
      memoizedProps: { value: fakeLsWrapper },
      sibling: {
        tag: 10,
        memoizedProps: { value: fakeRouter },
        sibling: {
          tag: 10,
          memoizedProps: {
            value: {
              core: {
                projectManagementService: {
                  projectsStateProvider: { getState: () => [] },
                  lsClient: fakeLsClient,
                },
              },
            },
          },
        },
      },
    },
  };

  const doc = {
    head: makeNode('head'),
    body: makeNode('body'),
    documentElement: makeNode('html'),
    hidden: false,
    createElement: (tag) => makeNode(tag),
    createElementNS: (_ns, tag) => makeNode(tag),
    getElementById: (id) => (id === 'root' ? rootEl : null),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (type, fn, opts) => addToMap(docListeners, type, fn, opts),
    removeEventListener: (type, fn, opts) => removeFromMap(docListeners, type, fn, opts),
  };

  const snap = {
    storeId: 'store-sec',
    rev: 1,
    navRev: 1,
    draftRev: 1,
    activeMode: 'chat',
    currentView: '/',
    chatDraft: { kind: 'knowledge', folderId: null, sparkProjectId: null },
    assignments,
    knowledgeFolders: [],
    sparkProjects: [],
    chatSidebar: { knowledge: { rootItems: [], folders: [] }, spark: { projects: [] }, archived: { items: [], totalCount: 0 } },
    catalogHealth: 'ready',
    capabilities: { projectPermissions: false, perCascadeIsolation: true },
  };

  const win = {
    document: doc,
    innerWidth: 1440,
    innerHeight: 900,
    location: { pathname: '/' },
    getComputedStyle: () => ({ position: 'relative' }),
    addEventListener: (type, fn, opts) => addToMap(winListeners, type, fn, opts),
    removeEventListener: (type, fn, opts) => removeFromMap(winListeners, type, fn, opts),
    __agPrismSidebarBridge: {
      isOnline: () => true,
      call: async () => ({ ok: true, snapshot: snap }),
    },
  };
  if (initialBootCfg) {
    win.__agPrism = { getState: () => ({ cfg: initialBootCfg }) };
  }

  const fakeSetTimeout = (fn, ms) => {
    const id = nextTimerId++;
    timers.set(id, { fn, ms });
    return id;
  };
  const fakeClearTimeout = (id) => {
    timers.delete(id);
  };

  vm.runInNewContext(clientCode, {
    window: win,
    globalThis: win,
    document: doc,
    crypto: globalThis.crypto,
    getComputedStyle: win.getComputedStyle,
    setTimeout: fakeSetTimeout,
    clearTimeout: fakeClearTimeout,
  });

  return {
    win,
    doc,
    fakeLsClient,
    fakeLsWrapper,
    origRawSend,
    origWrapperSend,
    startCalls,
    rawSendCalls,
    wrapperSendCalls,
    timers,
    getCounts: () => ({
      docListeners: countMapListeners(docListeners),
      winListeners: countMapListeners(winListeners),
      activeTimers: timers.size,
      storeSubCount,
      storeUnsubCount,
      routerSubCount,
      routerUnsubCount,
    }),
  };
}

test('P1 sidebar-client: off-mode module self-protection mounts 0 listeners/timers/hostOps, lazy-activates on sync("on"), and symmetrically unbinds on sync("off")', async () => {
  const h = createSidebarClientHarness();

  // 1) 加载后未 sync({ sidebarStudio: 'on' }) 前：零监听、零定时器、零订阅、零 __agPrismSidebarHostOps、零 sendGuard
  assert.equal(h.win.__agPrismSidebarHostOps, undefined, '关闭态绝不得提前暴露 window.__agPrismSidebarHostOps');
  assert.equal(h.getCounts().docListeners, 0, '关闭态不得提前挂载 8 个 document 监听');
  assert.equal(h.getCounts().winListeners, 0, '关闭态不得提前挂载 window resize 监听');
  assert.equal(h.getCounts().activeTimers, 0, '关闭态不得启动 scheduleDiscovery 轮询定时器');
  assert.equal(h.getCounts().storeSubCount, 0, '关闭态不得订阅 host.store');
  assert.equal(h.getCounts().routerSubCount, 0, '关闭态不得订阅 host.router');
  assert.equal(h.fakeLsWrapper.sendUserCascadeMessage, h.origWrapperSend, '关闭态不得 patch sendUserCascadeMessage');
  assert.equal(h.fakeLsClient.sendUserCascadeMessage, h.origRawSend, '关闭态不得 patch rawLs.sendUserCascadeMessage');
  assert.equal(h.win.__agPrismSidebar.getState().listenersBound, false);

  // 2) sync({ sidebarStudio: 'on' }) 切入开启态 -> 懒挂载全部监听、注册 hostOps、安装 sendGuard、订阅 store/router
  h.win.__agPrismSidebar.sync({ sidebarStudio: 'on' });
  await Promise.resolve();
  assert.ok(h.win.__agPrismSidebarHostOps, '开启态应注册 window.__agPrismSidebarHostOps');
  assert.equal(h.getCounts().docListeners, 8, '开启态应挂载 8 个 document 监听');
  assert.equal(h.getCounts().winListeners, 1, '开启态应挂载 1 个 window resize 监听');
  assert.equal(h.getCounts().storeSubCount, 1, '开启态应订阅 host.store');
  assert.equal(h.getCounts().routerSubCount, 1, '开启态应订阅 host.router');
  assert.notEqual(h.fakeLsWrapper.sendUserCascadeMessage, h.origWrapperSend, '开启态应挂载 wrapper sendGuard');
  assert.notEqual(h.fakeLsClient.sendUserCascadeMessage, h.origRawSend, '开启态应挂载 rawLs sendGuard');

  // 重复 sync('on') 必须幂等，不得重复注册监听或订阅
  h.win.__agPrismSidebar.sync({ sidebarStudio: 'on' });
  assert.equal(h.getCounts().docListeners, 8);
  assert.equal(h.getCounts().winListeners, 1);
  assert.equal(h.getCounts().storeSubCount, 1);
  assert.equal(h.getCounts().routerSubCount, 1);

  // 3) sync({ sidebarStudio: 'off' }) 切出关闭态 -> 对称清理全部监听、定时器、订阅、hostOps 与 sendGuard
  h.win.__agPrismSidebar.sync({ sidebarStudio: 'off' });
  assert.equal(h.win.__agPrismSidebarHostOps, undefined, '切回 off 必须注销 window.__agPrismSidebarHostOps');
  assert.equal(h.getCounts().docListeners, 0, '切回 off 必须移除全部 8 个 document 监听');
  assert.equal(h.getCounts().winListeners, 0, '切回 off 必须移除 window resize 监听');
  assert.equal(h.getCounts().activeTimers, 0, '切回 off 必须清理 probeTimer/syncTimer');
  assert.equal(h.getCounts().storeUnsubCount, 1, '切回 off 必须执行 host.unsubStore');
  assert.equal(h.getCounts().routerUnsubCount, 1, '切回 off 必须执行 host.unsubRouter');
  assert.equal(h.fakeLsWrapper.sendUserCascadeMessage, h.origWrapperSend, '切回 off 必须卸载 wrapper sendGuard');
  assert.equal(h.fakeLsClient.sendUserCascadeMessage, h.origRawSend, '切回 off 必须卸载 rawLs sendGuard');
  assert.equal(h.win.__agPrismSidebar.getState().listenersBound, false);

  h.win.__agPrismSidebar.destroy();
});

test('P1 sidebar-client: Chat send guard & reserveSession enforce strict fail-closed while Code sends pass through untouched', async () => {
  let startAttempt = 0;
  const h = createSidebarClientHarness({
    assignments: {
      'chat-iso-1': { mode: 'chat', placement: { kind: 'knowledge', folderId: null }, continuation: 'ready' },
    },
    startCascadeImpl: async () => {
      startAttempt += 1;
      throw new Error(`customAgentSpec unsupported stage ${startAttempt}`);
    },
  });

  h.win.__agPrismSidebar.sync({ sidebarStudio: 'on' });
  await new Promise((r) => setTimeout(r, 10));

  // 1) Chat 会话发送时若 applyChatIsolationToSendArg 内部抛错（如恶意/损坏 getter），必须 fail-closed 抛错拒发，绝不调用原始 orig
  const brokenChatReq = { cascadeId: 'chat-iso-1' };
  Object.defineProperty(brokenChatReq, 'cascadeConfig', {
    enumerable: true,
    get() {
      throw new Error('simulated isolation serialization failure');
    },
  });

  assert.throws(
    () => h.fakeLsWrapper.sendUserCascadeMessage(brokenChatReq),
    /Chat isolation failed \(fail-closed\)/,
    'wrapper sendGuard 对 Chat 会话隔离异常必须 fail-closed 抛错'
  );
  assert.equal(h.wrapperSendCalls.length, 0, 'fail-closed 拒发绝不得调用原始 lsWrapper.sendUserCascadeMessage');

  assert.throws(
    () => h.fakeLsClient.sendUserCascadeMessage(brokenChatReq),
    /Chat isolation failed \(fail-closed\)/,
    'rawLs sendGuard 对 Chat 会话隔离异常必须 fail-closed 抛错'
  );
  assert.equal(h.rawSendCalls.length, 0, 'fail-closed 拒发绝不得调用原始 rawLs.sendUserCascadeMessage');

  // 2) Code 会话不受影响，原样零改动放行（包括未在 assignments 中的普通会话与原型键名）
  const codeReq = { cascadeId: 'code-session-ok', cascadeConfig: { plannerConfig: { planModel: 1532 } } };
  await h.fakeLsWrapper.sendUserCascadeMessage(codeReq);
  assert.equal(h.wrapperSendCalls.length, 1);
  assert.equal(h.wrapperSendCalls[0], codeReq, 'Code 会话必须原样引用透传');

  const protoNameReq = { cascadeId: 'toString', cascadeConfig: {} };
  await h.fakeLsWrapper.sendUserCascadeMessage(protoNameReq);
  assert.equal(h.wrapperSendCalls.length, 2);
  assert.equal(h.wrapperSendCalls[1], protoNameReq);

  // 3) reserveSession：带 customAgentSpec 的 3 种创建变体均失败后必须 fail-closed 报错拒绝，严禁第 4 次以裸 basePayload 创建会话
  const resv = await h.win.__agPrismSidebarHostOps.reserveSession({
    idempotencyKey: 'fc-reserve-1',
    scopeRef: 'scope-knowledge-default',
    kind: 'knowledge',
    title: 'Fail Closed Test',
    dirPath: '',
  });
  assert.equal(resv.ok, false, '全部隔离变体失败后 reserveSession 必须拒绝');
  assert.match(resv.error, /chat-isolation-spec-rejected/);
  assert.equal(h.startCalls.length, 3, '严禁降级发起第 4 次无 customAgentSpec 的裸 startCascade');
  assert.ok(
    h.startCalls.every((payload) => Boolean(payload && payload.customAgentSpec)),
    '所有尝试发起的 Chat startCascade 请求必须携带 customAgentSpec'
  );
  assert.equal(h.win.__agPrismSidebarLastStartStage, 'rejected-fail-closed');

  h.win.__agPrismSidebar.destroy();
});

test('P1 sidebar-client: bounded FIFO cap (<= 256) and off/destroy clear for reservedMap, deliveredMap, and sessionModelOverrides', async () => {
  const h = createSidebarClientHarness();
  h.win.__agPrismSidebar.sync({ sidebarStudio: 'on' });
  await new Promise((r) => setTimeout(r, 10));

  const ops = h.win.__agPrismSidebarHostOps;
  for (let i = 0; i < 270; i++) {
    const r = await ops.reserveSession({
      idempotencyKey: `resv-key-${i}`,
      scopeRef: 'scope-knowledge-default',
      kind: 'knowledge',
      title: `T${i}`,
      dirPath: '',
    });
    assert.equal(r.ok, true);
    const d = await ops.deliverFirstMessage({
      idempotencyKey: `deliv-key-${i}`,
      cascadeId: r.cascadeId,
      message: `msg-${i}`,
      scopeRef: 'scope-knowledge-default',
      kind: 'knowledge',
      dirPath: '',
    });
    assert.equal(d.status, 'delivered');
  }

  const stPeak = h.win.__agPrismSidebar.getState();
  assert.equal(stPeak.mapSizes.reserved, 256, 'host.reservedMap 必须严格封顶 256 条');
  assert.equal(stPeak.mapSizes.delivered, 256, 'host.deliveredMap 必须严格封顶 256 条');

  // 最早写入的第 0 条已被 FIFO 淘汰，最新的第 269 条仍命中幂等缓存
  const chkOld = await ops.checkDeliveryStatus({ idempotencyKey: 'deliv-key-0', cascadeId: 'any' });
  const chkNew = await ops.checkDeliveryStatus({ idempotencyKey: 'deliv-key-269', cascadeId: 'any' });
  assert.equal(chkOld.delivered, false, '超出 256 上限的最旧条目应被 FIFO 淘汰');
  assert.equal(chkNew.delivered, true, '最新条目应保留在容量窗口内');

  // 切 off 必须立即清空全部有界 Map
  h.win.__agPrismSidebar.sync({ sidebarStudio: 'off' });
  const stOff = h.win.__agPrismSidebar.getState();
  assert.equal(stOff.mapSizes.reserved, 0);
  assert.equal(stOff.mapSizes.delivered, 0);
  assert.equal(stOff.mapSizes.modelOverrides, 0);

  h.win.__agPrismSidebar.destroy();
});

test('P1 translator-service: blocks IPv6 SSRF variants, tightens keyless ULA regex, and never leaks 3rd-party API keys to api.openai.com', async () => {
  // 1) IPv6 SSRF 变体全覆盖：IPv4-mapped / IPv4-compatible / NAT64 / fe80::/10 / fd00:ec2::254 / ::
  const blockedUrls = [
    'http://[::ffff:169.254.169.254]/latest/meta-data/',
    'http://[::ffff:a9fe:a9fe]/latest/meta-data/',
    'http://[0:0:0:0:0:ffff:a9fe:a9fe]/v1',
    'http://[::ffff:100.100.100.200]/latest/meta-data/',
    'http://[::ffff:6464:64c8]/latest/meta-data/',
    'http://[::169.254.169.254]/latest/meta-data/',
    'http://[::a9fe:a9fe]/latest/meta-data/',
    'http://[::100.100.100.200]/latest/meta-data/',
    'http://[::6464:64c8]/latest/meta-data/',
    'http://[64:ff9b::169.254.169.254]/latest/meta-data/',
    'http://[64:ff9b::a9fe:a9fe]/latest/meta-data/',
    'http://[64:ff9b::100.100.100.200]/v1',
    'http://[64:ff9b::6464:64c8]/v1',
    'http://[fe80::1]:8000/v1',
    'http://[fe80::a9fe:a9fe]/v1',
    'http://[febf::1234]:8000/v1',
    'http://[fd00:ec2::254]/latest/meta-data/',
    'http://[::]:11434/v1',
    'http://[0:0:0:0:0:0:0:0]:11434/v1',
    'http://127.0.0.1:6379/v1',
    'file:///etc/passwd',
  ];

  for (const url of blockedUrls) {
    const check = validateOpenAiBaseUrl(url);
    assert.equal(check.ok, false, `validateOpenAiBaseUrl 必须拦截危险地址: ${url}`);
    assert.equal(isKeylessAllowedEndpoint(url), false, `isKeylessAllowedEndpoint 必须拒绝危险地址: ${url}`);
    // 兼容既有 normalizeOpenAiBaseUrl 单测契约
    assert.equal(normalizeOpenAiBaseUrl(url), 'https://api.openai.com/v1');
  }

  // 2) 合法本地大模型与普通内网地址保留放行
  const allowedLocalUrls = [
    'http://127.0.0.1:11434/v1',
    'http://[::1]:8000/v1',
    'http://localhost:1234/v1',
    'http://192.168.1.20:11434/v1',
    'http://10.0.0.8:8000/v1',
    'http://172.16.0.5:8000/v1',
    'http://100.64.0.12:8000/v1',
    'http://[fd12:3456::1]:11434/v1',
    'http://[fc00::1]:11434/v1',
  ];
  for (const url of allowedLocalUrls) {
    assert.equal(validateOpenAiBaseUrl(url).ok, true, `合法本地/内网端点不应被误杀: ${url}`);
    assert.equal(isKeylessAllowedEndpoint(url), true, `合法本地/内网端点应允许免 Key: ${url}`);
  }

  // 3) isKeylessAllowedEndpoint 公网 fc/fd 域名前缀禁止误放行
  assert.equal(isKeylessAllowedEndpoint('https://fc2.com/v1'), false);
  assert.equal(isKeylessAllowedEndpoint('https://fd-evil.com/v1'), false);
  assert.equal(isKeylessAllowedEndpoint('https://fc00.example.com/v1'), false);
  assert.equal(isKeylessAllowedEndpoint('https://fd99.example.org/v1'), false);

  // 4) 防第三方 Key 静默泄漏至 api.openai.com
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prism-sec-trans-'));
  try {
    const fetchCalls = [];
    const spyFetch = async (url, init) => {
      fetchCalls.push({ url: String(url), headers: init?.headers || {} });
      return new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const svc = new ThoughtTranslatorService({ configDir: tmpDir, fetchImpl: spyFetch });
    const thirdPartyKey = 'sk-thirdparty-secret-99887766';

    // 4a) 直接传被拦截的 baseUrl + 第三方 Key 给 fetchModels / testConnection
    const fmRes = await svc.fetchModels({ baseUrl: 'http://[::a9fe:a9fe]/v1', apiKey: thirdPartyKey });
    assert.equal(fmRes.ok, false);
    assert.match(fmRes.error, /Blocked Base URL/);

    const tcRes = await svc.testConnection({
      baseUrl: 'http://[64:ff9b::169.254.169.254]/v1',
      apiKey: thirdPartyKey,
      model: 'deepseek-chat',
    });
    assert.equal(tcRes.ok, false);
    assert.match(tcRes.error, /Blocked Base URL/);

    // 4b) 通过 saveConfig 保存含被拦截 URL + 第三方 Key 的 profile，再执行翻译与跨重启加载，均绝不发往 api.openai.com
    svc.saveConfig({
      activeProfileId: 'evil-ssrf',
      profiles: [
        {
          id: 'evil-ssrf',
          name: 'Blocked Custom',
          baseUrl: 'http://169.254.169.254/latest/meta-data/',
          apiKey: thirdPartyKey,
          model: 'deepseek-chat',
        },
      ],
    });
    const trRes = await svc.translateThought({
      text: 'Verify third-party API key is never leaked to OpenAI when custom baseUrl is blocked.',
      mode: 'ai',
    });
    assert.equal(trRes.ok, false);
    assert.match(trRes.error, /Blocked Base URL/);

    // 模拟重启重新从磁盘加载该配置，同样必须拒绝而非落盘成 api.openai.com
    const svcReloaded = new ThoughtTranslatorService({ configDir: tmpDir, fetchImpl: spyFetch });
    const trReloaded = await svcReloaded.translateThought({
      text: 'Reloaded profile with blocked baseUrl must stay fail-closed without hitting OpenAI.',
      mode: 'ai',
    });
    assert.equal(trReloaded.ok, false);
    assert.match(trReloaded.error, /Blocked Base URL/);
    assert.equal(fetchCalls.length, 0, '任何被拦截 URL 场景下 fetchImpl 必须为 0 次调用，绝不把第三方 Key 发往 api.openai.com');

    // 4c) 留空 baseUrl 时明确使用默认 OpenAI 端点（回归兼容）
    svcReloaded.saveConfig({
      activeProfileId: 'default-openai',
      profiles: [{ id: 'default-openai', name: 'Default OpenAI', baseUrl: '', apiKey: thirdPartyKey, model: 'gpt-4o-mini' }],
    });
    const okModels = await svcReloaded.fetchModels({});
    assert.equal(okModels.ok, true);
    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0].url, 'https://api.openai.com/v1/models');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('P2 live-host-adapter: rejects __proto__/constructor/prototype cascadeId and uses null-prototype lookup map', () => {
  const adapter = createLiveHostAdapter();
  adapter.syncFromRenderer({
    catalog: {
      health: 'ready',
      items: [
        { cascadeId: '__proto__', title: 'evil1', status: 'idle', updatedAt: 10 },
        { cascadeId: 'constructor', title: 'evil2', status: 'idle', updatedAt: 11 },
        { cascadeId: 'prototype', title: 'evil3', status: 'idle', updatedAt: 12 },
        { cascadeId: 'safe-chat-1', title: 'Safe Chat', status: 'idle', updatedAt: 20 },
      ],
    },
  });

  const snap = adapter.getCatalog();
  assert.deepEqual(snap.items.map((x) => x.cascadeId), ['safe-chat-1']);
  assert.equal(Object.prototype.hasOwnProperty.call(snap.lastKnownById, '__proto__'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(snap.lastKnownById, 'constructor'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(snap.lastKnownById, 'prototype'), false);
  assert.equal(snap.lastKnownById['safe-chat-1']?.title, 'Safe Chat');
});

test('P2 pulse-dashboard: store LRU preserves processing background sessions & bounds cachedSession; trajectory-reader drops stale 0-byte zombies; usage & background-statistics cap caches and surface diagnostics', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prism-sec-pulse-'));
  try {
    // 1) MetricsStore: LRU 淘汰跳过活跃后台处理态会话，且 cachedSession 复用 32 条上限淘汰
    const mkGuid = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
    const bgId = mkGuid(0);
    const fakeClient = {
      reader: {},
      call: async () => ({}),
      discover: async () => ({ pid: 1, port: 1234, csrf: 'tok' }),
      trajectory: async (id) => ({
        trajectory: { cascadeId: id, steps: [], generatorMetadata: [] },
        numTotalSteps: 0,
        numTotalGeneratorMetadata: 0,
        status: 'IDLE',
      }),
    };
    const fakeHistory = {
      directory: path.join(tmpDir, 'history-v1'),
      load: async (_scope, id) => ({
        metrics: {
          conversationId: id,
          tokens: { totalTokens: 100, inputTokens: 80, outputTokens: 20, outputRequests: 1 },
          cache: { readTokens: 0, writeTokens: 0 },
          requests: 1,
        },
        savedAt: new Date().toISOString(),
      }),
      save: async () => ({ savedAt: new Date().toISOString() }),
    };
    const fakeBackground = {
      state: (id) => (id === bgId ? { state: 'processing', stage: 'steps' } : null),
      request: () => true,
      reset() {},
      dispose() {},
    };
    const store = new MetricsStore(fakeClient, {
      dataDir: tmpDir,
      history: fakeHistory,
      background: fakeBackground,
      transcripts: null,
    });
    // 放入一个活跃后台处理态会话
    store.sessions.set(bgId, { data: null, backgroundOnly: true, pending: null, updatedAt: 0 });
    for (let i = 1; i <= 40; i++) {
      await store.session(mkGuid(i), true);
    }
    assert.equal(store.sessions.has(bgId), true, 'LRU 淘汰必须跳过活跃后台处理态会话');
    assert.ok(store.sessions.size <= 32, `session() 后 sessions.size 必须 <= 32，实测 ${store.sessions.size}`);

    // cachedSession() 同样复用上限淘汰（非后台会话不突破 32 上限）
    store.sessions.clear();
    for (let i = 100; i < 145; i++) {
      await store.cachedSession(mkGuid(i));
    }
    assert.ok(store.sessions.size <= 32, `cachedSession() 后 sessions.size 必须 <= 32，实测 ${store.sessions.size}`);

    // 2) TrajectoryReader.read(): 调用方 isCurrent() 变 false 中止时清理 0 字节僵尸条目
    let stillCurrent = true;
    const reader = new TrajectoryReader({
      now: () => Date.now(),
      discover: async () => ({ pid: 1, port: 4321, csrf: 'tok' }),
      call: async (method) => {
        if (method === 'GetAllCascadeTrajectories') {
          stillCurrent = false; // 模拟中途调用方失活（未触发 reset）
          return { trajectorySummaries: { [bgId]: { stepCount: 1, status: 'IDLE', lastModifiedTime: '2026-11-20T00:00:00Z' } } };
        }
        return { steps: [], generatorMetadata: [] };
      },
    });
    await assert.rejects(
      () => reader.read(bgId, { isCurrent: () => stillCurrent }),
      /后台已重新连接/
    );
    assert.equal(reader.entries.has(bgId), false, 'isCurrent() 变 false 中止后不得在 entries 中残留 0 字节僵尸条目');

    // 3) UsageLedger.caches & diskSummaryRetries 容量上限 <= 64 且 DesktopUsage.dispose() 同步置空 ledger._cache
    const ledger = new UsageLedger(path.join(tmpDir, 'usage-v1'));
    for (let i = 0; i < 80; i++) {
      ledger.cache = { key: `k:${i}`, revision: i, value: { totalTokens: i } };
      ledger.diskSummaryRetry = { key: `r:${i}`, at: Date.now() + 30000 };
    }
    assert.equal(ledger.caches.size, 64, 'UsageLedger.caches 必须封顶 64 条');
    assert.equal(ledger.diskSummaryRetries.size, 64, 'UsageLedger.diskSummaryRetries 必须封顶 64 条');
    assert.ok(ledger._cache !== null);

    const desktopUsage = new DesktopUsage(store, ledger);
    desktopUsage.dispose();
    assert.equal(ledger._cache, null, 'DesktopUsage.dispose() 必须同步置空 ledger._cache');
    assert.equal(ledger._diskSummaryRetry, null, 'DesktopUsage.dispose() 必须同步置空 ledger._diskSummaryRetry');
    assert.equal(ledger.caches.size, 0);
    assert.equal(ledger.diskSummaryRetries.size, 0);

    // 4) BackgroundStatistics 识别 Worker OOM 并暴露可诊断提示（worker-oom）
    const fakeWorker = new EventEmitter();
    fakeWorker.terminate = async () => {};
    const bg = new BackgroundStatistics({
      directory: path.join(tmpDir, 'collection-jobs'),
      workerFactory: () => fakeWorker,
    });
    const reqOk = bg.request(LOCAL_SCOPE, bgId, { port: 4321, csrf: 'tok' });
    assert.equal(reqOk, true);
    for (let i = 0; i < 300 && fakeWorker.listenerCount('error') === 0; i += 1) {
      await new Promise((r) => setTimeout(r, 5));
    }
    assert.ok(fakeWorker.listenerCount('error') > 0, 'BackgroundStatistics must attach worker error listener');
    fakeWorker.emit('error', Object.assign(new Error('Worker terminated due to reaching memory limit'), { code: 'ERR_WORKER_OUT_OF_MEMORY' }));
    for (let i = 0; i < 100 && bg.state(bgId)?.state !== 'limited'; i += 1) {
      await new Promise((r) => setTimeout(r, 5));
    }
    const st = bg.state(bgId);
    assert.equal(st?.state, 'limited');
    assert.equal(st?.reason, 'worker-oom');
    assert.equal(bg.lastDiagnostic?.reason, 'worker-oom');
    assert.match(String(bg.lastDiagnostic?.detail || ''), /maxOldGenerationSizeMb=48/);
    bg.dispose();
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
