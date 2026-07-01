"use client";

import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  className?: string;
  lines?: number;
  variant?: "card" | "inline";
};

export function LoadingSkeleton({
  className,
  lines = 3,
  variant = "card",
}: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl border border-border bg-card shadow-sm",
        variant === "card" ? "p-6" : "border-none bg-transparent p-0 shadow-none",
        className
      )}
      aria-hidden="true"
    >
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "h-4 rounded bg-muted",
              idx === 0 ? "w-3/4" : idx === lines - 1 ? "w-1/2" : "w-full"
            )}
          />
        ))}
      </div>
    </div>
  );
}
