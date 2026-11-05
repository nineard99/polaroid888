"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { SHOP } from "@/lib/config";
import { LottoTicket, type TicketColor } from "./LottoTicket";

type Props = { dateLabel: string; price: number };

const BACK: { color: TicketColor; number: string; rotate: number; x: string; y: string }[] = [
  { color: "pink", number: "XXXXXX", rotate: 7, x: "4%", y: "-14%" },
  { color: "lime", number: "XXXXXX", rotate: -6, x: "-4%", y: "-7%" },
];

export function Hero({ dateLabel, price }: Props) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 160, damping: 14 });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 160, damping: 14 });

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function reset() {
    mx.set(0);
    my.set(0);
  }

  return (
    <header className="relative pt-8 pb-2">
      <motion.p
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="pop-box mx-auto w-fit -rotate-2 rounded-full bg-pink px-4 py-1 font-pop text-sm text-yellow"
      >
        PRE-ORDER NOW!
      </motion.p>

      {/* สลาก 3 ใบ = ได้ลอตเตอรี่ 3 ใบ */}
      <div
        className="relative mx-auto mt-14 w-[88%] [perspective:900px]"
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
      >
        {BACK.map((t, i) => (
          <motion.div
            key={t.color}
            className="absolute inset-0"
            initial={{ y: 120, opacity: 0, rotate: 0 }}
            animate={{ y: t.y, x: t.x, opacity: 1, rotate: t.rotate }}
            transition={{ type: "spring", bounce: 0.4, delay: 0.1 + i * 0.12 }}
          >
            <LottoTicket color={t.color} number={t.number} dateLabel={dateLabel} />
          </motion.div>
        ))}
        <motion.div
          initial={{ y: 160, opacity: 0, rotate: -12 }}
          animate={{ y: 0, opacity: 1, rotate: -2 }}
          transition={{ type: "spring", bounce: 0.45, delay: 0.35 }}
          style={{ rotateX, rotateY }}
          className="relative"
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          >
            <LottoTicket color="blue" number="888888" dateLabel={dateLabel} roll badge={price > 0 ? String(price) : undefined} />
          </motion.div>
        </motion.div>
      </div>

      <motion.h1
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.55, delay: 0.6 }}
        className="pop-text mt-10 text-center font-pop text-[clamp(2.2rem,10vw,3.6rem)] leading-none text-pink"
        style={{ "--stroke": "var(--navy)" } as React.CSSProperties}
      >
        {SHOP.name}
      </motion.h1>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-3 text-center font-thai text-lg font-semibold text-navy"
      >
        ถ่ายรูปในมอ ได้รูป + ได้ลุ้นลอตเตอรี่ 🎫
      </motion.p>
    </header>
  );
}
