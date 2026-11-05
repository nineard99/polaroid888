"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { SHOP } from "@/lib/config";

export type TicketColor = "blue" | "yellow" | "lime" | "pink";

// สีแต่ละใบอิงจากแบบสลากจริงของร้าน
const PALETTE: Record<
  TicketColor,
  { bg: string; dot: string; box: string; boxText: string; boxRing: string; side: string; sideText: string; text: string; burst: string }
> = {
  blue: { bg: "var(--blue)", dot: "var(--yellow)", box: "var(--yellow)", boxText: "var(--pink)", boxRing: "var(--purple)", side: "var(--yellow)", sideText: "var(--pink)", text: "var(--yellow)", burst: "var(--pink)" },
  yellow: { bg: "var(--yellow)", dot: "var(--blue)", box: "var(--red)", boxText: "var(--lime)", boxRing: "var(--red)", side: "var(--red)", sideText: "var(--yellow)", text: "var(--blue)", burst: "var(--red)" },
  lime: { bg: "var(--lime)", dot: "var(--yellow)", box: "var(--yellow)", boxText: "var(--blue)", boxRing: "var(--pink)", side: "var(--yellow)", sideText: "var(--blue)", text: "var(--pink)", burst: "var(--blue)" },
  pink: { bg: "var(--pink)", dot: "var(--yellow)", box: "var(--blue)", boxText: "var(--yellow)", boxRing: "var(--yellow)", side: "var(--blue)", sideText: "var(--yellow)", text: "var(--yellow)", burst: "var(--yellow)" },
};

type Props = {
  color: TicketColor;
  number: string;
  dateLabel: string;
  /** ข้อความแถวกลางสลาก — ค่าเริ่มต้น "งวด 1 / ชุดที่ 1" */
  info?: string[];
  badge?: string;
  photo?: React.ReactNode;
  roll?: boolean;
  className?: string;
};

export function LottoTicket({ color, number, dateLabel, info = ["งวด 1", "ชุดที่ 1"], badge, photo, roll, className = "" }: Props) {
  const c = PALETTE[color];
  return (
    <div
      className={`@container relative aspect-[2.05/1] w-full overflow-hidden rounded-[2.5cqw] border-[3px] border-navy shadow-[6px_6px_0_var(--navy)] select-none ${className}`}
      style={{ background: c.bg }}
    >
      {/* ฮาล์ฟโทน */}
      <div className="halftone absolute inset-y-0 left-0 w-[70%]" style={{ "--dot": c.dot, "--dot-size": "1.6cqw", "--check": "11cqw" } as React.CSSProperties} />
      <div className="halftone-corner absolute top-0 right-[9%] h-[45%] w-[35%]" style={{ "--dot": c.dot } as React.CSSProperties} />

      <span className="pop-text absolute top-[3%] left-[4%] font-pop text-[3.6cqw] tracking-wider" style={{ color: c.text, "--stroke": c.box === "var(--yellow)" ? "var(--navy)" : c.box } as React.CSSProperties}>
        KMUTT
      </span>

      {/* โพลารอยด์ */}
      <div className="absolute top-[10%] left-[9.5%] h-[80%] w-[18%] bg-white p-[1.2cqw] pb-[7cqw] shadow-[0.6cqw_0.6cqw_0_rgb(0_0_0/0.25)]">
        <div className="flex h-full w-full items-center justify-center overflow-hidden bg-[#f1b6d3]">
          {photo ?? <CameraFace />}
        </div>
      </div>

      {/* เลขสลาก */}
      <div
        className="absolute top-[6%] left-[39%] flex h-[19%] w-[47%] items-center justify-center"
        style={{ background: c.box, boxShadow: `1.2cqw -1.2cqw 0 ${c.boxRing}` }}
      >
        <RollingNumber
          value={number}
          roll={roll}
          className="font-pop text-[7cqw] leading-none tracking-[0.12em]"
          style={{ color: c.boxText }}
        />
      </div>

      <p className="pop-text absolute top-[33%] left-[39%] w-[47%] text-center font-pop text-[3.3cqw]" style={{ color: c.text, "--stroke": c.boxText } as React.CSSProperties}>
        {dateLabel}
      </p>

      <div
        className={`absolute top-[47%] left-[37%] flex w-[52%] font-thai text-[5cqw] font-bold ${info.length > 1 ? "justify-between" : "justify-center"}`}
      >
        {info.map((t) => (
          <span key={t} className="pop-text" style={{ color: c.text, "--stroke": "var(--navy)" } as React.CSSProperties}>
            {t}
          </span>
        ))}
      </div>

      {/* บาร์โค้ด */}
      <div className="absolute top-[72%] left-[36%] h-[20%] w-[52%] p-[1.2cqw]" style={{ background: c.box === "var(--blue)" ? "var(--blue)" : c.side }}>
        <div className="barcode h-full w-full opacity-80" />
      </div>

      {badge && (
        <div className="absolute bottom-[2%] left-[1%] aspect-square h-[26%]">
          <div className="spin-slow absolute inset-0">
            <Starburst color={c.burst} />
          </div>
          <span
            className="pop-text absolute inset-0 flex flex-col items-center justify-center font-pop text-[3.2cqw] leading-[0.9] text-yellow"
            style={{ "--stroke": "var(--navy)" } as React.CSSProperties}
          >
            {badge}
            <span className="text-[1.6cqw]">BAHT</span>
          </span>
        </div>
      )}

      {/* แถบข้าง IG */}
      <div className="absolute inset-y-0 right-0 flex w-[9%] items-center justify-center" style={{ background: c.side }}>
        <span className="rotate-90 font-pop text-[3.2cqw] whitespace-nowrap tracking-wider" style={{ color: c.sideText }}>
          IG : {SHOP.instagram.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

/** เลขหมุนแบบตู้ลอตเตอรี่ แล้วค่อย ๆ หยุดทีละหลักจากซ้ายไปขวา */
function RollingNumber({ value, roll, className, style }: { value: string; roll?: boolean; className?: string; style?: React.CSSProperties }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (!roll || reduce) return;
    let tick = 0;
    const total = 14 + value.length * 3;
    const id = setInterval(() => {
      tick++;
      setShown(
        value
          .split("")
          .map((ch, i) => (tick >= 14 + i * 3 ? ch : String(Math.floor(Math.random() * 10))))
          .join(""),
      );
      if (tick >= total) clearInterval(id);
    }, 55);
    return () => clearInterval(id);
  }, [value, roll, reduce]);

  return (
    <span className={className} style={style} aria-label={value}>
      {roll && !reduce ? shown : value}
    </span>
  );
}

function Starburst({ color }: { color: string }) {
  const points = 14;
  const pts = Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? 50 : 36;
    const a = (Math.PI * i) / points;
    return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <polygon points={pts} fill={color} stroke="var(--navy)" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}

/** มาสคอตกล้องยิ้ม (แทนรูปลูกค้า) */
function CameraFace() {
  return (
    <svg viewBox="0 0 64 64" className="h-[70%] w-[70%]" aria-hidden>
      <rect x="6" y="18" width="52" height="36" rx="8" fill="var(--blue)" stroke="var(--navy)" strokeWidth="3" />
      <rect x="20" y="10" width="20" height="12" rx="3" fill="var(--blue)" stroke="var(--navy)" strokeWidth="3" />
      <circle cx="32" cy="36" r="12" fill="#fff" stroke="var(--navy)" strokeWidth="3" />
      <circle cx="28" cy="34" r="2.5" fill="var(--navy)" />
      <circle cx="36" cy="34" r="2.5" fill="var(--navy)" />
      <path d="M27 39 q5 5 10 0" stroke="var(--navy)" strokeWidth="2.5" fill="var(--red)" strokeLinecap="round" />
      <circle cx="49" cy="25" r="3" fill="var(--yellow)" stroke="var(--navy)" strokeWidth="2" />
    </svg>
  );
}
