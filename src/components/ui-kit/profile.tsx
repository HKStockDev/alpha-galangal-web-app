"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type DivProps = React.ComponentPropsWithoutRef<"div">;

export function ProfileCard({ className, ...props }: DivProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function ProfileHeroBand({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "h-24 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent sm:h-32",
        className
      )}
      {...props}
    />
  );
}

export function ProfileIconBadge({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
        className
      )}
      {...props}
    />
  );
}

export function ProfileInputFrame({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-input bg-background p-0.5 transition-colors focus-within:border-ring/35 focus-within:ring-2 focus-within:ring-ring/20",
        className
      )}
      {...props}
    />
  );
}
