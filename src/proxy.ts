import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAppOrigin, getMarketingOrigin } from "@/lib/site-origins";
import {
  isAppHost,
  isAppProductPath,
  isInternalMarketingPath,
  isMarketingHost,
  isMarketingPreviewFixturePath,
} from "@/lib/site-hosts";

function isPublicFormulaMarketingPath(pathname: string): boolean {
  return (
    pathname.startsWith("/formula/hub") || pathname.startsWith("/formula/release")
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host");
  const hostname = host?.toLowerCase().split(":")[0] ?? "";
  const isLocalDevHost = hostname === "localhost" || hostname === "127.0.0.1";

  if (isAppHost(host) && isPublicFormulaMarketingPath(pathname)) {
    return NextResponse.redirect(
      new URL(`${pathname}${search}`, getMarketingOrigin(request)),
      308
    );
  }

  if (isMarketingHost(host)) {
    if (isLocalDevHost && pathname === "/") {
      return NextResponse.redirect(new URL(`/m${search}`, request.url), 302);
    }
    if (isAppProductPath(pathname)) {
      const appOrigin = getAppOrigin(request);
      return NextResponse.redirect(
        new URL(`${pathname}${search}`, appOrigin),
        308
      );
    }
    if (isInternalMarketingPath(pathname)) {
      if (!isMarketingPreviewFixturePath(pathname)) {
        // On local dev, /m is the visible marketing root — serve it directly.
        if (isLocalDevHost && (pathname === "/m" || pathname === "/m/")) {
          return NextResponse.next();
        }
        const publicPath =
          pathname === "/m" || pathname === "/m/" ? "/" : pathname.slice(2) || "/";
        return NextResponse.redirect(
          new URL(`${publicPath}${search}`, request.url),
          308
        );
      }
      return NextResponse.next();
    }
    const u = request.nextUrl.clone();
    u.pathname = pathname === "/" ? "/m" : `/m${pathname}`;
    return NextResponse.rewrite(u);
  }

  if (isAppHost(host) && isInternalMarketingPath(pathname)) {
    if (isMarketingPreviewFixturePath(pathname)) {
      return NextResponse.next();
    }
    const mOrigin = getMarketingOrigin(request);
    const publicPath =
      pathname === "/m" || pathname === "/m/" ? "/" : pathname.slice(2) || "/";
    return NextResponse.redirect(
      new URL(`${publicPath}${search}`, mOrigin),
      308
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon\\.ico|icon$|apple-icon$|opengraph-image$|twitter-image$|manifest\\.webmanifest$|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|avif|woff2?|ttf|eot|txt|xml|webmanifest|txt)$).*)",
  ],
};
