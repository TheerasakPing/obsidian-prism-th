# แนวทางนำ Upstream เข้ามา

Upstream: https://github.com/RMvdesi/obsidian-prism

## ข้อมูลที่ตรวจพบ

- Repository upstream เป็น public repository
- `package.json` ระบุ version `1.0.8-beta.3`
- `package.json` ระบุ license `GPL-3.0-only`
- upstream มี `LICENSE`, `NOTICE` และ `THIRD_PARTY_NOTICES.md`
- upstream README ระบุ Node.js `>=22.0.0`
- default branch ที่ตรวจพบ: `main`

ข้อมูลนี้เป็น snapshot ณ วันที่เริ่มจัดทำ ไม่ใช่การรับประกันว่าเป็น release ล่าสุดตลอดไป

## ข้อกำหนดก่อนนำ source

1. บันทึก upstream commit SHA และ tag/release ที่เลือก
2. ตรวจ LICENSE, NOTICE, THIRD_PARTY_NOTICES และ license ของ dependency/vendor
3. รักษา copyright headers และ attribution ตามที่กำหนด
4. ทำเครื่องหมายไฟล์ที่แก้ไขอย่างเด่นชัดตาม upstream NOTICE พร้อมวันที่แก้ไข
5. เก็บ diff ที่แยก upstream baseline กับ Thai localization patches ได้
6. เผยแพร่ corresponding source และปฏิบัติตาม GPL-3.0-only
7. ห้ามใช้ชื่อ/บัญชีผู้พัฒนา upstream เพื่อสื่อว่าเป็นผู้รับรองหรือเป็น release ทางการ
8. ห้ามลบหรือเขียนทับ notices ของ third-party components

## กลยุทธ์แนะนำ

- ใช้ upstream เป็น baseline ที่ระบุ SHA ชัดเจน
- แยกการเปลี่ยนแปลง localization ออกจาก feature changes
- เก็บ locale resources ใน `locales/` และหลีกเลี่ยงการแก้ logic โดยไม่จำเป็น
- ทำ regression tests ก่อนและหลัง localization
- อัปเดต upstream ด้วยการ rebase/merge ที่ตรวจสอบได้ ไม่คัดลอกไฟล์แบบไม่รู้ที่มา

## ข้อควรระวัง

อย่าเพิ่งนำ source ทั้งหมดเข้ามาจนกว่าจะตรวจสอบ provenance ของไฟล์ vendor และข้อกำหนดใน notices ครบ การมี GPL หลักไม่ได้แปลว่า third-party notices ทุกชิ้นจะละเว้นได้
