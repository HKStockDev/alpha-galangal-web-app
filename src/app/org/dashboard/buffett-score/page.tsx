"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function BuffettScoreRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const base = pathname.replace(/\/buffett-score\/?$/, "");
    router.replace(`${base}/investors-scores/buffett`);
  }, [router, pathname]);

  return null;
}
