import { SHOP, isBookableDate, isPastSlot, isValidSlot } from "@/lib/config";
import { createBooking } from "@/lib/sheet";

const MAX_SLIP_BYTES = 4 * 1024 * 1024; // Vercel จำกัด body ~4.5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function bad(error: string, status = 400) {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("ข้อมูลไม่ถูกต้อง");
  }

  const name = String(form.get("name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").replace(/\D/g, "");
  const ig = String(form.get("ig") ?? "").trim().replace(/^@+/, "");
  const date = String(form.get("date") ?? "");
  const time = String(form.get("time") ?? "");
  const slip = form.get("slip");

  if (name.length < 2 || name.length > 100) return bad("กรุณากรอกชื่อ");
  if (!/^0\d{8,9}$/.test(phone)) return bad("เบอร์โทรไม่ถูกต้อง");
  if (ig && !/^[A-Za-z0-9._]{1,30}$/.test(ig)) return bad("ชื่อ IG ไม่ถูกต้อง");
  if (!isBookableDate(date)) return bad("วันที่นี้ไม่เปิดรับจอง");
  if (!isValidSlot(time) || isPastSlot(date, time)) return bad("เวลานี้จองไม่ได้");
  if (!(slip instanceof File) || slip.size === 0) return bad("กรุณาแนบสลิป");
  if (!ALLOWED_TYPES.includes(slip.type)) return bad("สลิปต้องเป็นไฟล์รูปภาพ");
  if (slip.size > MAX_SLIP_BYTES) return bad("ไฟล์สลิปใหญ่เกิน 4MB");

  try {
    const base64 = Buffer.from(await slip.arrayBuffer()).toString("base64");
    const result = await createBooking({
      name,
      phone,
      ig,
      date,
      time,
      amount: SHOP.price,
      slip: { base64, mimeType: slip.type, fileName: slip.name || "slip" },
    });

    if (!result.ok) {
      if (result.error === "SLOT_TAKEN") {
        return bad("ขออภัย เวลานี้มีคนจองไปแล้ว กรุณาเลือกเวลาอื่น", 409);
      }
      console.error("booking script error", result.error);
      return bad("บันทึกการจองไม่สำเร็จ ลองใหม่อีกครั้ง", 502);
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("booking error", err);
    return bad("บันทึกการจองไม่สำเร็จ ลองใหม่อีกครั้ง", 502);
  }
}
