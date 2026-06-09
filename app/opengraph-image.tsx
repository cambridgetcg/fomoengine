import { ImageResponse } from "next/og";

// Site-wide social preview. Renders the card every share/Slack/iMessage/Discord
// unfurl shows — so the link sells itself. Text + CSS only (no emoji → no tofu).
export const alt = "Is this trying to manipulate you? — the authenticity shield";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          padding: "72px",
        }}
      >
        {/* brand */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              backgroundColor: "#059669",
              marginRight: "20px",
            }}
          />
          <div style={{ display: "flex", fontSize: "28px", color: "#6b7280", fontWeight: 600 }}>
            the authenticity shield
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: "78px",
              fontWeight: 800,
              color: "#111827",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
            }}
          >
            Is this trying to manipulate you?
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "28px",
              fontSize: "34px",
              color: "#4b5563",
              lineHeight: 1.35,
              maxWidth: "1000px",
            }}
          >
            Paste any ad, message, or review. See the trick, the feeling it pokes, and the truth that
            dissolves it.
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex" }}>
            {["Free", "No login", "Nothing saved"].map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  fontSize: "24px",
                  color: "#065f46",
                  backgroundColor: "#ecfdf5",
                  border: "2px solid #a7f3d0",
                  borderRadius: "999px",
                  padding: "8px 22px",
                  marginRight: "14px",
                }}
              >
                {t}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: "22px", color: "#9ca3af" }}>
            Cialdini · Kahneman · Brignull · FTC · EU DSA
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
