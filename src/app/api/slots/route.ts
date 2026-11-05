import { allSlots, isBookableDate, isPastSlot } from "@/lib/config";
import { getBookedTimes } from "@/lib/sheet";

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!isBookableDate(date)) {
    return Response.json({ error: "วันที่นี้ไม่เปิดรับจอง" }, { status: 400 });
  }

  try {
    const booked = new Set(await getBookedTimes(date));
    const slots = allSlots().map((s) => {
      const past = isPastSlot(date, s.start);
      return { ...s, past, available: !past && !booked.has(s.start) };
    });
    return Response.json({ date, slots });
  } catch (err) {
    console.error("slots error", err);
    return Response.json({ error: "โหลดคิวไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 502 });
  }
}
