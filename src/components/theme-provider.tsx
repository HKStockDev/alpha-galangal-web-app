"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * `next-themes` 0.4.6 injects an inline <script> for the no-flash theme
 * bootstrap. React 19 / Next.js 16 dev mode flags any <script> rendered
 * inside a component with "Encountered a script tag while rendering React
 * component", even though next-themes only renders it during SSR (where it
 * does execute correctly).
 *
 * The library hasn't shipped a fix yet, so suppress just that one warning in
 * development. Every other console.error still passes through.
 *
 * See: https://github.com/pacocoursey/next-themes/issues/385
 */
if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV !== "production" &&
  !(globalThis as typeof globalThis & { __convictionThemeWarningPatched?: boolean })
    .__convictionThemeWarningPatched
) {
  const original = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === "string" && first.includes("Encountered a script tag")) {
      return;
    }
    original.apply(console, args as Parameters<typeof console.error>);
  };
  (globalThis as typeof globalThis & { __convictionThemeWarningPatched?: boolean })
    .__convictionThemeWarningPatched = true;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
