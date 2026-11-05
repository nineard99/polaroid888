"use client";

import { useEffect, useMemo, useState } from "react";
import { PaymentQR } from "./PaymentQR";

type Slot = { start: string; end: string; available: boolean; past: boolean };

type Props = {
  minDate: string;
  maxDate: string;
  price: number;
  promptpayId: string;
};

const MAX_SLIP_MB = 4;

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

function formatThaiDate(date: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("th-TH", { timeZone: "UTC", ...opts });
}

export function BookingForm({ minDate, maxDate, price, promptpayId }: Props) {
  const dates = useMemo(() => dateList(minDate, maxDate), [minDate, maxDate]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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
  const [done, setDone] = useState<{ bookingId: string } | null>(null);

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
      setDone({ bookingId: json.bookingId });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const slot = slots?.find((s) => s.start === time);
    return (
      <div className="rounded-2xl border-2 border-dashed border-lotto bg-white p-6 text-center">
        <p className="text-4xl">🎉</p>
        <h3 className="mt-2 font-display text-2xl text-lotto">จองสำเร็จ!</h3>
        <p className="mt-1 text-sm text-ink-soft">แคปหน้าจอนี้เก็บไว้ได้เลย ทีมงานจะตรวจสลิปและติดต่อกลับ</p>
        <dl className="mx-auto mt-5 max-w-xs space-y-2 text-left text-sm">
          <Row label="รหัสการจอง" value={done.bookingId} strong />
          <Row label="ชื่อ" value={name} />
          <Row label="วันที่" value={formatThaiDate(date, { dateStyle: "full" })} />
          <Row label="เวลา" value={`${time}${slot ? `–${slot.end}` : ""} น.`} />
        </dl>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
        </div>
      </Step>

      <Step n={2} title="เลือกวันที่">
        <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
          {dates.map((d) => {
            const active = d === date;
            return (
              <button
                type="button"
                key={d}
                onClick={() => pickDate(d)}
                className={`flex w-16 shrink-0 snap-start flex-col items-center rounded-xl border py-2 transition ${
                  active ? "border-lucky bg-lucky text-white shadow" : "border-line bg-white text-ink hover:border-lucky/50"
                }`}
              >
                <span className="text-xs">{formatThaiDate(d, { weekday: "short" })}</span>
                <span className="font-display text-xl">{Number(d.slice(8))}</span>
                <span className="text-xs">{formatThaiDate(d, { month: "short" })}</span>
              </button>
            );
          })}
        </div>
      </Step>

      <Step n={3} title="เลือกเวลา">
        {slotsError ? (
          <p className="text-sm text-lucky">
            {slotsError}{" "}
            <button type="button" className="underline" onClick={() => setReloadKey((k) => k + 1)}>
              ลองใหม่
            </button>
          </p>
        ) : !slots ? (
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-paper-deep" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {slots.map((s) => {
              const active = s.start === time;
              return (
                <button
                  type="button"
                  key={s.start}
                  disabled={!s.available}
                  onClick={() => setTime(s.start)}
                  className={`rounded-xl border px-3 py-3 text-center transition ${
                    !s.available
                      ? "cursor-not-allowed border-line bg-paper-deep text-ink-soft/60 line-through"
                      : active
                        ? "border-lucky bg-lucky text-white shadow"
                        : "border-line bg-white text-ink hover:border-lucky/50"
                  }`}
                >
                  <span className="font-display text-lg">
                    {s.start}–{s.end}
                  </span>
                  <span className="block text-xs">{s.available ? "ว่าง" : s.past ? "หมดเวลาจอง" : "เต็มแล้ว"}</span>
                </button>
              );
            })}
          </div>
        )}
      </Step>

      <Step n={4} title="ชำระเงิน">
        <PaymentQR promptpayId={promptpayId} amount={price} />
      </Step>

      <Step n={5} title="แนบสลิป">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-white p-5 text-center hover:border-lucky/50">
          {slipPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slipPreview} alt="ตัวอย่างสลิป" className="max-h-64 rounded-lg" />
          ) : (
            <>
              <span className="text-3xl">🧾</span>
              <span className="mt-2 text-sm text-ink-soft">แตะเพื่อเลือกรูปสลิป (ไม่เกิน {MAX_SLIP_MB}MB)</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onSlipChange(e.target.files?.[0])}
          />
        </label>
        {slip && <p className="mt-2 truncate text-xs text-ink-soft">{slip.name}</p>}
      </Step>

      {error && <p className="rounded-lg bg-lucky/10 px-4 py-3 text-sm text-lucky-dark">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-2xl bg-lucky py-4 font-display text-lg text-white shadow-lg transition hover:bg-lucky-dark disabled:opacity-60"
      >
        {submitting ? "กำลังส่ง..." : "ยืนยันการจอง"}
      </button>
    </form>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 rounded-2xl border border-line bg-white/70 p-4">
      <legend className="flex items-center gap-2 px-1 font-display text-ink">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-sm text-white">{n}</span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line pb-2">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={strong ? "font-display text-lucky" : "text-ink"}>{value}</dd>
    </div>
  );
}
