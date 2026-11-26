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

## 4. ข้อสรุปด้านการนำเข้าซอร์ส

**ยังไม่ได้นำ source code 242 ไฟล์เข้ามาใน repository นี้** การตรวจครั้งนี้เป็น static repository-tree และ package metadata audit เท่านั้น ไม่มีการอ้างว่าทดสอบแอปหรือทดสอบ upstream suite แล้ว

เหตุผลที่ยังไม่ทำการคัดลอกไฟล์ผ่าน API ทีละไฟล์: upstream มีไฟล์รวมประมาณ 24.5 MiB และมี assets/binaries รวมถึง vendor และ installer หลายแพลตฟอร์ม การคัดลอกเฉพาะบางไฟล์เสี่ยงทำให้ dependency graph, installer และ license inventory ไม่ครบ ควรนำเข้าด้วย Git เพื่อรักษา commit history และ file modes

## 5. ขั้นตอนนำเข้าที่แนะนำ

ทำจากเครื่องพัฒนาที่มี Git และ Node.js 22 ขึ้นไป หลัง clone repository นี้ และตรวจว่า working tree สะอาด:

```bash
git status --short
git remote add upstream https://github.com/RMvdesi/obsidian-prism.git
git fetch upstream --tags
git switch -c integration/upstream-v1.0.8-beta.3
git merge --allow-unrelated-histories --no-commit 41cc4817bf6da79688236f42905450bdf93f40b1
```

จากนั้นจัดการไฟล์ที่ชนกันอย่างตั้งใจ:
1. `README.md`: ใช้ README ของ Thai Edition และเพิ่ม upstream attribution/compatibility links ให้ครบ
2. `package.json`: ใช้ upstream dependencies และ scripts เป็นฐาน แล้วคงชื่อแพ็กเกจ Thai Edition พร้อมเพิ่ม `validate:locales`
3. `.gitignore`: รวมกฎของทั้งสอง repository โดยไม่ลบกฎที่ป้องกัน secrets/build artifacts
4. `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES.md`: ตรวจ diff และคงข้อความ upstream/third-party ตามต้นฉบับ ห้ามเขียนทับแบบย่อ
5. เก็บ locale files และเอกสาร Thai Edition ไว้

หลัง resolve conflicts:

```bash
git add -A
git status
git commit -m "chore: import upstream Obsidian Prism v1.0.8-beta.3"
npm ci
npm test
npm run validate:locales
```

อย่า push หรือสร้าง release จนกว่าการตรวจ license, dependency audit และ upstream tests จะเสร็จ

## 6. Acceptance criteria ของ Phase 1

- [ ] source tree จาก commit ที่ระบุครบ
- [ ] upstream history/commit provenance ตรวจสอบย้อนกลับได้
- [ ] package scripts และ dependencies ไม่สูญหาย
- [ ] LICENSE, NOTICE และ third-party notices ผ่านการตรวจ diff
- [ ] `npm ci` ผ่านบน Node.js 22+
- [ ] `npm test` ผ่าน พร้อมบันทึก log จริง
- [ ] locale validator ผ่าน
- [ ] มี source-to-localization inventory ก่อนเริ่มแก้ UI


## 7. สคริปต์เตรียม import

เพิ่ม `scripts/prepare-upstream-import.sh` เพื่อเตรียม import แบบมี guard:
- บังคับให้รันจาก clone ของ Thai Edition บน branch `main`
- ปฏิเสธเมื่อ working tree ไม่สะอาด
- fetch upstream และตรวจว่า SHA ตรงกับ baseline ที่ audit ไว้
- สร้าง branch แยก `integration/upstream-v1.0.8-beta.3`
- merge แบบไม่ commit เพื่อให้ตรวจและแก้ conflict ด้วยคนก่อน

สคริปต์นี้ **ยังไม่ได้ถูก execute** ใน environment ของผู้ใช้ และจะไม่ push หรือสร้าง release เอง การ execute ต้องทำจาก local clone ที่มี Git พร้อมตรวจ conflict ก่อน commit
