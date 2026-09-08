import { ImageResponse } from "next/og";

export const alt = "FOMOengine — The Attention Lab. Understand the pull. Design with care. Research, not a growth promise.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", backgroundColor: "#f4f0e8", color: "#1f231f", padding: "46px 62px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 27, borderBottom: "1px solid #cecac0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}><div style={{ display: "flex", width: 29, height: 29, border: "1px solid #b93622", borderRadius: "50%", alignItems: "center", justifyContent: "center", color: "#b93622", fontSize: 28 }}>+</div><span style={{ fontSize: 29, letterSpacing: "-1.5px", fontWeight: 700 }}>FOMOengine</span></div>
        <span style={{ fontSize: 14, color: "#65665c", letterSpacing: "2px" }}>THE ATTENTION LAB</span>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 70 }}>
        <div style={{ display: "flex", flexDirection: "column", width: 650 }}>
          <span style={{ fontSize: 12, letterSpacing: "2px", color: "#65665c", marginBottom: 23 }}>RESEARCH / CREATIVE PRACTICE / INFORMED CHOICE</span>
          <span style={{ display: "flex", fontSize: 75, letterSpacing: "-4px", lineHeight: 1.07, fontWeight: 400 }}>Understand the pull.</span>
          <span style={{ display: "flex", fontSize: 75, letterSpacing: "-4px", lineHeight: 1.07, color: "#b93622", fontWeight: 400 }}>Design with care.</span>
          <span style={{ fontSize: 22, lineHeight: 1.5, marginTop: 26, maxWidth: 580, color: "#65665c" }}>Explore the mechanisms of attention. Turn a claim into an honest experiment.</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: 276, background: "#eae5da", border: "1px solid #b8b6a9", padding: "28px 24px", transform: "rotate(-3deg)" }}>
          <span style={{ fontSize: 11, letterSpacing: "1px", color: "#65665c", marginBottom: 25 }}>FIELD NOTES / NOT A FORMULA</span>
          {["01  Understand", "02  Decode", "03  Apply & test"].map((label) => <span key={label} style={{ display: "flex", fontSize: 23, padding: "17px 0", borderBottom: "1px solid #cecac0" }}>{label}</span>)}
          <span style={{ fontSize: 14, lineHeight: 1.6, marginTop: 22, color: "#b93622" }}>Keep the evidence.<br />Keep the uncertainty.</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #cecac0", paddingTop: 22, color: "#65665c", fontSize: 13 }}><span>ATLAS · PLATFORMS · LAB · TRENDS · FREE CHECKER</span><span>fomoengine.io</span></div>
    </div>,
    { ...size },
  );
}
