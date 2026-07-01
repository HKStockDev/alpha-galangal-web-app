"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BillingReturnShell({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div
        className={cn(
          "mx-auto w-full max-w-lg space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm",
          className
        )}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {children}
      </div>
    </div>
  );
}
