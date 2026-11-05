"use client";

import { motion } from "motion/react";
import generatePayload from "promptpay-qr";
import { QRCodeSVG } from "qrcode.react";

type Props = { promptpayId: string; amount: number };

/**
 * ตั้ง NEXT_PUBLIC_PROMPTPAY_ID → สร้าง QR พร้อมเพย์ใส่ยอดเงินให้อัตโนมัติ
 * ไม่ตั้ง → ใช้รูป QR ของร้านที่ public/payment-qr.jpg แทน
 */
export function PaymentQR({ promptpayId, amount }: Props) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        whileHover={{ rotate: 0, scale: 1.02 }}
        className="rotate-1 rounded-sm border-[3px] border-navy bg-white p-3 pb-3 shadow-[5px_5px_0_var(--navy)]"
      >
        {promptpayId ? (
          <QRCodeSVG
            value={generatePayload(promptpayId, amount > 0 ? { amount } : {})}
            size={200}
            level="M"
            marginSize={1}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/payment-qr.jpg" alt="QR ชำระเงิน PromptPay" width={677} height={900} className="w-56" />
        )}
        <p className="mt-2 text-center font-pop text-sm text-navy">SCAN TO PAY</p>
      </motion.div>

      {!promptpayId && (
        <a
          href="/payment-qr.jpg"
          download="polaroid888-qr.jpg"
          className="pop-press mt-5 rounded-full border-[3px] border-navy bg-lime px-4 py-1.5 text-sm font-semibold text-navy shadow-[3px_3px_0_var(--navy)]"
        >
          ⬇ บันทึกรูป QR ไปสแกนในแอปธนาคาร
        </a>
      )}
      {amount > 0 && (
        <p className="mt-4 text-sm font-semibold text-navy">
          ยอดชำระ{" "}
          <span className="pop-text font-pop text-2xl text-yellow" style={{ "--stroke": "var(--navy)" } as React.CSSProperties}>
            {amount.toLocaleString("en-US")}
          </span>{" "}
          บาท
        </p>
      )}
      <p className="mt-1 text-center text-xs text-navy/70">โอนแล้วแคปสลิป แล้วแนบในขั้นตอนถัดไป</p>
    </div>
  );
}
