import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const PRIMARY = "#163A2E";
const PRIMARY_DEEP = "#0d2620";
const CREAM = "#f4ede0";
const ACCENT = "#d6c6a5";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(135deg, ${PRIMARY_DEEP} 0%, ${PRIMARY} 70%, #1f4839 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 128 128"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M92 20a44 44 0 1 0 0 88"
            fill="none"
            stroke={CREAM}
            strokeWidth="10"
            strokeLinecap="round"
          />
          <rect x="38" y="72" width="11" height="20" rx="2" fill={CREAM} />
          <rect x="54" y="60" width="11" height="32" rx="2" fill={CREAM} />
          <rect x="70" y="48" width="11" height="44" rx="2" fill={ACCENT} />
        </svg>
      </div>
    ),
    { ...size },
  );
}
