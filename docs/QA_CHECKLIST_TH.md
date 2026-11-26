# QA Checklist — ฉบับภาษาไทย

## Locale / content
- [ ] ภาษาเริ่มต้นเป็น Thai (`th-TH`) เมื่อยังไม่มี preference
- [ ] ผู้ใช้เลือก English (`en-US`) ได้
- [ ] locale parity validation ผ่าน
- [ ] ไม่มี placeholder หายหรือเปลี่ยนชื่อ
- [ ] ไม่มีข้อความ UI ที่ควรแปลหลุดเป็นภาษาที่ไม่คาดหมาย
- [ ] glossary ใช้สม่ำเสมอ

## Thai typography / layout
- [ ] สระและวรรณยุกต์ไม่ชนกัน
- [ ] line-height อ่านง่าย
- [ ] ข้อความยาวไม่ทับปุ่มหรือ icon
- [ ] tooltip และ dialog ไม่ล้น viewport
- [ ] ทดสอบหน้าต่างขนาดเล็กและใหญ่
- [ ] ทดสอบ light และ dark themes

## Functional regression
- [ ] Settings บันทึกและโหลดค่าภาษาได้
- [ ] เปลี่ยนภาษาแล้ว UI อัปเดตโดยไม่ต้อง reinstall (ถ้าระบบรองรับ)
- [ ] fallback ทำงานเมื่อ key ไม่มี
- [ ] feature behavior ไม่เปลี่ยนจาก localization โดยไม่ตั้งใจ
- [ ] installer / uninstaller ผ่าน regression tests

## Evidence
- [ ] แนบ commit SHA และ diff
- [ ] แนบ test command และผลลัพธ์จริง
- [ ] แนบ screenshot ของหน้าจอที่เปลี่ยน
- [ ] ทดสอบกับ Antigravity จริง
- [ ] ตรวจ license, NOTICE และ third-party attribution
