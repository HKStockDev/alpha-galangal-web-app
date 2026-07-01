"use client";

import { cn } from "@/lib/utils";
import type { BillingCycle } from "@/lib/billing-plan-catalog";

interface BillingCycleToggleProps {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  savingsPercent?: number;
  className?: string;
}

export function BillingCycleToggle({
  value,
  onChange,
  savingsPercent,
  className,
}: BillingCycleToggleProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className="inline-flex rounded-full border border-border bg-muted/40 p-1"
        role="group"
        aria-label="Billing cycle"
      >
        {(["monthly", "yearly"] as const).map((cycle) => (
          <button
            key={cycle}
            type="button"
            onClick={() => onChange(cycle)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-colors",
              value === cycle
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {cycle === "monthly" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>
      {savingsPercent != null && savingsPercent > 0 ? (
        <p className="text-xs text-muted-foreground">
          Up to {savingsPercent}% off yearly plans
        </p>
      ) : null}
    </div>
  );
}
