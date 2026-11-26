# รายงานตรวจสอบ Upstream — Obsidian Prism Thai Edition

ตรวจสอบเมื่อ: 2026-11-27
Upstream: https://github.com/RMvdesi/obsidian-prism
Branch: `main`
Commit ที่ตรวจสอบ: `41cc4817bf6da79688236f42905450bdf93f40b1`
Release metadata: `1.0.8-beta.3`

## 1. ผลการตรวจสอบโครงสร้าง

| รายการ | ผล |
|---|---:|
| ไฟล์ทั้งหมด (blob) | 242 |
| directory entries | 39 |
| ขนาดรวมตาม Git tree | 25,733,806 bytes (ประมาณ 24.5 MiB) |
| JavaScript modules (.js) | 53 |
| ES modules (.mjs) | 126 |
| Markdown (.md) | 12 |
| JSON (.json) | 8 |
| CSS (.css) | 6 |
| WebP assets | 6 |

ไฟล์สำคัญที่พบ ได้แก่ `package.json`, `plugin.json`, `i18n-core.js`, `i18n-locales.js`, `ui-runtime.js`, `settings-panel.js`, `style.css`, `inject.js`, `remove.js`, `sidecars/`, `vendor/`, `installer/`, `tools/`, `workbench/` และ `test/`

## 2. Metadata และ runtime

- package version: `1.0.8-beta.3`
- license: `GPL-3.0-only`
- Node.js engine: `>=22.0.0`
- upstream test command: `npm test`
- test runner: Node.js built-in test runner
- มี workflow สำหรับ CI, CodeQL และ Release

## 3. Localization ที่มีอยู่แล้วใน upstream

พบ `i18n-core.js` และ `i18n-locales.js` ซึ่งเป็นจุดเริ่มต้นสำหรับตรวจระบบ locale เดิมก่อนออกแบบ Thai-first resolver ห้ามสร้าง i18n runtime ซ้ำโดยยังไม่ตรวจ call sites และ fallback behavior ของ upstream

## 4. ผลการนำเข้า source จริง

**นำ source upstream เข้ามาแล้วใน local integration branch**:
- Local repository: /Volumes/Data/workspace/DWB/obsidian-prism-th
- Branch: integration/upstream-v1.0.8-beta.3
- Upstream remote: upstream
- Origin tracking: `origin/integration/upstream-v1.0.8-beta.3` (push สำเร็จและตั้ง upstream tracking แล้ว)
- Commit baseline: 41cc4817bf6da79688236f42905450bdf93f40b1
- วิธีนำเข้า: git merge --allow-unrelated-histories เพื่อรักษา commit provenance
- Conflict ที่จัดการ: .gitignore, README.md, package.json
- ย้าย community contribution guide ไป docs/CONTRIBUTING_TH.md เพื่อให้ผ่าน upstream repository hygiene gate
- upstream source files ที่นำเข้ามาครบตาม tree; integration branch ถูก push ไป GitHub แล้วและตั้ง upstream tracking สำเร็จ

package.json คง package identity และ version ของ upstream (obsidian-prism, 1.0.8-beta.3) เพื่อรักษาความเข้ากันได้กับ plugin manifest, installer และ updater พร้อมเพิ่ม validate:locales script และ metadata ของ Thai Edition

ไฟล์ LICENSE, NOTICE และ THIRD_PARTY_NOTICES.md คงตาม upstream โดยตรง ไม่มีการแทนที่ด้วยข้อความสรุป

## 5. การแก้ไขเพื่อให้ผ่าน macOS path validation

บน macOS /tmp เป็น system symlink ไป /private/tmp ทำให้ upstream path guard ปฏิเสธ temp paths ที่ปลอดภัยใน unit tests

แก้ไข helper ใน:
- remove.js
- tools/install-plugin.cjs
- vendor/wallpaper/wallpaper-service.mjs

หลักการแก้: อนุญาตเฉพาะ system temp-root alias ที่ OS กำหนดเป็น trusted boundary แต่ยังตรวจ symlink ใน path components ใต้ root และคง redline/path restrictions เดิม

ผลทดสอบเฉพาะ:
- test/gates/repo-hygiene.test.mjs: 3 passed
- test/uninstall-and-storage.test.mjs: 8 passed
- Wallpaper service และ red-team tests ที่เลือก: 9 passed
- Thai/English locale validation: 18 keys ต่อภาษา, parity ผ่าน
- Brand/license contract test: ผ่าน
- README installation/diagnostics contract test: ผ่าน

## 6. ผลทดสอบ upstream suite บนเครื่องนี้

คำสั่ง: npm test

ผลล่าสุด:
- Tests: 808
- Passed: 790
- Failed: 1
- Skipped: 17
- Duration: ประมาณ 62 วินาที

Failure เดียว:
- macOS universal .app build test ต้อง link x86_64 Swift binary
- เครื่องนี้ใช้ Command Line Tools SDK ที่มี Swift compatibility libraries เฉพาะ arm64, arm64e
- linker จึงไม่พบ __swift_FORCE_LOAD_$_swiftCompatibility56 และ __swift_FORCE_LOAD_$_swiftCompatibilityConcurrency สำหรับ x86_64

นี่เป็นข้อจำกัดของ Swift toolchain/SDK ที่ติดตั้งในเครื่องนี้ ไม่ใช่ผลทดสอบที่ยืนยันว่า source compile ผ่านสำหรับ universal binary ต้องติดตั้ง/เลือก Xcode toolchain ที่มี universal SDK support แล้วรัน macOS build test ซ้ำก่อนออก release

## 7. Acceptance criteria ของ Phase 1

- [x] source tree จาก commit ที่ระบุถูกนำเข้ามาใน integration branch
- [x] upstream commit provenance ตรวจสอบย้อนกลับได้
- [x] package scripts และ installer source ถูกนำเข้าครบ
- [x] LICENSE, NOTICE และ third-party notices คงตาม upstream
- [x] Node.js 22 ใช้งานได้
- [x] locale validator ผ่าน
- [x] regression suite รันครบ 808 tests; มี 1 environment-specific macOS universal-link failure ที่ต้องแก้ toolchain ก่อน release
- [ ] macOS universal build ผ่านบน Xcode toolchain ที่รองรับ x86_64
- [x] source-to-localization inventory ก่อนเริ่มแก้ UI (`docs/LOCALIZATION_INVENTORY_TH.md`)

## 7. สคริปต์เตรียม import

เพิ่ม `scripts/prepare-upstream-import.sh` เพื่อเตรียม import แบบมี guard:
- บังคับให้รันจาก clone ของ Thai Edition บน branch `main`
- ปฏิเสธเมื่อ working tree ไม่สะอาด
- fetch upstream และตรวจว่า SHA ตรงกับ baseline ที่ audit ไว้
- สร้าง branch แยก `integration/upstream-v1.0.8-beta.3`
- merge แบบไม่ commit เพื่อให้ตรวจและแก้ conflict ด้วยคนก่อน

สคริปต์นี้ถูก execute แล้วบน local clone; merge conflict ถูกแก้ไขและ source import อยู่ใน integration branch โดยยังไม่ push หรือสร้าง release
