function parseHostList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

function hostnameOnly(hostHeader: string): string {
  return hostHeader.toLowerCase().split(":")[0] ?? "";
}

export function isAppHost(hostHeader: string | null): boolean {
  if (!hostHeader) return false;
  const h = hostHeader.toLowerCase();
  if (h.startsWith("app.localhost") || h.startsWith("app.127.0.0.1")) {
    return true;
  }
  const hostname = h.split(":")[0] ?? "";
  if (hostname === "app.withconviction.ai") {
    return true;
  }
  if (hostname.startsWith("app.") && hostname.endsWith(".vercel.app")) {
    return true;
  }
  for (const allow of parseHostList(process.env.APP_HOSTNAMES)) {
    if (hostname === allow) {
      return true;
    }
  }
  return false;
}

export function isMarketingHost(hostHeader: string | null): boolean {
  if (!hostHeader) return false;
  if (isAppHost(hostHeader)) return false;
  const hostname = hostnameOnly(hostHeader);
  for (const allow of parseHostList(process.env.MARKETING_HOSTNAMES)) {
    if (hostname === allow) {
      return true;
    }
  }
  const vercelDefault = process.env.VERCEL_URL?.toLowerCase() ?? "";
  if (vercelDefault && hostname === vercelDefault) {
    return true;
  }
  if (hostname === "withconviction.ai" || hostname === "www.withconviction.ai") {
    return true;
  }
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }
  return false;
}

const APP_PATH_PREFIXES = [
  "/admin",
  "/org",
  "/login",
  "/onboarding",
  "/reset-password",
  "/api/auth",
  "/backend-api",
] as const;

export function isAppProductPath(pathname: string): boolean {
  for (const p of APP_PATH_PREFIXES) {
    if (pathname === p || pathname.startsWith(`${p}/`)) {
      return true;
    }
  }
  return false;
}

export function isInternalMarketingPath(pathname: string): boolean {
  return pathname === "/m" || pathname.startsWith("/m/");
}

/** In-app marketing preview fixtures (`src/app/m/formula/preview/...`) — serve on any host without /m strips or app↔marketing redirects. */
export function isMarketingPreviewFixturePath(pathname: string): boolean {
  return pathname.startsWith("/m/formula/preview");
}
