import { Suspense } from "react";
import { connection } from "next/server";
import { BookingForm } from "@/components/BookingForm";
import { PACKAGE, SCHEDULE, SHOP, bookableRange } from "@/lib/config";

const perks = [
  { icon: "📸", title: "ถ่ายไม่จำกัดรูป", detail: "ถ่ายกันให้สุด ในมอ" },
  { icon: "⏱️", title: `${PACKAGE.minMinutes}–${PACKAGE.maxMinutes} นาที`, detail: "ต่อ 1 คิว" },
  { icon: "🎫", title: `ลอตเตอรี่ ${PACKAGE.lotteryCount} ใบ`, detail: "ลุ้นรางวัลได้จริง" },
  { icon: "🌇", title: `${SCHEDULE.openTime}–${SCHEDULE.closeTime} น.`, detail: "เปิดทุกวัน" },
];

// ช่วงวันที่ขึ้นกับ "วันนี้" จึงต้องคำนวณตอนมี request ไม่ใช่ตอน build
async function Booking() {
  await connection();
  const range = bookableRange();
  return <BookingForm minDate={range.min} maxDate={range.max} price={SHOP.price} promptpayId={SHOP.promptpayId} />;
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16">
      {/* Hero */}
      <header className="pt-10 pb-8 text-center">
        <p className="inline-block rounded-full bg-gold-soft px-3 py-1 text-xs font-medium tracking-wide text-ink">
          PRE-ORDER เปิดจองแล้ว
        </p>
        <div className="relative mx-auto mt-6 w-56">
          <div className="polaroid -rotate-3">
            <div className="lotto-pattern flex aspect-square flex-col items-center justify-center rounded-sm">
              <span className="font-display text-6xl font-semibold text-lucky">888</span>
              <span className="mt-1 text-xs text-lotto">โชคดี · มีรูป · มีลุ้น</span>
            </div>
          </div>
          <span className="absolute -top-3 -right-4 rotate-12 rounded-md bg-lucky px-2 py-1 font-display text-sm text-white shadow">
            +ลอตเตอรี่ {PACKAGE.lotteryCount} ใบ
          </span>
        </div>
        <h1 className="mt-8 font-display text-4xl font-semibold text-ink">{SHOP.name}</h1>
        <p className="mt-2 text-ink-soft">{SHOP.tagline}</p>
      </header>

      {/* Package */}
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="flex items-center justify-between bg-lucky px-5 py-3 text-white">
          <h2 className="font-display text-lg">แพ็กเกจถ่ายรูปในมอ</h2>
          {SHOP.price > 0 && (
            <span className="font-display text-2xl">
              {SHOP.price.toLocaleString("th-TH")}
              <span className="ml-1 text-sm">บาท</span>
            </span>
          )}
        </div>
        <ul className="grid grid-cols-2 gap-px bg-line">
          {perks.map((p) => (
            <li key={p.title} className="bg-white p-4">
              <span className="text-2xl" aria-hidden>
                {p.icon}
              </span>
              <p className="mt-1 font-medium text-ink">{p.title}</p>
              <p className="text-sm text-ink-soft">{p.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Booking */}
      <section className="mt-8">
        <h2 className="mb-4 font-display text-2xl text-ink">จองคิว</h2>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-paper-deep" />}>
          <Booking />
        </Suspense>
      </section>

      <footer className="mt-12 text-center text-xs text-ink-soft">
        {SHOP.contact && <p>สอบถาม: {SHOP.contact}</p>}
        <p className="mt-1">{SHOP.name}</p>
      </footer>
    </main>
  );
}
