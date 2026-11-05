"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { englishDate, thaiDateChip, thaiDateLong } from "@/lib/thaiDate";
import { LottoTicket } from "./LottoTicket";
import { PaymentQR } from "./PaymentQR";

type Slot = { start: string; end: string; available: boolean; past: boolean };

type Props = {
  minDate: string;
  maxDate: string;
  price: number;
  promptpayId: string;
};

const MAX_SLIP_MB = 4;
const STEP_COLORS = ["var(--pink)", "var(--blue)", "var(--lime)", "var(--red)", "var(--purple)"];

function dateList(min: string, max: string) {
  const out: string[] = [];
  const d = new Date(`${min}T00:00:00Z`);
  const end = new Date(`${max}T00:00:00Z`);
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export function BookingForm({ minDate, maxDate, price, promptpayId }: Props) {
  const dates = useMemo(() => dateList(minDate, maxDate), [minDate, maxDate]);
  const topRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [ig, setIg] = useState("");
  const [date, setDate] = useState(dates[0] ?? "");
  const [time, setTime] = useState("");
  const [slip, setSlip] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState("");

  const [reloadKey, setReloadKey] = useState(0);
  // ผลโหลดคิวผูกกับ key ของคำขอ — key ไม่ตรง = กำลังโหลด
  const requestKey = `${date}#${reloadKey}`;
  const [slotsResult, setSlotsResult] = useState<{ key: string; slots?: Slot[]; error?: string }>();
  const current = slotsResult?.key === requestKey ? slotsResult : undefined;
  const slots = current?.slots ?? null;
  const slotsError = current?.error ?? "";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    fetch(`/api/slots?date=${date}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        if (!cancelled) setSlotsResult({ key: requestKey, slots: json.slots });
      })
      .catch((err: Error) => {
        if (!cancelled) setSlotsResult({ key: requestKey, error: err.message || "โหลดคิวไม่สำเร็จ" });
      });
    return () => {
      cancelled = true;
    };
  }, [date, requestKey]);

  useEffect(() => {
    return () => {
      if (slipPreview) URL.revokeObjectURL(slipPreview);
    };
  }, [slipPreview]);

  function pickDate(d: string) {
    setDate(d);
    setTime("");
  }

  function onSlipChange(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("สลิปต้องเป็นไฟล์รูปภาพ");
    if (file.size > MAX_SLIP_MB * 1024 * 1024) return setError(`ไฟล์สลิปต้องไม่เกิน ${MAX_SLIP_MB}MB`);
    setSlip(file);
    setSlipPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!time) return setError("กรุณาเลือกเวลา");
    if (!slip) return setError("กรุณาแนบสลิปการโอน");

    const body = new FormData();
    body.set("name", name);
    body.set("phone", phone);
    body.set("ig", ig);
    body.set("date", date);
    body.set("time", time);
    body.set("slip", slip);

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        if (res.status === 409) {
          setTime("");
          setReloadKey((k) => k + 1);
        }
        throw new Error(json.error || "จองไม่สำเร็จ");
      }
      setDone(true);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (dates.length === 0) {
    return (
      <div className="pop-box rounded-2xl bg-cream p-6 text-center">
        <p className="font-thai text-2xl font-bold text-navy">ปิดรับจองแล้ว</p>
        <p className="mt-1 text-sm text-navy/70">ขอบคุณทุกคนที่มาร่วมสนุกกับเรา 🎫</p>
      </div>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-6">
      <AnimatePresence mode="wait">
        {done ? (
          <Success key="done" name={name} ig={ig} date={date} time={time} slots={slots} />
        ) : (
          <motion.form key="form" exit={{ opacity: 0, scale: 0.95 }} onSubmit={onSubmit} className="space-y-7">
            <Step n={1} title="ข้อมูลผู้จอง">
              <div className="space-y-3">
                <Field label="ชื่อ">
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ชื่อ-นามสกุล หรือชื่อเล่น"
                    className="input"
                    autoComplete="name"
                  />
                </Field>
                <Field label="เบอร์โทร">
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    pattern="0[0-9]{8,9}"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="08xxxxxxxx"
                    className="input"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="IG" optional>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-semibold text-navy/50">@</span>
                    <input
                      maxLength={31}
                      value={ig}
                      onChange={(e) => setIg(e.target.value.replace(/[^A-Za-z0-9._]/g, ""))}
                      placeholder="instagram"
                      className="input pl-9"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>
                </Field>
              </div>
            </Step>

            <Step n={2} title="เลือกวันที่">
              <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pt-1 pb-3">
                {dates.map((d) => {
                  const active = d === date;
                  const chip = thaiDateChip(d);
                  return (
                    <motion.button
                      type="button"
                      key={d}
                      onClick={() => pickDate(d)}
                      whileTap={{ scale: 0.9 }}
                      animate={{ y: active ? -3 : 0, rotate: active ? -3 : 0 }}
                      className={`flex w-16 shrink-0 snap-start flex-col items-center rounded-xl border-[3px] border-navy py-2 transition-colors ${
                        active ? "bg-pink text-yellow shadow-[3px_3px_0_var(--navy)]" : "bg-white text-navy"
                      }`}
                    >
                      <span className="font-thai text-xs font-semibold">{chip.weekday}</span>
                      <span className="font-pop text-xl leading-tight">{chip.day}</span>
                      <span className="font-thai text-xs">{chip.month}</span>
                    </motion.button>
                  );
                })}
              </div>
            </Step>

            <Step n={3} title="เลือกเวลา (รอบละ 30 นาที)">
              {slotsError ? (
                <p className="text-sm font-semibold text-red">
                  {slotsError}{" "}
                  <button type="button" className="underline" onClick={() => setReloadKey((k) => k + 1)}>
                    ลองใหม่
                  </button>
                </p>
              ) : !slots ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl border-[3px] border-navy/20 bg-white/60" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {slots.map((s, i) => {
                    const active = s.start === time;
                    return (
                      <motion.button
                        type="button"
                        key={`${date}-${s.start}`}
                        disabled={!s.available}
                        onClick={() => setTime(s.start)}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0, scale: active ? 1.03 : 1 }}
                        transition={{ type: "spring", bounce: 0.4, delay: i * 0.04 }}
                        whileTap={s.available ? { scale: 0.94 } : undefined}
                        className={`rounded-xl border-[3px] px-3 py-2.5 text-center transition-colors ${
                          !s.available
                            ? "cursor-not-allowed border-navy/25 bg-navy/5 text-navy/35"
                            : active
                              ? "border-navy bg-blue text-yellow shadow-[3px_3px_0_var(--pink)]"
                              : "border-navy bg-white text-navy hover:bg-yellow/50"
                        }`}
                      >
                        <span className={`font-pop text-lg ${!s.available ? "line-through" : ""}`}>
                          {s.start}–{s.end}
                        </span>
                        <span className="block font-thai text-xs font-semibold">
                          {s.available ? (active ? "เลือกแล้ว ✓" : "ว่าง") : s.past ? "หมดเวลาจอง" : "เต็มแล้ว"}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </Step>

            <Step n={4} title="ชำระเงิน">
              <PaymentQR promptpayId={promptpayId} amount={price} />
            </Step>

            <Step n={5} title="แนบสลิป">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-[3px] border-dashed border-navy bg-white p-5 text-center transition-colors hover:bg-yellow/40">
                <AnimatePresence mode="wait">
                  {slipPreview ? (
                    <motion.img
                      key={slipPreview}
                      src={slipPreview}
                      alt="ตัวอย่างสลิป"
                      initial={{ opacity: 0, rotate: -6, scale: 0.8 }}
                      animate={{ opacity: 1, rotate: 2, scale: 1 }}
                      className="max-h-64 rounded-lg border-[3px] border-navy"
                    />
                  ) : (
                    <motion.div key="empty" className="flex flex-col items-center" exit={{ opacity: 0 }}>
                      <motion.span
                        className="text-4xl"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                      >
                        🧾
                      </motion.span>
                      <span className="mt-2 text-sm font-semibold text-navy">แตะเพื่อเลือกรูปสลิป</span>
                      <span className="text-xs text-navy/60">ไม่เกิน {MAX_SLIP_MB}MB</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => onSlipChange(e.target.files?.[0])} />
              </label>
              {slip && <p className="mt-2 truncate text-xs text-navy/70">{slip.name}</p>}
            </Step>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border-[3px] border-navy bg-red px-4 py-3 text-sm font-semibold text-white"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.02, rotate: -0.5 }}
              className="pop-box pop-press w-full rounded-2xl bg-pink py-4 font-thai text-xl font-bold text-yellow disabled:opacity-60"
            >
              {submitting ? "กำลังส่ง..." : "ยืนยันการจอง 🎫"}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function Success({
  name,
  ig,
  date,
  time,
  slots,
}: {
  name: string;
  ig: string;
  date: string;
  time: string;
  slots: Slot[] | null;
}) {
  const slot = slots?.find((s) => s.start === time);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
      <motion.h3
        initial={{ scale: 0.4, rotate: -10 }}
        animate={{ scale: 1, rotate: -3 }}
        transition={{ type: "spring", bounce: 0.6 }}
        className="font-thai text-4xl font-bold text-pink [text-shadow:3px_3px_0_var(--navy)]"
      >
        จองสำเร็จ! 🎉
      </motion.h3>
      <motion.div
        initial={{ y: 80, rotate: 8, opacity: 0 }}
        animate={{ y: 0, rotate: -2, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.45, delay: 0.15 }}
        className="mt-6"
      >
        <LottoTicket color="yellow" number="XXXXXX" dateLabel={englishDate(date)} info={[`เวลา ${time}`]} />
      </motion.div>
      <motion.dl
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pop-box mt-8 space-y-2 rounded-2xl bg-cream p-5 text-left text-sm"
      >
        <Row label="ชื่อ" value={name} />
        {ig && <Row label="IG" value={`@${ig}`} />}
        <Row label="วันที่" value={thaiDateLong(date)} />
        <Row label="เวลา" value={`${time}${slot ? `–${slot.end}` : ""} น.`} />
      </motion.dl>
    </motion.div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <motion.fieldset
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: "spring", bounce: 0.3 }}
      className="pop-box min-w-0 rounded-2xl bg-cream p-4 pt-2"
    >
      <legend className="flex items-center gap-2 rounded-full border-[3px] border-navy bg-white py-0.5 pr-3 pl-0.5 font-thai font-bold text-navy">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full font-pop text-sm text-white"
          style={{ background: STEP_COLORS[(n - 1) % STEP_COLORS.length] }}
        >
          {n}
        </span>
        {title}
      </legend>
      <div className="mt-2">{children}</div>
    </motion.fieldset>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-navy">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-navy/50">(ไม่บังคับ)</span>
        ) : (
          <span className="ml-0.5 text-pink">*</span>
        )}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b-2 border-dashed border-navy/20 pb-2">
      <dt className="text-navy/70">{label}</dt>
      <dd className="font-semibold text-navy">{value}</dd>
    </div>
  );
}
