import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// โพลารอยด์เอียง ๆ บนพื้นน้ำเงิน ให้ตรงกับ icon.svg
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#2236d8" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 100,
            height: 124,
            padding: "12px 12px 0",
            background: "#fffdf2",
            border: "7px solid #12164a",
            borderRadius: 8,
            boxShadow: "10px 10px 0 #12164a",
            transform: "rotate(-8deg)",
          }}
        >
          <div style={{ display: "flex", position: "relative", width: "100%", height: 66, background: "#e5358c", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 12, right: 14, width: 20, height: 20, borderRadius: 999, background: "#f8f46a" }} />
            <div style={{ position: "absolute", bottom: -30, left: -10, width: 70, height: 50, borderRadius: 999, background: "#a6dd5f" }} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
