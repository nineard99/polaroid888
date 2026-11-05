# โพลารอยด์ 888 — เว็บพรีออเดอร์จองคิวถ่ายรูป

Next.js 16 (deploy บน Vercel) + Google Sheet เป็นฐานข้อมูลผ่าน Google Apps Script

- เลือกวัน + เวลา 17:00–20:00 ทุกวัน (รอบละ 30 นาที: 17:00 / 17:30 / ... / 19:30)
- กรอกชื่อ เบอร์โทร → สแกน QR พร้อมเพย์ → แนบสลิป
- **กันจองเวลาซ้ำ**: Apps Script ใช้ `LockService` เช็กแล้วบันทึกในจังหวะเดียว ถ้าสองคนกดพร้อมกัน คนที่สองจะได้ข้อความ "เวลานี้มีคนจองไปแล้ว"
- ข้อมูลเข้า Google Sheet แท็บ `Bookings` · สลิปเก็บในโฟลเดอร์ Google Drive (มีลิงก์ในชีต)
- ทีมงานเปลี่ยนคอลัมน์ **สถานะ** ได้: `รอตรวจสลิป / ยืนยันแล้ว / ถ่ายเสร็จแล้ว / ยกเลิก` — ตั้งเป็น **ยกเลิก** แล้วคิวนั้นจะว่างให้คนอื่นจองได้ทันที

## 1. ตั้งค่า Google Sheet (ครั้งเดียว)

1. สร้าง Google Sheet ใหม่ → เมนู **Extensions → Apps Script**
2. ลบโค้ดเดิม แล้ววางเนื้อหาจาก `google-apps-script/Code.gs`
3. **Project Settings (⚙️) → Script Properties → Add**: `SECRET` = รหัสลับยาว ๆ (เช่นจาก `openssl rand -hex 24`)
4. กลับไปหน้า Editor เลือกฟังก์ชัน `setup` → **Run** → อนุญาตสิทธิ์ (Sheets + Drive)
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - กด Deploy แล้วคัดลอก URL ที่ลงท้ายด้วย `/exec`

> แก้ `Code.gs` ภายหลัง ต้อง **Deploy → Manage deployments → Edit → New version** ทุกครั้ง URL เดิมถึงจะใช้โค้ดใหม่

## 2. รันในเครื่อง

```bash
cp .env.example .env.local   # ใส่ GOOGLE_SCRIPT_URL, GOOGLE_SCRIPT_SECRET, ราคา, พร้อมเพย์
npm run dev
```

## 3. Deploy Vercel

1. Push ขึ้น GitHub → Vercel **Add New Project** → import repo
2. ใส่ Environment Variables ตาม `.env.example`
3. Deploy

| ตัวแปร | ความหมาย |
|---|---|
| `GOOGLE_SCRIPT_URL` | URL Web app (`.../exec`) |
| `GOOGLE_SCRIPT_SECRET` | ตรงกับ Script Property `SECRET` |
| `NEXT_PUBLIC_PRICE` | ราคาแพ็กเกจ (บาท) — ใส่ใน QR อัตโนมัติ |
| `NEXT_PUBLIC_PROMPTPAY_ID` | เบอร์/เลขบัตรพร้อมเพย์ — ว่าง = ใช้รูป `public/payment-qr.jpg` |
| `NEXT_PUBLIC_CONTACT` | ช่องทางติดต่อท้ายเว็บ |
| `NEXT_PUBLIC_START_DATE` / `END_DATE` | ช่วงวันที่เปิดจอง (YYYY-MM-DD) |
| `NEXT_PUBLIC_DAYS_AHEAD` | จองล่วงหน้าได้กี่วัน (ค่าเริ่มต้น 30) |

ค่า `NEXT_PUBLIC_*` ถูกฝังตอน build — แก้แล้วต้อง **Redeploy**

## ปรับเวลา/แพ็กเกจ

แก้ที่ `src/lib/config.ts` (`SCHEDULE`, `PACKAGE`, `SHOP`)
