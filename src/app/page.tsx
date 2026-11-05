import { Suspense } from "react";
import { connection } from "next/server";
import { BookingForm } from "@/components/BookingForm";
import { Hero } from "@/components/Hero";
import { Perks } from "@/components/Perks";
import { PACKAGE, SCHEDULE, SHOP, bookableRange } from "@/lib/config";
import { englishDate } from "@/lib/thaiDate";

const perks = [
  { icon: "📸", title: "ถ่ายไม่จำกัดรูป", detail: "ถ่ายกันให้สุด ในมอ", bg: "var(--pink)", fg: "#fff" },
  { icon: "⏱️", title: `รอบละ ${PACKAGE.minutes} นาที`, detail: "จองเวลาได้เลย", bg: "var(--lime)", fg: "var(--navy)" },
  { icon: "🎫", title: `ลอตเตอรี่ ${PACKAGE.lotteryCount} ใบ`, detail: "ลุ้นรางวัลได้จริง", bg: "var(--yellow)", fg: "var(--navy)" },
  { icon: "🌇", title: `${SCHEDULE.openTime}–${SCHEDULE.closeTime} น.`, detail: "เปิดทุกวัน", bg: "var(--blue)", fg: "var(--yellow)" },
];

const marquee = [
  "ถ่ายไม่จำกัดรูป",
  `รอบละ ${PACKAGE.minutes} นาที`,
  `ลอตเตอรี่ ${PACKAGE.lotteryCount} ใบ`,
  `IG : ${SHOP.instagram.toUpperCase()}`,
  "KMUTT",
];

// ช่วงวันที่ขึ้นกับ "วันนี้" จึงต้องคำนวณตอนมี request ไม่ใช่ตอน build
async function Booking() {
  await connection();
  const range = bookableRange();
  return <BookingForm minDate={range.min} maxDate={range.max} price={SHOP.price} promptpayId={SHOP.promptpayId} />;
}

export default function Home() {
  const ticketDate = englishDate(SCHEDULE.endDate || "2026-11-12");

  return (
    <>
      <main className="mx-auto w-full max-w-xl px-4 pb-10">
        <Hero dateLabel={ticketDate} price={SHOP.price} />
      </main>

      {/* แถบข้อความวิ่ง */}
      <div className="-rotate-2 overflow-hidden border-y-[3px] border-navy bg-pink py-2">
        <div className="marquee-track flex w-max">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0" aria-hidden={k === 1}>
              {[...marquee, ...marquee].map((t, i) => (
                <span key={i} className="px-4 font-pop text-lg whitespace-nowrap text-yellow">
                  {t} <span className="text-lime">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-xl px-4 pt-10 pb-16">
        <Perks perks={perks} price={SHOP.price} />

        <section className="mt-12">
          <h2 className="mb-6 font-thai text-4xl font-bold text-blue [text-shadow:3px_3px_0_var(--pink)]">
            จองคิวเลย!
          </h2>
          <Suspense fallback={<div className="pop-box h-96 animate-pulse rounded-2xl bg-cream" />}>
            <Booking />
          </Suspense>
        </section>

        <footer className="mt-14 text-center text-sm text-navy">
          <p className="font-pop">IG : {SHOP.instagram.toUpperCase()}</p>
          {SHOP.contact && <p className="mt-1">สอบถาม: {SHOP.contact}</p>}
        </footer>
      </main>
    </>
  );
}
