"use client";

import { motion } from "motion/react";

type Perk = { icon: string; title: string; detail: string; bg: string; fg: string };

export function Perks({ perks, price }: { perks: Perk[]; price: number }) {
  return (
    <section className="pop-box overflow-hidden rounded-2xl bg-cream">
      <div className="flex items-center justify-between border-b-[3px] border-navy bg-blue px-5 py-3">
        <h2 className="font-thai text-lg font-bold text-yellow">แพ็กเกจถ่ายรูปในมอ</h2>
        {price > 0 && (
          <span className="pop-text font-pop text-2xl text-yellow" style={{ "--stroke": "var(--pink)" } as React.CSSProperties}>
            {price}
            <span className="ml-1 text-xs">BAHT</span>
          </span>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-3 p-3">
        {perks.map((p, i) => (
          <motion.li
            key={p.title}
            initial={{ opacity: 0, y: 24, rotate: i % 2 ? 3 : -3 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ type: "spring", bounce: 0.45, delay: i * 0.08 }}
            whileHover={{ y: -4, rotate: i % 2 ? 1.5 : -1.5 }}
            className="rounded-xl border-[3px] border-navy p-3 shadow-[3px_3px_0_var(--navy)]"
            style={{ background: p.bg, color: p.fg }}
          >
            <span className="text-2xl" aria-hidden>
              {p.icon}
            </span>
            <p className="mt-1 font-thai font-bold">{p.title}</p>
            <p className="text-sm opacity-85">{p.detail}</p>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
