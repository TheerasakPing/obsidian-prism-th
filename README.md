# Obsidian Prism — Thai Edition (ชุมชนภาษาไทย)

รุ่นภาษาไทยที่พัฒนาต่อยอดจาก [Obsidian Prism](https://github.com/RMvdesi/obsidian-prism) สำหรับ Google Antigravity โดยมุ่งให้ **ภาษาไทยเป็นภาษาเริ่มต้น** และเลือกใช้ภาษาอังกฤษได้

> **สถานะโครงการ: นำซอร์ส upstream เข้ามาแล้ว (integration branch)** — ยังไม่ใช่รุ่นที่ผ่านการทดสอบหรือแพ็กเกจติดตั้งพร้อมใช้งาน

## เป้าหมาย

- แปล UI, Settings, dialogs, tooltips, notifications และเอกสารเป็นภาษาไทยอย่างสม่ำเสมอ
- รองรับภาษาอังกฤษเป็นทางเลือก โดยแยกข้อความภาษาออกจาก business logic
- รักษาความสามารถและพฤติกรรมเดิมของ upstream ให้มากที่สุด
- ตรวจสอบการแสดงผลภาษาไทย: ฟอนต์, line-height, การตัดคำ, overflow และข้อความยาว
- ไม่ใช้ข้อมูลจำลองเพื่ออ้างว่าฟีเจอร์ทำงานจริง
- รักษาลิขสิทธิ์ ใบอนุญาต และเครดิตของ upstream และ third-party ทุกส่วน

## รุ่นและแหล่งที่มา

- Thai Edition package: `obsidian-prism-th`
- Upstream version: `1.0.8-beta.3`
- Audited upstream commit: `41cc4817bf6da79688236f42905450bdf93f40b1`
- ภาษาเป้าหมาย: `th-TH` (ค่าเริ่มต้น) และ `en-US`
- Node.js: `>=22.0.0`

## เริ่มต้นสำหรับนักพัฒนา

```bash
npm install
npm run validate:locales
npm test
```

อย่าติดตั้งลง Antigravity หลักหรือใช้ installer จนกว่า regression tests และการตรวจสอบบน host จริงจะผ่าน

## ติดตั้งจากซอร์ส (สำหรับนักพัฒนาเท่านั้น)

ยังไม่ใช่แพ็กเกจติดตั้งที่ผ่านการรับรอง ก่อนติดตั้งลง Antigravity จริงให้รันทดสอบทั้งหมดก่อน

คำสั่ง: npm install
คำสั่ง: npm run install:plugin
ตรวจสอบ: node tools/install-plugin.cjs --status

ตรวจผลให้แน่ใจว่า installed: true และ daemon ทำงานปกติ หากยังไม่ผ่านอย่าติดตั้งทับ environment หลัก

## โครงสร้างสำคัญ

- `locales/`: ข้อความแปลแยกตาม locale
- `i18n-core.js`, `i18n-locales.js`: ระบบ localization หลักของ upstream (8 ภาษา, UI table 345 keys)
- `docs/LOCALIZATION_INVENTORY_TH.md`: แผนผัง runtime, call sites, locale counts และลำดับการเพิ่มภาษาไทย
- `docs/`: แผนโครงการ แนวทางแปล และบันทึกการตรวจสอบ
- `scripts/`: เครื่องมือตรวจสอบ locale และเตรียม integration

## เอกสาร

- [แผนโครงการและ PRD](docs/PROJECT_PLAN_TH.md)
- [แนวทางการแปล](docs/LOCALIZATION_GUIDE_TH.md)
- [การนำ upstream เข้ามาอย่างปลอดภัย](docs/UPSTREAM_INTEGRATION.md)
- [รายงานตรวจสอบ upstream](docs/UPSTREAM_AUDIT_TH.md)
- [QA checklist](docs/QA_CHECKLIST_TH.md)

## Upstream และใบอนุญาต

ต้นทาง: [RMvdesi/obsidian-prism](https://github.com/RMvdesi/obsidian-prism)

โครงการต้นทางระบุ `GPL-3.0-only` โปรดอ่าน [LICENSE](LICENSE), [NOTICE](NOTICE), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) และ [CITATION.cff](CITATION.cff) ก่อนนำไปใช้หรือแจกจ่ายซอร์สที่ดัดแปลง ต้องคงเครดิตและเงื่อนไขของ third-party components ตามต้นฉบับ

## สถานะการพัฒนา

| งาน | สถานะ |
|---|---|
| สร้าง public repository และเอกสารตั้งต้น | เสร็จ |
| ตรวจสอบ upstream tree และบันทึก baseline SHA | เสร็จ |
| นำ source upstream เข้ามาใน integration branch | เสร็จ — 242 upstream files, merge ยังอยู่บน integration branch |
| ตรวจ dependencies และรันทดสอบ upstream | ดูผล CI matrix ล่าสุดใน `docs/UPSTREAM_AUDIT_TH.md` |
| ตรวจสอบ i18n runtime และ locale call sites | เสร็จ — ดู `docs/LOCALIZATION_INVENTORY_TH.md` |
| เพิ่มภาษาไทยใน UI runtime | เสร็จในระดับ code — 333/345 keys (96.5%); รอ host QA |
| แปล UI เป็นภาษาไทย | ยังไม่เริ่ม |
| ทดสอบบน Antigravity จริง | ยังไม่เริ่ม |
| สร้างแพ็กเกจติดตั้ง | ยังไม่เริ่ม |

## เครดิตซอฟต์แวร์ต้นทางและ third-party

- [0DNANCY/agy-claude-style](https://github.com/0DNANCY/agy-claude-style)
- [ATtacK030130/antigrative-dashboard](https://github.com/ATtacK030130/antigrative-dashboard)
- [LLYSH-HANNARI/antigravity-Codex-Claude-effort-slider](https://github.com/LLYSH-HANNARI/antigravity-Codex-Claude-effort-slider)
- [yiheng8023/antigravity-chinese](https://github.com/yiheng8023/antigravity-chinese)
- [Nwflower/dsh-claude-style](https://github.com/Nwflower/dsh-claude-style)
- [Microqian2th/dsh-codex-effort-slider](https://github.com/Microqian2th/dsh-codex-effort-slider)
- [mobius/dsh-performance-slider](https://github.com/mobius/dsh-performance-slider)
- [claudenoshujin/claude-web](https://github.com/claudenoshujin/claude-web)
- [wp3171216237/dsh-TUI](https://github.com/wp3171216237/dsh-TUI)

เครดิตและเงื่อนไขของแต่ละส่วนอยู่ใน NOTICE และ THIRD_PARTY_NOTICES.md

## หมายเหตุการติดตั้งสำหรับผู้ช่วย AI

ห้ามใช้ `npm run inject` เพียงอย่างเดียวในการติดตั้ง ต้องใช้คำสั่งติดตั้งเต็มรูปแบบ `npm run install:plugin` ก่อน จากนั้นตรวจสถานะด้วย `node tools/install-plugin.cjs --status`

หลังเปิด Thought Translator ให้ใช้ปุ่ม “วินิจฉัยในคลิกเดียว” (1-Click Diagnose) เพื่อตรวจสอบ daemon bridge, mode/model, proxy และการเชื่อมต่อ upstream

## ข้อจำกัดความเกี่ยวข้อง

**Obsidian Prism is an independent open-source project and is not affiliated with or endorsed by Google LLC.**

โครงการนี้เป็นงานชุมชนที่พัฒนาแยกต่างหาก ไม่ใช่โครงการทางการ ไม่ได้รับการรับรอง หรือสนับสนุนโดย Google LLC หรือผู้พัฒนา upstream การกล่าวถึง Google และ Antigravity มีไว้เพื่ออธิบายความเข้ากันได้เท่านั้น


**Thai Edition status:** locale `th-TH` is the default; 333/345 main UI strings are translated, with 16 brand/technical labels intentionally unchanged. Host-application QA is still pending.
