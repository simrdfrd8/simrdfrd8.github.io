import { ImageResponse } from "next/og";

export const alt = "Flavorful Music: Make art with friends.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#17121C", color: "#F1ECF5", padding: 72 }}>
        <div style={{ display: "flex", gap: 14 }}>
          {["#FF7A59", "#B6FF3B", "#8C7CFF"].map((c) => (
            <div key={c} style={{ width: 0, height: 0, borderLeft: "26px solid transparent", borderRight: "26px solid transparent", borderBottom: `46px solid ${c}` }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 128, fontWeight: 800, lineHeight: 0.9, letterSpacing: -4, textTransform: "uppercase" }}>
          <span>Flavorful</span>
          <span style={{ color: "#FF7A59" }}>Music</span>
        </div>
        <div style={{ fontSize: 34, color: "#9E99A3" }}>Make art with friends. Hip-Hop · EDM · Production</div>
      </div>
    ),
    size,
  );
}
