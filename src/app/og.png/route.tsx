import { ImageResponse } from "next/og";

export const dynamic = "force-static";

const WIDTH = 1200;
const HEIGHT = 630;

const PRIMARY = "#163A2E";
const PRIMARY_DEEP = "#0d2620";
const ACCENT = "#d6c6a5";
const CREAM = "#f4ede0";

const STATS = [
  { label: "US EQUITIES", value: "6,000+" },
  { label: "SIGNAL FAMILIES", value: "5" },
  { label: "REFRESH", value: "Daily" },
  { label: "BACKTEST FROM", value: "2018" },
];

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `linear-gradient(135deg, ${PRIMARY_DEEP} 0%, ${PRIMARY} 60%, #1f4839 100%)`,
          color: CREAM,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle dot grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(244,237,224,0.08) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top: logo + eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg
              width="56"
              height="56"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M82 14a40 40 0 1 0 0 72"
                fill="none"
                stroke={ACCENT}
                strokeWidth="6"
                strokeLinecap="round"
              />
              <rect x="22" y="62" width="8" height="20" rx="2" fill={ACCENT} />
              <rect x="34" y="52" width="8" height="30" rx="2" fill={ACCENT} />
              <rect x="46" y="40" width="8" height="42" rx="2" fill={ACCENT} />
            </svg>
            <span
              style={{
                fontSize: 40,
                fontWeight: 500,
                letterSpacing: -0.5,
                color: CREAM,
              }}
            >
              Conviction
            </span>
          </div>
          <span
            style={{
              fontSize: 14,
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              letterSpacing: 4,
              textTransform: "uppercase",
              color: ACCENT,
            }}
          >
            Research Platform
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 1040,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 88,
              fontWeight: 600,
              lineHeight: 1.02,
              letterSpacing: -3,
              color: CREAM,
            }}
          >
            <span style={{ marginRight: 22 }}>Discover differentiated</span>
            <span style={{ marginRight: 22 }}>equity ideas with</span>
            <span
              style={{
                fontStyle: "italic",
                fontWeight: 500,
                color: ACCENT,
              }}
            >
              conviction.
            </span>
          </div>
        </div>

        {/* Stats footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 28,
            borderTop: `1px solid ${ACCENT}40`,
          }}
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  letterSpacing: 2.5,
                  color: ACCENT,
                }}
              >
                {stat.label}
              </span>
              <span
                style={{
                  fontSize: 38,
                  fontWeight: 500,
                  letterSpacing: -1,
                  marginTop: 6,
                  color: CREAM,
                }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    },
  );
}
