"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CardBaseProps = React.ComponentPropsWithoutRef<"div">;

export function SectionCard({ className, ...props }: CardBaseProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function MetricCard({ className, ...props }: CardBaseProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}
