import { connection } from "next/server";
import { TICKETS } from "@/lib/lottery";
import { getTakenNumbers } from "@/lib/sheet";

export async function GET() {
  // ห้าม prerender ตอน build — เลขที่ถูกเลือกเปลี่ยนตลอด
  await connection();
  try {
    const taken = new Set(await getTakenNumbers());
    return Response.json({
      tickets: TICKETS.map((t) => ({ ...t, available: !taken.has(t.number) })),
    });
  } catch (err) {
    console.error("lottery error", err);
    return Response.json({ error: "โหลดเลขลอตเตอรี่ไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 502 });
  }
}
