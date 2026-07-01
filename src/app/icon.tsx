import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const PRIMARY = "#163A2E";
const CREAM = "#f4ede0";
const ACCENT = "#d6c6a5";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: PRIMARY,
          borderRadius: 6,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: 6,
          gap: 3,
        }}
      >
        <div
          style={{
            width: 5,
            height: 10,
            background: CREAM,
            borderRadius: 1,
          }}
        />
        <div
          style={{
            width: 5,
            height: 14,
            background: CREAM,
            borderRadius: 1,
          }}
        />
        <div
          style={{
            width: 5,
            height: 18,
            background: ACCENT,
            borderRadius: 1,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
