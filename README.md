# Obsidian Prism — Thai Edition (ชุมชนภาษาไทย)

รุ่นภาษาไทยที่พัฒนาต่อยอดจาก [Obsidian Prism](https://github.com/RMvdesi/obsidian-prism) สำหรับ Google Antigravity โดยมุ่งให้ **ภาษาไทยเป็นภาษาเริ่มต้น** และเลือกใช้ภาษาอังกฤษได้

> **สถานะโครงการ: ตั้งต้น Repository** — โครงสร้างและเอกสารกำลังจัดทำ ยังไม่ใช่แพ็กเกจติดตั้งหรือรุ่นที่พร้อมใช้งานจริง

## เป้าหมาย

- แปล UI, Settings, dialogs, tooltips, notifications และเอกสารเป็นภาษาไทยอย่างสม่ำเสมอ
- รองรับภาษาอังกฤษเป็นทางเลือก โดยแยกข้อความภาษาออกจาก business logic
- รักษาความสามารถและพฤติกรรมเดิมของ upstream ให้มากที่สุด
- ตรวจสอบการแสดงผลภาษาไทย: ฟอนต์, line-height, การตัดคำ, overflow และข้อความยาว
- ไม่ใช้ข้อมูลจำลองเพื่ออ้างว่าฟีเจอร์ทำงานจริง
- รักษาลิขสิทธิ์ ใบอนุญาต และเครดิตของ upstream และ third-party ทุกส่วน

## ภาษา

- `th-TH`: ภาษาเริ่มต้น
- `en-US`: ภาษาอังกฤษ

## โครงสร้าง

- `locales/`: ข้อความแปลแยกตาม locale
- `docs/`: แผนโครงการ แนวทางแปล และขั้นตอนนำ upstream เข้ามา
- `scripts/`: เครื่องมือตรวจสอบความครบถ้วนของ locale

## เอกสาร

- [แผนโครงการและ PRD](docs/PROJECT_PLAN_TH.md)
- [แนวทางการแปล](docs/LOCALIZATION_GUIDE_TH.md)
- [การนำ upstream เข้ามาอย่างปลอดภัย](docs/UPSTREAM_INTEGRATION.md)

## Upstream และใบอนุญาต

ต้นทาง: [RMvdesi/obsidian-prism](https://github.com/RMvdesi/obsidian-prism)

Upstream ระบุ `GPL-3.0-only` ใน `package.json` และมีเงื่อนไขการคง notices/attribution ใน `NOTICE` โปรดอ่าน [LICENSE](LICENSE), [NOTICE](NOTICE) และ [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) ก่อนนำหรือแจกจ่ายซอร์สที่ดัดแปลง

## สถานะการพัฒนา

| งาน | สถานะ |
|---|---|
| สร้าง public repository | เสร็จ |
| วางเอกสารเริ่มต้น | กำลังดำเนินการ |
| ตรวจสอบ upstream และ license | ตรวจ metadata และ notices เบื้องต้นแล้ว |
| นำ source code upstream เข้ามา | ยังไม่เริ่ม |
| แปล UI ครบทุกจุด | ยังไม่เริ่ม |
| ทดสอบบน Antigravity จริง | ยังไม่เริ่ม |
| สร้างแพ็กเกจติดตั้ง | ยังไม่เริ่ม |

## ข้อจำกัดความเกี่ยวข้อง

โครงการนี้เป็นงานชุมชนที่พัฒนาแยกต่างหาก ไม่ใช่โครงการทางการ ไม่ได้รับการรับรอง หรือสนับสนุนโดย Google LLC หรือผู้พัฒนา upstream การกล่าวถึง Google และ Antigravity มีไว้เพื่ออธิบายความเข้ากันได้เท่านั้น
