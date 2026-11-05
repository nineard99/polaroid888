// ตั้งค่าหลักของร้าน — แก้ที่ไฟล์นี้แล้ว push (Vercel deploy ใหม่ให้เอง)

export const SHOP = {
  name: "POLAROID__888",
  instagram: "polaroid__888",
  tagline: "ถ่ายรูปในมอ ได้รูป + ได้ลุ้นลอตเตอรี่",
  price: 69,
  // เบอร์/เลขบัตรพร้อมเพย์ — ว่าง = ใช้รูป public/payment-qr.jpg
  promptpayId: "",
  contact: "@polaroid__888",
};

export const PACKAGE = {
  minutes: 30,
  lotteryCount: 3,
};

// เวลาเปิดรับ: 17:00 – 20:00 ทุกวัน, รอบละ 30 นาที
export const SCHEDULE = {
  openTime: "17:00",
  closeTime: "20:00",
  slotMinutes: PACKAGE.minutes,
  // จองล่วงหน้าได้กี่วัน
  daysAhead: 30,
  // ช่วงวันที่เปิดรับ (YYYY-MM-DD) — ไม่ตั้ง = ทุกวันตั้งแต่วันนี้
  startDate: "",
  endDate: "2026-11-12",
};

export const TIMEZONE = "Asia/Bangkok";

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** คิวทั้งหมดของวัน เช่น 17:00, 17:30, ..., 19:30 */
export function allSlots(): { start: string; end: string }[] {
  const open = toMinutes(SCHEDULE.openTime);
  const close = toMinutes(SCHEDULE.closeTime);
  const slots = [];
  for (let t = open; t + SCHEDULE.slotMinutes <= close; t += SCHEDULE.slotMinutes) {
    slots.push({ start: toHHMM(t), end: toHHMM(t + SCHEDULE.slotMinutes) });
  }
  return slots;
}

export function isValidSlot(time: string) {
  return allSlots().some((s) => s.start === time);
}

/** วันที่ปัจจุบันและนาทีปัจจุบันตามเวลาไทย */
export function nowInBangkok() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** ช่วงวันที่ที่จองได้ [min, max] */
export function bookableRange() {
  const now = nowInBangkok();
  const today = now.date;
  // เลยคิวสุดท้ายของวันนี้แล้ว → เริ่มให้จองพรุ่งนี้
  const lastSlot = allSlots().at(-1)!.start;
  const firstDay = now.minutes >= toMinutes(lastSlot) ? addDays(today, 1) : today;
  const min = SCHEDULE.startDate && SCHEDULE.startDate > firstDay ? SCHEDULE.startDate : firstDay;
  const ahead = addDays(today, SCHEDULE.daysAhead);
  const max = SCHEDULE.endDate && SCHEDULE.endDate < ahead ? SCHEDULE.endDate : ahead;
  return { min, max };
}

export function isPastSlot(date: string, time: string) {
  const now = nowInBangkok();
  if (date < now.date) return true;
  return date === now.date && toMinutes(time) <= now.minutes;
}

export function isBookableDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const { min, max } = bookableRange();
  return date >= min && date <= max;
}
