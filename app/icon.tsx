import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e11d48, #f97316)",
          borderRadius: "128px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "200px", lineHeight: 1 }}>&#10084;&#65039;</div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              color: "white",
              marginTop: "-20px",
              letterSpacing: "-2px",
            }}
          >
            CU
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
