"use client";

import { useEffect, useState } from "react";
import { isAppHost } from "@/lib/site-hosts";

/**
 * Returns `true` once mounted on the app host (e.g. app.localhost / app.withprecision.ai),
 * `false` on the marketing host or during SSR. Useful for gating UI that should appear only
 * on public-facing marketing pages.
 */
export function useIsAppHost(): boolean {
  const [value, setValue] = useState(false);
  useEffect(() => {
    setValue(isAppHost(window.location.host));
  }, []);
  return value;
}
