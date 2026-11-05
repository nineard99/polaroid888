// คุยกับ Google Apps Script (ผูกกับ Google Sheet) — เรียกจากฝั่ง server เท่านั้น

const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
const SECRET = process.env.GOOGLE_SCRIPT_SECRET;

export type ScriptResult<T> = { ok: true; data: T } | { ok: false; error: string };

function assertConfigured() {
  if (!SCRIPT_URL || !SECRET) {
    throw new Error("GOOGLE_SCRIPT_URL / GOOGLE_SCRIPT_SECRET ยังไม่ได้ตั้งค่า");
  }
}

export async function getBookedTimes(date: string): Promise<string[]> {
  assertConfigured();
  const url = new URL(SCRIPT_URL!);
  url.searchParams.set("action", "booked");
  url.searchParams.set("date", date);
  url.searchParams.set("secret", SECRET!);
  const res = await fetch(url, { cache: "no-store", redirect: "follow" });
  const json = (await res.json()) as ScriptResult<{ times: string[] }>;
  if (!json.ok) throw new Error(json.error);
  return json.data.times;
}

export type BookingPayload = {
  name: string;
  phone: string;
  ig: string;
  date: string;
  time: string;
  amount: number;
  slip: { base64: string; mimeType: string; fileName: string };
};

export async function createBooking(
  payload: BookingPayload,
): Promise<ScriptResult<{ bookingId: string }>> {
  assertConfigured();
  const res = await fetch(SCRIPT_URL!, {
    method: "POST",
    // text/plain เลี่ยง CORS preflight และ Apps Script อ่านจาก e.postData.contents ได้
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "book", secret: SECRET, ...payload }),
    cache: "no-store",
    redirect: "follow",
  });
  return (await res.json()) as ScriptResult<{ bookingId: string }>;
}
