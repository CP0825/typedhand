import { ImageResponse } from "next/og";

export const alt = "TypedHand — Your handwriting. Typed.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generated social-share card so links to the site don't render bare. No
// external assets/fonts — uses the OG renderer's default sans, brand colours.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background: "linear-gradient(135deg, #f7f5ef 0%, #eef2ed 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#22382e",
              color: "#f7f5ef",
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            T
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#1c1917" }}>
            TypedHand
          </div>
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 88,
            fontWeight: 800,
            color: "#1c1917",
            lineHeight: 1.05,
          }}
        >
          Your handwriting. Typed.
        </div>
        <div style={{ marginTop: 28, fontSize: 36, color: "#4a4640", maxWidth: 900 }}>
          Turn your real handwriting into a font, then type anything and export
          a print-ready PDF.
        </div>
      </div>
    ),
    { ...size },
  );
}
