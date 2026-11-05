"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { TICKETS_PER_BOOKING } from "@/lib/lottery";
import type { TicketColor } from "./LottoTicket";

export type Ticket = { number: string; color: TicketColor; available: boolean };

type Props = {
  tickets: Ticket[] | null;
  error: string;
  onRetry: () => void;
  selected: string[];
  onChange: (numbers: string[]) => void;
};

const CHIP: Record<TicketColor, { bg: string; fg: string; label: string }> = {
  blue: { bg: "var(--blue)", fg: "var(--yellow)", label: "น้ำเงิน" },
  yellow: { bg: "var(--yellow)", fg: "var(--red)", label: "เหลือง" },
  lime: { bg: "var(--lime)", fg: "var(--blue)", label: "เขียว" },
  pink: { bg: "var(--pink)", fg: "var(--yellow)", label: "ชมพู" },
};

type Filter = "all" | TicketColor;
const FILTERS: Filter[] = ["all", "blue", "yellow", "lime", "pink"];

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function LotteryPicker({ tickets, error, onRetry, selected, onChange }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [hint, setHint] = useState("");

  const colorOf = useMemo(() => new Map(tickets?.map((t) => [t.number, t.color])), [tickets]);
  const visible = useMemo(
    () =>
      (tickets ?? []).filter(
        (t) => (filter === "all" || t.color === filter) && (!query || t.number.includes(query)),
      ),
    [tickets, filter, query],
  );
  const freeCount = tickets?.filter((t) => t.available).length ?? 0;
  const full = selected.length >= TICKETS_PER_BOOKING;

  function toggle(t: Ticket) {
    setHint("");
    if (selected.includes(t.number)) return onChange(selected.filter((n) => n !== t.number));
    if (!t.available) return;
    if (full) return setHint(`เลือกครบ ${TICKETS_PER_BOOKING} ใบแล้ว — แตะเลขที่เลือกไว้เพื่อเอาออกก่อน`);
    onChange([...selected, t.number]);
  }

  /** สุ่มเฉพาะเลขที่ยังว่าง: ช่องยังไม่ครบ = เติมให้ครบ, ครบแล้ว = สุ่มใหม่ทั้งชุด */
  function randomize() {
    setHint("");
    const keep = full ? [] : selected;
    const pool = shuffle((tickets ?? []).filter((t) => t.available && !keep.includes(t.number)));
    const need = TICKETS_PER_BOOKING - keep.length;
    if (pool.length < need) return setHint("เลขที่เหลือไม่พอให้สุ่ม");
    onChange([...keep, ...pool.slice(0, need).map((t) => t.number)]);
  }

  if (error) {
    return (
      <p className="text-sm font-semibold text-red">
        {error}{" "}
        <button type="button" className="underline" onClick={onRetry}>
          ลองใหม่
        </button>
      </p>
    );
  }

  if (!tickets) {
    return <div className="h-72 animate-pulse rounded-xl border-[3px] border-navy/20 bg-white/60" />;
  }

  return (
    <div>
      {/* ใบที่เลือก */}
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: TICKETS_PER_BOOKING }, (_, i) => {
          const n = selected[i];
          const c = n ? CHIP[colorOf.get(n) ?? "blue"] : null;
          return (
            <div key={i} className="relative h-16">
              <AnimatePresence mode="popLayout">
                {n && c ? (
                  <motion.button
                    type="button"
                    key={n}
                    onClick={() => onChange(selected.filter((x) => x !== n))}
                    initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
                    animate={{ scale: 1, rotate: i % 2 ? 2 : -2, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-[3px] border-navy shadow-[3px_3px_0_var(--navy)]"
                    style={{ background: c.bg, color: c.fg }}
                    aria-label={`เอาเลข ${n} ออก`}
                  >
                    <span className="font-pop text-lg leading-none tracking-wider">{n}</span>
                    <span className="mt-1 text-[10px] font-semibold opacity-80">แตะเพื่อเอาออก</span>
                  </motion.button>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center rounded-xl border-[3px] border-dashed border-navy/40 font-pop text-lg text-navy/30"
                  >
                    ใบที่ {i + 1}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <motion.button
        type="button"
        onClick={randomize}
        whileTap={{ scale: 0.95, rotate: -3 }}
        className="pop-press mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-[3px] border-navy bg-yellow py-2.5 font-thai font-bold text-navy shadow-[3px_3px_0_var(--navy)]"
      >
        <span className="text-xl">🎲</span>
        {full ? "สุ่มใหม่ทั้ง 3 ใบ" : selected.length ? `สุ่มที่เหลืออีก ${TICKETS_PER_BOOKING - selected.length} ใบ` : "สุ่มเลขให้เลย"}
      </motion.button>

      <AnimatePresence>
        {hint && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 text-center text-xs font-semibold text-red"
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>

      <p className="mt-5 mb-2 text-sm font-semibold text-navy">
        หรือเลือกเอง <span className="font-normal text-navy/60">(ว่าง {freeCount} ใบ)</span>
      </p>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2">
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border-[2.5px] border-navy px-3 py-1 text-xs font-semibold transition-colors ${
                active ? "bg-navy text-yellow" : "bg-white text-navy"
              }`}
            >
              {f !== "all" && <span className="h-3 w-3 rounded-full border-2 border-navy" style={{ background: CHIP[f].bg }} />}
              {f === "all" ? "ทั้งหมด" : CHIP[f].label}
            </button>
          );
        })}
      </div>

      <input
        inputMode="numeric"
        value={query}
        onChange={(e) => setQuery(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="🔍 ค้นหาเลข เช่น 888"
        className="input mt-1 py-2 text-sm"
      />

      <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border-[3px] border-navy bg-white p-2">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-navy/60">ไม่พบเลขนี้</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {visible.map((t) => {
              const c = CHIP[t.color];
              const picked = selected.includes(t.number);
              return (
                <motion.button
                  type="button"
                  key={t.number}
                  onClick={() => toggle(t)}
                  disabled={!t.available && !picked}
                  whileTap={t.available ? { scale: 0.9 } : undefined}
                  animate={{ scale: picked ? 1.04 : 1 }}
                  className={`relative rounded-lg border-[2.5px] py-2 font-pop text-[15px] tracking-wider ${
                    !t.available && !picked
                      ? "cursor-not-allowed border-navy/15 bg-navy/5 text-navy/25 line-through"
                      : picked
                        ? "border-navy shadow-[2px_2px_0_var(--navy)] ring-2 ring-pink ring-offset-1"
                        : "border-navy/70"
                  }`}
                  style={t.available || picked ? { background: c.bg, color: c.fg } : undefined}
                >
                  {t.number}
                  {picked && (
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-navy bg-pink font-sans text-[11px] text-white">
                      ✓
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-navy/60">เลขที่ขีดฆ่า = มีคนเลือกไปแล้ว</p>
    </div>
  );
}
