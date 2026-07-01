import type { NextRequest } from "next/server";

function devPort(request: NextRequest): string {
  const host = request.headers.get("host") ?? "";
  const parts = host.split(":");
  if (parts.length > 1) {
    return parts[1] ?? "3000";
  }
  return "3000";
}

function vercelRequestOrigin(request: NextRequest): string | null {
  const host = process.env.VERCEL_URL
    ? process.env.VERCEL_URL
    : request.headers.get("x-forwarded-host");
  if (!host) {
    return null;
  }
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto.split(",")[0]!.trim()}://${host.split(",")[0]!.trim()}`;
}

export function getAppOrigin(request: NextRequest): string {
  const fromEnv = process.env.APP_CANONICAL_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  const h = (request.headers.get("host") ?? "").toLowerCase();
  if (h.includes("localhost") || h.includes("127.0.0.1")) {
    return `http://app.localhost:${devPort(request)}`;
  }
  const vc = vercelRequestOrigin(request);
  if (vc) {
    return vc;
  }
  return "https://app.withprecision.ai";
}

export function getMarketingOrigin(request: NextRequest): string {
  const fromEnv = process.env.MARKETING_CANONICAL_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  if (
    (request.headers.get("host") ?? "")
      .toLowerCase()
      .includes("localhost") ||
    (request.headers.get("host") ?? "").includes("127.0.0.1")
  ) {
    return `http://localhost:${devPort(request)}`;
  }
  const vc = vercelRequestOrigin(request);
  if (vc) {
    return vc;
  }
  return "https://www.withprecision.ai";
}
