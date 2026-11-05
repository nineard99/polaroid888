import type { Metadata, Viewport } from "next";
import { Bungee, IBM_Plex_Sans_Thai, Mitr } from "next/font/google";
import "./globals.css";

const body = IBM_Plex_Sans_Thai({
  variable: "--font-body",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
});

const mitr = Mitr({
  variable: "--font-mitr",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
});

const bungee = Bungee({
  variable: "--font-bungee",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "POLAROID__888 — จองคิวถ่ายรูป",
  description: "พรีออเดอร์ถ่ายรูปในมอ ไม่จำกัดจำนวนรูป รอบละ 30 นาที แถมลอตเตอรี่ 3 ใบ",
};

export const viewport: Viewport = {
  themeColor: "#2236d8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${body.variable} ${mitr.variable} ${bungee.variable} h-full overflow-x-clip antialiased`}>
      <body className="min-h-full overflow-x-clip font-sans">{children}</body>
    </html>
  );
}
