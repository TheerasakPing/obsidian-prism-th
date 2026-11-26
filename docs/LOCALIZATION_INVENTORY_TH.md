# Source-to-Localization Inventory — Obsidian Prism Thai Edition

ตรวจสอบเมื่อ: 2026-11-27
Branch: `integration/upstream-v1.0.8-beta.3`
Upstream baseline: `41cc4817bf6da79688236f42905450bdf93f40b1`

## 1. Executive summary

**สถานะ: เปิดภาษาไทยเป็นค่าเริ่มต้นของ Thai Edition แล้ว — UI dictionary แปลไทย 333/345 keys (96.5%)** อีก 12 รายการเป็นชื่อแบรนด์ ชื่อธีม ชื่อฟอนต์ และหน่วย/ตัวเลขที่คงรูปเดิมโดยตั้งใจ

- ระบบ UI localization เดิมใช้ JavaScript table ใน `i18n-locales.js` ไม่ได้อ่าน `locales/*/messages.json`
- ระบบ locale metadata และ runtime รองรับ 9 ภาษาแล้ว: `zh-CN`, `zh-TW`, `en`, `ja`, `ko`, `es`, `fr`, `de`, `th-TH`
- `UI_TABLE` มี 345 message keys; มีคอลัมน์ภาษาไทยครบ 345 แถว โดยแปลเป็นไทย 333 keys (96.5%); อีก 12 keys คงชื่อแบรนด์/ชื่อธีม/ชื่อฟอนต์/หน่วยเป็นภาษาเดิม
- `th-TH` ถูก normalize เป็นภาษาไทยแล้ว; UI keys ที่แปลแล้วจะแสดงไทย ส่วนคีย์ที่ยังไม่แปลใช้ English fallback เพื่อป้องกันข้อความว่าง
- Settings language selector, settings schema, CDP config validators และ tests รองรับ locale ที่ 9 (`th-TH`) แล้ว
- Runtime มี early-boot locale slice 77 keys; เพิ่ม Thai แล้วและผ่าน Channel 1 size gate (546,895 bytes จากเพดาน 546,954 bytes)

## 2. Localization architecture map

| Layer | Source files | Current behavior | Thai work required |
|---|---|---|---|
| Language metadata | `i18n-core.js` | 9 language IDs, labels, normalization, Intl/HTML lang mapping | เพิ่ม `th-TH`, label `ไทย`, metadata และ aliases แล้ว |
| Main UI dictionary | `i18n-locales.js` | `UI_TABLE` มี 345 keys × 9 locales; 333 keys แปลไทย อีก 12 keys เป็นชื่อแบรนด์/ชื่อธีม/ชื่อฟอนต์/หน่วย | เพิ่ม Thai table, formatters และ helper formats แล้ว |
| Settings selector | `settings-panel.js` | Language options sourced from `i18nCore.LANG_OPTIONS` | เพิ่ม Thai option แล้ว; ค่าเริ่มต้น Thai Edition เป็น `th-TH` |
| Settings schema | `settings-panel.js` | `language` allowlist มี 9 locales; default เป็น `th-TH` | เพิ่ม `th-TH`; ตั้งค่า default Thai Edition เป็น `th-TH` แล้ว |
| Config transport | `cdp.js` | `language` and `lang` validators รองรับ 9 locales | เพิ่ม Thai ใน validators และ boot config paths แล้ว |
| Main UI runtime | `ui-runtime.js` | `getLang()` normalizes selected/browser language; `uiText()` reads full locale module | รองรับ Thai ใน normalization, html lang, early runtime and generated strings |
| Early boot slice | `cdp.js`, `ui-runtime.js` | 77 runtime UI keys are sent before full locale module loads; has separate compact formatter tables | เพิ่ม Thai values; 77-key slice ผ่าน size gate และมี regression tests แล้ว |
| Daemon locale | `sidecars/daemon/main.mjs` | Independent language resolver for storage/daemon status messages | เพิ่ม Thai resolution แล้ว; ตรวจข้อความ dynamic เพิ่มเติมต่อ |
| Home/feature panels | `home-studio-panel.js`, `settings-panel.js`, `ui-runtime.js` | Main panels consume `getUiStrings()`; Home Studio also has a separate compact locale table | เพิ่ม Thai ในทั้ง main dictionary และ Home Studio's separate table แล้ว; audit aria labels/remaining literals ต่อ |
| Host UI translation | `vendor/host-i18n/host-i18n-runtime.js`, `vendor/host-i18n/swarm-i18n-runtime.js` | Separate host DOM translator with Chinese-provider detection/yield behavior; not the Prism UI dictionary | Treat as separate scope; do not assume translating Prism UI translates Antigravity host UI |
| Usage analytics | `usage-core.js` | Separate 9-locale labels for ranges, dates, quota pace and ETA | เพิ่ม Thai เป็น locale ที่ 9 และแปล ranges, date formatting, quota labels/ETA แล้ว |
| Storage archive Workbench | `sidecars/daemon/conversation-archive.mjs` | Independent 9-locale report dictionary | เพิ่ม Thai labels/report templates and language normalization; tests cover Thai |
| Pulse fallback widget | `vendor/pulse-dashboard/inline-fallback.js` | Independent provider-facing fallback labels | เพิ่ม Thai fallback labels and `th-TH` resolver; compatibility widget is separate |
| Omni Viewer | `vendor/omni-viewer/workbench-page.mjs`, `omni-client.js`, `omni-server.mjs` | Independent 8+1 locale tables and server allowlist | เพิ่ม Thai Workbench dictionary, client fallback, server allowlist and tests |
| Prompt Suggester | `vendor/prompt-suggester/suggester-settings-ui.js`, `suggester-service.mjs` | Independent 8-locale settings and service resolver | เพิ่ม Thai dictionary (38 keys) and service normalization |
| Effort Slider / Host Workbench | `vendor/effort-slider/upstream-client.js`, `host-workbench-enhancer.js` | Separate fallback dictionaries for slider and sidebar controls | เพิ่ม Thai labels and locale normalization แล้ว |
| Locale JSON scaffold | `locales/en-US/messages.json`, `locales/th-TH/messages.json` | 18 keys each; validated for parity but not imported by runtime | Either wire as canonical source/build input or remove duplication after architecture decision |

## 3. Verified counts and behavior

- `i18n-core.js`: 9 `LANG_OPTIONS`; Thai (`th-TH`) is listed with label `ไทย` and is the Thai Edition default.
- `i18n-locales.js`: `LANG_IDS` = 9; `UI_TABLE` = 345 keys; all rows contain 9 non-empty strings; 333/345 Thai translations (96.5%); 12 brand/theme/font/unit labels intentionally retain canonical terms.
- `getUiStrings()` returns 349 keys because it adds derived/helper strings beyond `UI_TABLE`.
- `RUNTIME_UI_KEYS`: 77 keys used for the early boot slice.
- `DICT_ROWS`: empty; `resolveLocaleBundle()` returns no DOM dictionary for `en` and only exposes the supported CJK bundles.
- `getUiStrings('th-TH')` resolves to Thai UI copy; brand/technical identifiers remain in their canonical form; dynamic Swarm and Show More formatters have Thai variants.
- `locales/en-US/messages.json` and `locales/th-TH/messages.json`: 18 keys each; locale parity script passes, but these scaffold JSON catalogs are not yet the source of the main UI dictionary.
- Main UI consumers: `ui-runtime.js`, `settings-panel.js`, `home-studio-panel.js`, and `sidecars/daemon/main.mjs`; independent locale consumers `usage-core.js`, `conversation-archive.mjs`, and Pulse fallback now have Thai support too. Third-party Pulse compatibility UI and Antigravity host UI remain separate scope.
- Main UI boot payload: 77 runtime keys, Thai slice JSON size 3,187 bytes; Channel 1 generated payload 546,946 bytes (under the 546,954-byte hard limit).
- Focused Thai/i18n regression run (2026-11-27): 57 passed, 0 failed, 0 skipped.
- Latest full `npm test` run: one known failure in the macOS universal `.app` build test; Swift linker cannot find x86_64 `swiftCompatibility56` and `swiftCompatibilityConcurrency` libraries in the active Command Line Tools SDK. The failure occurs in `compileUniversalSwift()` while compiling the x86_64 watcher target, not in Thai localization.
- Previous complete full-suite baseline: 812 tests; 794 passed, 1 failed, 17 skipped. Additional vendor-locale regression baseline: 124 passed, 0 failed. The known macOS universal Swift build limitation is unchanged.

## 4. Critical compatibility constraints

1. Do not add Thai only to `LANG_OPTIONS`. The same language set is duplicated in settings schema, `cdp.js` validators, locale table indexes, daemon resolution, early-boot slices and tests.
2. Preserve all original eight locale IDs and translations; Thai is appended as locale 9 without changing existing index/order semantics.
3. `isCjkLanguage()` must remain false for Thai. Thai line breaking/font handling must not be routed through CJK-only behavior.
4. Preserve `auto` as a setting value; resolve Thai browser preferences (`th`, `th-TH`, `th_TH.UTF-8`) to `th-TH` without changing legacy `yue` migration.
5. Keep host DOM translation separate from Prism's own interface. The existing host translator has provider detection and rollback protections that must not be bypassed.
6. Keep placeholders, formatting tokens, enum values, API names, CSS selectors and command strings unchanged.

## 5. Recommended implementation order

1. [x] กำหนด locale contract และ fallback policy สำหรับ Thai Edition.
2. [x] เพิ่ม Thai normalization, metadata และ unit tests.
3. [x] เพิ่ม locale ที่ 9; แปล 333/345 UI keys (96.5%); คง 12 brand/theme/font/unit labels ตามต้นฉบับ.
4. [x] เพิ่ม Thai ใน early-boot 77-key slice และ compact formatters; ผ่าน Channel 1 byte gate.
5. [x] เพิ่ม Thai ใน Settings, config schema, CDP validators, Home Studio และ daemon.
6. [x] เพิ่ม Thai ใน Usage Analytics, Storage Archive Workbench และ Pulse fallback; มี regression tests.
7. [ ] Host application QA บน Antigravity จริง; ตรวจ Xcode full toolchain แล้ว build universal macOS อีกครั้ง.

## 6. Not in scope for the first Thai UI milestone

- Translating Antigravity's own host interface or third-party extension UI. The separate Pulse compatibility widget remains EN/Chinese-oriented and needs its own pass.
- Translating user-authored prompts, chat content, code, model names, protocol identifiers or upstream technical identifiers.
- Claiming production readiness before testing on the real host application.
