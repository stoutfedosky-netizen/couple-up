import { ImageResponse } from "next/og";

export const alt = "Couple Up — Love Island USA Season 8 Bracket Predictions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #e11d48 0%, #ec4899 30%, #f97316 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "80px",
              fontWeight: 900,
              color: "white",
              letterSpacing: "-2px",
            }}
          >
            Couple Up
          </div>
          <div
            style={{
              fontSize: "32px",
              color: "rgba(255,255,255,0.85)",
              fontWeight: 600,
            }}
          >
            Love Island USA Season 8
          </div>
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "24px",
            }}
          >
            {["Predict Couples", "Call Dumpings", "Compete with Friends"].map(
              (text) => (
                <div
                  key={text}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "16px",
                    padding: "12px 24px",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "white",
                  }}
                >
                  {text}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
