"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export function BrandLogo({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const mode = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const src = useMemo(
    () =>
      collapsed
        ? `/logos/conviction-${mode}-collapsed.png`
        : `/logos/conviction-${mode}-full.png`,
    [collapsed, mode]
  );

  return (
    <img
      src={src}
      alt="Conviction"
      className={cn(
        "h-auto w-auto max-w-none",
        collapsed ? "max-h-7" : "max-h-10",
        className
      )}
      width={collapsed ? 28 : 220}
      height={collapsed ? 28 : 46}
      loading="eager"
      decoding="async"
    />
  );
}
