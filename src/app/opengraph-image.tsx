import { ImageResponse } from "next/og";
import { profile } from "@/data/trace";

export const alt = `${profile.name}: ${profile.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0a0c0f";
const LINE = "#1f242c";
const INK = "#e6e8eb";
const MUTED = "#8b93a0";
const ACCENT = "#7cf7c4";

// Decorative bars echoing the waterfall: [left %, width %, solid?]
const BARS: [number, number, boolean][] = [
  [0, 42, false],
  [42, 20, false],
  [62, 38, true],
  [62, 38, false],
  [88, 4, true],
  [95, 3, true],
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: BG,
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 22, color: MUTED }}>
          <span>trace</span>
          <span style={{ color: INK, marginLeft: 14 }}>reuben-alex/career</span>
          <span
            style={{
              marginLeft: 18,
              padding: "4px 14px",
              borderRadius: 999,
              border: `1px solid ${ACCENT}`,
              color: ACCENT,
            }}
          >
            OK
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>{profile.name}</div>
          <div style={{ fontSize: 36, marginTop: 10, maxWidth: 940, lineHeight: 1.25 }}>
            {profile.tagline}
          </div>
          <div style={{ display: "flex", marginTop: 28 }}>
            {profile.headline.map((h) => (
              <div
                key={h.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: 340,
                  marginRight: 16,
                  padding: "12px 20px",
                  borderRadius: 12,
                  border: `1px solid ${LINE}`,
                  background: "#12151a",
                }}
              >
                <div style={{ color: ACCENT, fontSize: 32 }}>{h.value}</div>
                <div style={{ color: MUTED, fontSize: 17, marginTop: 4, lineHeight: 1.3 }}>
                  {h.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {BARS.map(([left, width, solid], i) => (
            <div key={i} style={{ display: "flex", height: 10, marginTop: 8 }}>
              <div
                style={{
                  marginLeft: `${left}%`,
                  width: `${width}%`,
                  height: 10,
                  borderRadius: 5,
                  background: solid ? ACCENT : "#3a4049",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
