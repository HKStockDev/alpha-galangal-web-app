"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BillingPlanCatalogItem } from "@/lib/api";
import {
  BILLING_TIER_DEFINITIONS,
  catalogByTierAndCycle,
  displayMonthlyCents,
  formatCents,
  maxYearlySavingsPercent,
  planAmountCents,
  planKeyForTier,
  type BillingCycle,
} from "@/lib/billing-plan-catalog";
import { DEFAULT_TRIAL_DAYS, TRIAL_PLAN_KEY } from "@/lib/billing-plans";
import { BillingCycleToggle } from "@/components/billing/billing-cycle-toggle";
import { Button } from "@/components/ui/button";
import { PrimaryButton } from "@/components/ui-kit/buttons";

export interface OrgBillingPricingProps {
  catalog: BillingPlanCatalogItem[];
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  currentPlanKey: string | null;
  teamSeats: number;
  onTeamSeatsChange: (seats: number) => void;
  teamSeatsMax: number;
  freeTrialAvailable: boolean;
  hasActiveSubscription: boolean;
  isTrialing: boolean;
  busyPlanKey: string | null;
  changingPlan: boolean;
  anyBusy: boolean;
  onSelectPlan: (planKey: string, perSeat: boolean) => void;
  onStartTrial: () => void;
  onEndTrial: () => void;
}

export function OrgBillingPricing({
  catalog,
  billingCycle,
  onBillingCycleChange,
  currentPlanKey,
  teamSeats,
  onTeamSeatsChange,
  teamSeatsMax,
  freeTrialAvailable,
  hasActiveSubscription,
  isTrialing,
  busyPlanKey,
  changingPlan,
  anyBusy,
  onSelectPlan,
  onStartTrial,
  onEndTrial,
}: OrgBillingPricingProps) {
  const catalogMap = catalogByTierAndCycle(catalog);
  const savingsPercent = maxYearlySavingsPercent(catalog);

  return (
    <div className="space-y-8">
      <BillingCycleToggle
        value={billingCycle}
        onChange={onBillingCycleChange}
        savingsPercent={savingsPercent}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {BILLING_TIER_DEFINITIONS.map((tierDef) => {
          const planKey = planKeyForTier(tierDef.tier, billingCycle);
          const plan = planKey ? catalogMap.get(`${tierDef.tier}:${billingCycle}`) : null;
          const compareMonthly = catalogMap.get(`${tierDef.tier}:monthly`);
          const isCurrent = Boolean(planKey && currentPlanKey === planKey);
          const perSeat = tierDef.perSeat ?? false;
          const isEnterprise = tierDef.tier === "enterprise";
          const noMonthlyEnterprise = billingCycle === "monthly" && isEnterprise;

          const displayCents = plan ? displayMonthlyCents(plan, billingCycle) : null;
          const compareCents = compareMonthly
            ? displayMonthlyCents(compareMonthly, "monthly")
            : null;
          const showStrikethrough =
            billingCycle === "yearly" &&
            compareCents != null &&
            displayCents != null &&
            compareCents > displayCents;

          const yearlyTotal =
            billingCycle === "yearly" && plan ? planAmountCents(plan) : null;

          let ctaLabel = "Subscribe";
          if (tierDef.contactSales && (noMonthlyEnterprise || !planKey)) {
            ctaLabel = "Contact sales";
          } else if (freeTrialAvailable && tierDef.tier === "professional" && !hasActiveSubscription) {
            ctaLabel = `Start ${DEFAULT_TRIAL_DAYS}-day free trial`;
          } else if (isTrialing && isCurrent) {
            ctaLabel = "Start subscription now";
          } else if (isTrialing) {
            ctaLabel = changingPlan ? "Updating…" : "Subscribe now";
          } else if (hasActiveSubscription) {
            ctaLabel = isCurrent ? "Current plan" : changingPlan ? "Updating…" : "Switch to this plan";
          } else if (perSeat) {
            ctaLabel = "Subscribe";
          }

          const ctaDisabled =
            anyBusy ||
            (isCurrent && !isTrialing) ||
            noMonthlyEnterprise ||
            (!planKey && !tierDef.contactSales);

          return (
            <div
              key={tierDef.tier}
              id={planKey ? `plan-card-${planKey}` : undefined}
              className={cn(
                "relative flex flex-col rounded-xl border p-6 sm:p-8",
                tierDef.highlighted
                  ? "border-primary bg-primary/[0.02] shadow-sm"
                  : "border-border/60 bg-card"
              )}
            >
              {tierDef.highlighted ? (
                <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                  Best value
                </span>
              ) : null}

              <h3 className="text-xl font-semibold text-foreground">{tierDef.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{tierDef.description}</p>

              <div className="mt-6 min-h-[4rem]">
                {tierDef.contactSales && (noMonthlyEnterprise || !displayCents) ? (
                  <p className="text-2xl font-semibold text-foreground">Contact sales</p>
                ) : displayCents != null ? (
                  <div className="flex flex-wrap items-baseline gap-2">
                    {showStrikethrough && compareCents != null ? (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCents(compareCents, plan?.currency ?? "usd", {
                          perSeat: perSeat,
                        })}
                      </span>
                    ) : null}
                    <span className="text-3xl font-semibold tracking-tight text-foreground">
                      {formatCents(displayCents, plan?.currency ?? "usd", {
                        perSeat: perSeat,
                      })}
                    </span>
                    <span className="text-sm text-muted-foreground">/ month</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Pricing unavailable</p>
                )}
                {billingCycle === "yearly" && yearlyTotal != null && !noMonthlyEnterprise ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Billed {formatCents(yearlyTotal, plan?.currency ?? "usd", { perSeat: perSeat })}{" "}
                    annually
                    {perSeat ? ` for ${teamSeats} seats` : ""}
                  </p>
                ) : null}
              </div>

              {perSeat && planKey ? (
                <div className="mt-4 space-y-1">
                  <label htmlFor={`seats-${tierDef.tier}`} className="text-xs font-medium text-foreground">
                    Seats
                  </label>
                  <input
                    id={`seats-${tierDef.tier}`}
                    type="number"
                    min={1}
                    max={teamSeatsMax}
                    value={teamSeats}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (Number.isNaN(n)) return;
                      onTeamSeatsChange(Math.min(teamSeatsMax, Math.max(1, n)));
                    }}
                    className="w-full max-w-[8rem] rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">1–{teamSeatsMax} seats</p>
                </div>
              ) : null}

              <div className="mt-6">
                {tierDef.contactSales && (noMonthlyEnterprise || !planKey) ? (
                  <Button asChild variant="default" className="w-full">
                    <Link href="/contact">Book a demo</Link>
                  </Button>
                ) : freeTrialAvailable &&
                  tierDef.tier === "professional" &&
                  !hasActiveSubscription &&
                  billingCycle === "monthly" ? (
                  <div className="flex flex-col gap-2">
                    <PrimaryButton
                      type="button"
                      className="w-full"
                      disabled={ctaDisabled}
                      onClick={onStartTrial}
                    >
                      {busyPlanKey === TRIAL_PLAN_KEY
                        ? "Redirecting…"
                        : `Start ${DEFAULT_TRIAL_DAYS}-day free trial`}
                    </PrimaryButton>
                    {planKey ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={ctaDisabled}
                        onClick={() => onSelectPlan(planKey, false)}
                      >
                        {busyPlanKey === planKey ? "Redirecting…" : "Subscribe now"}
                      </Button>
                    ) : null}
                  </div>
                ) : isTrialing && isCurrent ? (
                  <PrimaryButton
                    type="button"
                    className="w-full"
                    disabled={anyBusy}
                    onClick={onEndTrial}
                  >
                    {busyPlanKey === "end_trial" ? "Starting subscription…" : ctaLabel}
                  </PrimaryButton>
                ) : (
                  <Button
                    type="button"
                    variant={tierDef.highlighted ? "default" : "outline"}
                    className="w-full"
                    disabled={ctaDisabled}
                    onClick={() => planKey && onSelectPlan(planKey, perSeat)}
                  >
                    {planKey && busyPlanKey === planKey
                      ? hasActiveSubscription
                        ? "Updating…"
                        : "Redirecting…"
                      : ctaLabel}
                  </Button>
                )}
              </div>

              <ul
                className={cn(
                  "mt-8 flex flex-1 flex-col gap-3",
                  tierDef.highlighted && "rounded-lg bg-primary/5 p-4 -mx-1"
                )}
              >
                {tierDef.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
