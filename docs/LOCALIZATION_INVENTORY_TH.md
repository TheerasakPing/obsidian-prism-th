# Source-to-Localization Inventory — Obsidian Prism Thai Edition

ตรวจสอบเมื่อ: 2026-11-27
Branch: `integration/upstream-v1.0.8-beta.3`
Upstream baseline: `41cc4817bf6da79688236f42905450bdf93f40b1`

## 1. Executive summary

**สถานะ: ยังไม่พร้อมเปิดใช้ภาษาไทยใน UI หลัก** แม้จะมี `locales/th-TH/messages.json` แล้วก็ตาม เพราะไฟล์ JSON นี้ยังไม่ได้ถูกเรียกใช้จาก runtime ของ upstream

- ระบบ UI localization เดิมใช้ JavaScript table ใน `i18n-locales.js` ไม่ได้อ่าน `locales/*/messages.json`
- ภาษาที่รองรับจริงใน runtime ปัจจุบันมี 8 ภาษา: `zh-CN`, `zh-TW`, `en`, `ja`, `ko`, `es`, `fr`, `de`
- `UI_TABLE` มี 345 message keys; `getUiStrings()` สร้าง helper เพิ่ม ทำให้ผลลัพธ์ที่คืนมามี 349 keys
- `th-TH` ถูก normalize/fallback ไปเป็น English (`en`) ใน locale resolver ปัจจุบัน จึงยังไม่มีคำแปลไทยในหน้าจอจริง
- Settings language selector, settings schema, CDP config validators และ tests ต่าง hard-code รายการ 8 ภาษา
- Runtime ยังมี early-boot locale slice แยกจาก full locale table; ต้องเพิ่ม Thai ให้ครบทั้งสองเส้นทาง

## 2. Localization architecture map

| Layer | Source files | Current behavior | Thai work required |
|---|---|---|---|
| Language metadata | `i18n-core.js` | 8 language IDs, labels, normalization, Intl/HTML lang mapping | เพิ่ม `th-TH`, label `ไทย`, `th-TH` metadata และ normalization aliases |
| Main UI dictionary | `i18n-locales.js` | `UI_TABLE` มี 345 keys × 8 languages; fallback unknown language to English | เพิ่มคอลัมน์/locale Thai ให้ครบทุก key พร้อม helper formats |
| Settings selector | `settings-panel.js` | Language options sourced from `i18nCore.LANG_OPTIONS` | เพิ่ม Thai option และตรวจ default/auto selection |
| Settings schema | `settings-panel.js` | `language` allowed values are a fixed 8-item list; default is `zh-CN` | เพิ่ม `th-TH`; เปลี่ยน default เฉพาะ Thai Edition โดยคง migration เดิม |
| Config transport | `cdp.js` | `language` and `lang` validators enumerate 8 languages | เพิ่ม Thai ในทั้งสอง validator และ boot config paths |
| Main UI runtime | `ui-runtime.js` | `getLang()` normalizes selected/browser language; `uiText()` reads full locale module | รองรับ Thai ใน normalization, html lang, early runtime and generated strings |
| Early boot slice | `cdp.js`, `ui-runtime.js` | 77 runtime UI keys are sent before full locale module loads; has separate compact formatter tables | เพิ่ม Thai values and test startup-before-full-dictionary path |
| Daemon locale | `sidecars/daemon/main.mjs` | Has independent language resolver and locale-dependent status/storage messages | เพิ่ม Thai resolution and message coverage; keep server/client language consistent |
| Home/feature panels | `home-studio-panel.js`, `settings-panel.js`, `ui-runtime.js` | Consume `getUiStrings()` through shared helpers | Audit remaining literals, aria labels, title/placeholder and notifications |
| Host UI translation | `vendor/host-i18n/host-i18n-runtime.js`, `vendor/host-i18n/swarm-i18n-runtime.js` | Separate host DOM translator with Chinese-provider detection/yield behavior; not the Prism UI dictionary | Treat as separate scope; do not assume translating Prism UI translates Antigravity host UI |
| Locale JSON scaffold | `locales/en-US/messages.json`, `locales/th-TH/messages.json` | 18 keys each; validated for parity but not imported by runtime | Either wire as canonical source/build input or remove duplication after architecture decision |

## 3. Verified counts and behavior

- `i18n-core.js`: 8 `LANG_OPTIONS`; Thai is not listed.
- `i18n-locales.js`: `LANG_IDS` = 8; `UI_TABLE` = 345 keys; all 345 rows currently contain 8 non-empty strings.
- `getUiStrings()` returns 349 keys because it adds derived/helper strings beyond `UI_TABLE`.
- `RUNTIME_UI_KEYS`: 77 keys used for the early boot slice.
- `DICT_ROWS`: empty; `resolveLocaleBundle()` returns no DOM dictionary for `en` and only exposes the supported CJK bundles.
- `getUiStrings('th-TH')` currently resolves to English. This was executed against the checked-out code, not inferred from file names.
- `locales/en-US/messages.json` and `locales/th-TH/messages.json`: 18 keys each; locale parity script passes, but no production runtime imports these JSON files.
- Main UI consumers found: `ui-runtime.js`, `settings-panel.js`, `home-studio-panel.js`, `sidecars/daemon/main.mjs`; test files exercise the same dictionary.
## 4. Critical compatibility constraints

1. Do not add Thai only to `LANG_OPTIONS`. The same language set is duplicated in settings schema, `cdp.js` validators, locale table indexes, daemon resolution, early-boot slices and tests.
2. Preserve the current eight locale IDs and all existing translations; add Thai without changing their index/order semantics unexpectedly.
3. `isCjkLanguage()` must remain false for Thai. Thai line breaking/font handling must not be routed through CJK-only behavior.
4. Preserve `auto` as a setting value; resolve Thai browser preferences (`th`, `th-TH`, `th_TH.UTF-8`) to `th-TH` without changing legacy `yue` migration.
5. Keep host DOM translation separate from Prism's own interface. The existing host translator has provider detection and rollback protections that must not be bypassed.
6. Keep placeholders, formatting tokens, enum values, API names, CSS selectors and command strings unchanged.

## 5. Recommended implementation order

1. Define a single supported-locale contract and Thai Edition default/fallback policy.
2. Add Thai to core normalization and language metadata; add focused unit tests first.
3. Extend the main locale table to 9 languages and translate all 345 entries; verify 9 non-empty entries per row and preserve placeholders.
4. Extend early boot's 77-key slice and compact formatters so no English flash occurs before full locale loading.
5. Extend settings schema, selector, CDP validators/config export/import and daemon resolver.
6. Audit hard-coded UI strings and dynamic notifications; migrate in small feature groups with regression tests.
7. Run locale validation, targeted i18n tests, full upstream tests, then host-application QA.

## 6. Not in scope for the first Thai UI milestone

- Translating Antigravity's own host interface or third-party extension UI.
- Translating user-authored prompts, chat content, code, model names, protocol identifiers or upstream technical identifiers.
- Claiming production readiness before testing on the real host application.
