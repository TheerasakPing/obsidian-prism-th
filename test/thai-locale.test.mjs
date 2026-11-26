import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const core = require('../i18n-core.js');
const locales = require('../i18n-locales.js');
const cdp = require('../cdp.js');
const settings = require('../settings-panel.js');

test('Thai locale is normalized and exposed without CJK classification', () => {
  assert.equal(core.normalizeLanguage('th'), 'th-TH');
  assert.equal(core.normalizeLanguage('th_TH'), 'th-TH');
  assert.equal(core.normalizeLanguage('th-TH.UTF-8'), 'th-TH');
  assert.equal(core.htmlLangAttr('th-TH'), 'th-TH');
  assert.equal(core.intlLocale('th-TH'), 'th-TH');
  assert.equal(core.isCjkLanguage('th-TH'), false);
  assert.ok(core.LANG_OPTIONS.some((item) => item.id === 'th-TH' && item.label === 'ไทย'));
});

test('Thai locale has complete table shape, translated UI coverage, and Thai dynamic formatters', () => {
  assert.ok(locales.LANG_IDS.includes('th-TH'));
  assert.equal(Object.keys(locales.UI_TABLE).length, 345);
  for (const [key, row] of Object.entries(locales.UI_TABLE)) {
    assert.equal(row.length, 9, `${key} should have 9 locale slots`);
    assert.ok(row[8].trim(), `${key} Thai/fallback slot must not be empty`);
  }
  const ui = locales.getUiStrings('th-TH');
  assert.equal(ui.setLanguageTitle, 'ภาษาของส่วนติดต่อ');
  assert.equal(ui.tabOverview, 'ภาพรวม');
  assert.equal(ui.swarmSplitSub(60, 40), 'แชตหลัก 60% · เอเจนต์ 40%');
  assert.equal(ui.showMoreN(2), 'แสดงเพิ่มอีก 2 รายการ');
});

test('Thai locale is accepted by settings schema and CDP validators', () => {
  assert.equal(cdp.DEFAULT_CONFIG.language, 'th-TH');
  assert.equal(cdp.DEFAULT_CONFIG.lang, 'th-TH');
  assert.equal(cdp.validateConfigEntry('language', 'th-TH'), true);
  assert.equal(cdp.validateConfigEntry('lang', 'th-TH'), true);
  assert.equal(settings.validateImportedConfigJson('{"language":"th-TH"}').settings.language, 'th-TH');
});


test('Thai locale reaches independent vendor surfaces', async () => {
  require('../vendor/prompt-suggester/suggester-settings-ui.js');
  const suggester = globalThis.__agPrismSuggesterSettingsUi;
  assert.equal(suggester.normalizeLang('th_TH'), 'th-TH');
  assert.equal(Object.keys(suggester.SUGGESTER_I18N['th-TH']).length, Object.keys(suggester.SUGGESTER_I18N.en).length);
  assert.equal(suggester.SUGGESTER_I18N['th-TH'].title, 'แนะนำพรอมป์ต์ถัดไป (เบตา)');

  const omni = await import('../vendor/omni-viewer/workbench-page.mjs');
  assert.equal(Object.keys(omni.WORKBENCH_I18N).length, 46);
  assert.equal(Object.keys(omni.THAI_WORKBENCH_I18N).length, 46);
  assert.ok(Object.values(omni.THAI_WORKBENCH_I18N).every((value) => typeof value === 'string' && value.length > 0));
  const root = path.resolve(import.meta.dirname, '..');
  const omniClient = fs.readFileSync(path.join(root, 'vendor/omni-viewer/omni-client.js'), 'utf8');
  const omniServer = fs.readFileSync(path.join(root, 'vendor/omni-viewer/omni-server.mjs'), 'utf8');
  const effortSlider = fs.readFileSync(path.join(root, 'vendor/effort-slider/upstream-client.js'), 'utf8');
  const hostEnhancer = fs.readFileSync(path.join(root, 'host-workbench-enhancer.js'), 'utf8');
  assert.match(omniClient, /'th-TH': 8/);
  assert.match(omniServer, /'th-TH'/);
  assert.match(effortSlider, /\"th-TH\"/);
  assert.match(hostEnhancer, /'th-TH'/);
});
