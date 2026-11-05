// จัดรูปแบบวันที่ไทยเอง ไม่พึ่ง Intl — server (Node ICU) กับ browser ให้ชื่อวันไม่ตรงกัน ทำให้ hydration พัง

const WEEKDAY_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const WEEKDAY_LONG = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const MONTH_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MONTH_LONG = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const MONTH_EN = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

function parts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, weekday };
}

export function thaiDateChip(date: string) {
  const { m, d, weekday } = parts(date);
  return { weekday: WEEKDAY_SHORT[weekday], day: d, month: MONTH_SHORT[m - 1] };
}

/** วันศุกร์ที่ 6 พฤศจิกายน 2569 */
export function thaiDateLong(date: string) {
  const { y, m, d, weekday } = parts(date);
  return `วัน${WEEKDAY_LONG[weekday]}ที่ ${d} ${MONTH_LONG[m - 1]} ${y + 543}`;
}

/** 6 NOVEMBER 2026 */
export function englishDate(date: string) {
  const { y, m, d } = parts(date);
  return `${d} ${MONTH_EN[m - 1]} ${y}`;
}
