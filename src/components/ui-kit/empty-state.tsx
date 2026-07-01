"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title?: string;
  description: React.ReactNode;
  compact?: boolean;
  className?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  compact = false,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-card text-center shadow-sm",
        compact ? "p-4" : "p-8",
        className
      )}
    >
      {title ? <p className="text-sm font-semibold text-card-foreground">{title}</p> : null}
      <p className={cn("text-sm text-muted-foreground", title && "mt-1")}>{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
