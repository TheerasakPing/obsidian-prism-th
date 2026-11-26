# Contributing

ขอบคุณที่สนใจร่วมพัฒนา Obsidian Prism Thai Edition

## ก่อนเริ่ม

1. อ่าน [แผนโครงการ](docs/PROJECT_PLAN_TH.md)
2. อ่าน [แนวทางการแปล](docs/LOCALIZATION_GUIDE_TH.md)
3. อ่าน [LICENSE](LICENSE), [NOTICE](NOTICE) และ [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
4. อย่าเพิ่ม source code จาก upstream หรือ third-party โดยไม่บันทึกแหล่งที่มาและ license

## การส่งคำแปล

- แก้ไข locale resources แยกจาก logic
- รักษา keys และ placeholders ให้ตรงกันทุกภาษา
- ใช้ glossary กลาง
- แนบภาพหน้าจอเมื่อแก้ layout หรือข้อความที่มีผลต่อ UI
- ห้ามใช้ mock data เป็นหลักฐานว่าฟีเจอร์ทำงานจริง

## ตรวจสอบก่อน Pull Request

```bash
npm run validate:locales
```

หากมีการเปลี่ยนแปลง source หรือ behavior ให้แนบคำสั่งทดสอบและผลลัพธ์จริงด้วย
