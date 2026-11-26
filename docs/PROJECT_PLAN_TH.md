# แผนโครงการและ PRD — Obsidian Prism Thai Edition

- Repository: `TheerasakPing/obsidian-prism-th`
- Upstream: `RMvdesi/obsidian-prism`
- เป้าหมายภาษา: Thai-first (`th-TH`) พร้อม English (`en-US`)
- สถานะ: Initial planning / repository scaffold

## 1. วิสัยทัศน์

สร้างรุ่นภาษาไทยที่ผู้ใช้ภาษาไทยสามารถติดตั้ง ตั้งค่า และใช้งานความสามารถของ Obsidian Prism ได้โดยไม่ต้องพึ่งการแปล UI ด้วยตนเอง พร้อมรักษาพฤติกรรมเดิมของ upstream และเปิดให้สลับเป็นภาษาอังกฤษได้

## 2. ขอบเขตผลิตภัณฑ์

### ต้องมี (P0)
1. ภาษาไทยเป็นค่าเริ่มต้นเมื่อยังไม่มีค่าภาษาที่ผู้ใช้เลือก
2. สลับภาษาไทย/อังกฤษได้จาก Settings
3. แปล UI, Settings, dialogs, tooltips, notifications, empty states และ error messages
4. ใช้ locale keys แทนข้อความ hard-coded ในส่วนที่แก้ไข
5. ตรวจ locale parity: keys ต้องตรงกันและไม่มีค่าที่หาย
6. แสดงผลภาษาไทยถูกต้องทั้ง light/dark themes และหน้าต่างขนาดต่าง ๆ
7. รักษา upstream attribution, GPL terms, NOTICE และ third-party notices

### ควรมี (P1)
- คู่มือภาษาไทยและ README ภาษาอังกฤษ
- คำศัพท์มาตรฐานและ glossary สำหรับศัพท์เทคนิค
- ตรวจสอบ placeholder, interpolation, pluralization และข้อความยาว
- เพิ่ม CI สำหรับ locale validation และ upstream regression tests

### อาจมี (P2)
- เพิ่ม locale อื่นเมื่อ Thai/English เสถียร
- ระบบช่วยผู้ร่วมแปลและรายงานคำแปลที่ไม่เหมาะสม
- ภาพหน้าจอและคู่มือเริ่มต้นภาษาไทย

## 3. ข้อกำหนดด้านภาษา

- ใช้ภาษาไทยที่กระชับ เป็นธรรมชาติ และคงความหมายเชิงเทคนิค
- คงชื่อผลิตภัณฑ์ ชื่อโมเดล คำสั่ง CLI, API, file path และ code identifier ตามต้นฉบับ
- ใช้คำศัพท์เดียวกันตลอดแอป
- ห้ามแปลค่าที่เป็น protocol, enum, key, selector, CSS class หรือ machine-readable token
- ห้ามตัด placeholder เช่น `{name}`, `%s`, `{{value}}` หรือ ICU expressions
- ภาษาอังกฤษต้องเป็น fallback เมื่อ key ในภาษาไทยขาด แต่ CI ต้องรายงาน key ที่ขาดเสมอ

## 4. ข้อกำหนดด้านคุณภาพ

- ไม่เปลี่ยน business logic เพียงเพื่อให้แปลข้อความได้
- ไม่ลบ feature หรือเปลี่ยน default behavior โดยไม่มีเหตุผลและ regression test
- ไม่ใช้ mock data ในการยืนยันการทำงาน
- การเปลี่ยนแปลงทุกส่วนต้องมีหลักฐาน: diff, test output และขั้นตอนทำซ้ำ
- ทดสอบบน host application จริงก่อนประกาศว่าใช้งานได้

## 5. แผนดำเนินงาน

### Phase 0 — Repository foundation
- [x] สร้าง public repository
- [ ] เพิ่มเอกสารและโครงสร้าง locale
- [ ] ตรวจสอบ license, NOTICE และ third-party inventory
- [ ] บันทึก upstream commit SHA และ release baseline

### Phase 1 — Upstream baseline
- [ ] นำ source ที่ได้รับอนุญาตเข้ามาโดยรักษาประวัติ/attribution ตามความเหมาะสม
- [ ] ตรวจ package scripts, dependencies, installers และ test suite
- [ ] รันทดสอบ upstream baseline ก่อนแก้ไข
- [ ] จัดทำ source-to-localization inventory

### Phase 2 — Localization architecture
- [ ] ระบุ i18n runtime และจุดเรียกข้อความทั้งหมด
- [ ] เพิ่ม locale resolver โดย default เป็น `th-TH`
- [ ] เพิ่ม fallback `en-US`
- [ ] ย้ายข้อความ hard-coded เป็น locale keys ทีละส่วน
- [ ] เพิ่ม locale parity validator

### Phase 3 — Thai localization
- [ ] แปล UI หลักและ navigation
- [ ] แปล Settings และ dialogs
- [ ] แปล tooltips, notifications, errors และ empty states
- [ ] แปล onboarding, documentation และ release notes
- [ ] ตรวจคำศัพท์และความสอดคล้องโดย reviewer ภาษาไทย

### Phase 4 — Visual and functional QA
- [ ] ตรวจฟอนต์ไทยและ fallback font stack
- [ ] ตรวจ line-height, baseline, wrapping และ truncation
- [ ] ตรวจ responsive layout และข้อความยาว
- [ ] ทดสอบ light/dark themes
- [ ] ทดสอบ feature regression และ installer/uninstaller
- [ ] ทดสอบบน Antigravity จริงทั้งระบบที่รองรับ upstream

### Phase 5 — Release
- [ ] ตรวจ license obligations และ source distribution
- [ ] สร้าง release artifacts จาก source ที่ตรวจสอบแล้ว
- [ ] แนบ checksums และ build provenance
- [ ] เผยแพร่ changelog และ known issues
- [ ] ไม่เรียก release ว่า official

## 6. Definition of Done

งาน localization จะถือว่าเสร็จเมื่อ:
1. locale validation ผ่านและไม่มี key ขาดโดยไม่ตั้งใจ
2. ไม่มี placeholder เสียหรือข้อความ UI หลักหลุดเป็นภาษาที่ไม่คาดหมาย
3. test suite ที่เกี่ยวข้องผ่าน พร้อมบันทึกผลจริง
4. ทดสอบ host application จริงและแนบหลักฐาน
5. license/NOTICE/third-party notices ครบ
6. README ระบุ compatibility, installation, rollback และ known issues ตามจริง

## 7. ความเสี่ยง

- Upstream เปลี่ยน DOM/selector ทำให้ localization hook ใช้ไม่ได้
- ภาษาไทยมีความยาวต่างจากจีน/อังกฤษและทำให้ layout ล้น
- การคัดลอกไฟล์ vendor อาจมี license แยกจาก GPL หลัก
- การเปลี่ยน locale อาจกระทบ host UI หรือ extension อื่น
- การอัปเดต upstream อาจชนกับ patch ภาษาไทย

ลดความเสี่ยงด้วย baseline tests, minimal patches, locale isolation, attribution inventory และการบันทึก upstream SHA ทุกครั้ง
