"use client";

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
      <div className="polaroid rotate-1">
        {promptpayId ? (
          <QRCodeSVG
            value={generatePayload(promptpayId, amount > 0 ? { amount } : {})}
            size={200}
            level="M"
            marginSize={1}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/payment-qr.jpg" alt="QR ชำระเงิน PromptPay" width={677} height={900} className="w-60 rounded-sm" />
        )}
      </div>
      <p className="relative -mt-8 mb-6 font-display text-sm text-ink">สแกนจ่ายผ่าน PromptPay</p>
      {!promptpayId && (
        <a
          href="/payment-qr.jpg"
          download="polaroid888-qr.jpg"
          className="mb-3 rounded-full border border-lotto px-4 py-1.5 text-sm text-lotto hover:bg-lotto hover:text-white"
        >
          บันทึกรูป QR ไปสแกนในแอปธนาคาร
        </a>
      )}
      {amount > 0 && (
        <p className="text-sm text-ink-soft">
          ยอดชำระ <span className="font-display text-xl text-lucky">{amount.toLocaleString("th-TH")}</span> บาท
        </p>
      )}
      <p className="mt-1 text-center text-xs text-ink-soft">โอนแล้วแคปสลิป แล้วแนบในขั้นตอนถัดไป</p>
    </div>
  );
}
