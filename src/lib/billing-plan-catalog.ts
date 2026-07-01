import type { BillingPlanCatalogItem } from "@/lib/api";

export type BillingCycle = "monthly" | "yearly";

export type BillingTier = "professional" | "team" | "enterprise";

export interface BillingTierDefinition {
  tier: BillingTier;
  name: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  perSeat?: boolean;
  contactSales?: boolean;
}

export const BILLING_TIER_DEFINITIONS: BillingTierDefinition[] = [
  {
    tier: "professional",
    name: "Professional",
    description: "Single-user research workflows for independent analysts.",
    features: [
      "Single-user access",
      "Custom factor formulas",
      "Saved screens and watchlists",
      "Insider activity signals",
      "Political activity signals",
      "13F positioning overlays",
      "Email support",
    ],
  },
  {
    tier: "team",
    name: "Team",
    description: "Multi-user workspace for collaborative research teams.",
    highlighted: true,
    perSeat: true,
    features: [
      "Up to 10 users",
      "Everything in Professional",
      "Shared watchlists and models",
      "Organization-level tagging",
      "Collaboration features",
      "Team activity dashboard",
      "Priority support",
    ],
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    description: "Advanced capabilities for institutional research operations.",
    contactSales: true,
    features: [
      "Unlimited users",
      "Everything in Team",
      "Advanced signal layers",
      "API access (coming soon)",
      "Priority onboarding",
      "Custom integrations",
      "Dedicated success manager",
    ],
  },
];

export function planKeyForTier(tier: BillingTier, cycle: BillingCycle): string | null {
  if (tier === "enterprise" && cycle === "monthly") return null;
  const suffix = cycle === "yearly" ? "annual" : "monthly";
  return `${tier}_${suffix}`;
}

export function formatCents(
  cents: number | null | undefined,
  currency = "usd",
  options?: { perSeat?: boolean; perMonth?: boolean }
): string | null {
  if (cents == null) return null;
  const amount = (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const code = currency.toUpperCase();
  const seat = options?.perSeat ? " / seat" : "";
  const period = options?.perMonth ? " / month" : "";
  return `$${amount}${seat}${period}`;
}

export function catalogByTierAndCycle(
  catalog: BillingPlanCatalogItem[]
): Map<string, BillingPlanCatalogItem> {
  const map = new Map<string, BillingPlanCatalogItem>();
  for (const row of catalog) {
    const cycle = row.billing_interval === "year" ? "yearly" : "monthly";
    map.set(`${row.tier}:${cycle}`, row);
  }
  return map;
}

export function planAmountCents(plan: BillingPlanCatalogItem): number | null {
  return plan.pricing_model === "per_seat"
    ? plan.unit_amount_cents
    : plan.amount_cents ?? plan.unit_amount_cents;
}

export function displayMonthlyCents(
  plan: BillingPlanCatalogItem,
  cycle: BillingCycle
): number | null {
  const cents = planAmountCents(plan);
  if (cents == null) return null;
  if (cycle === "monthly") return cents;
  if (plan.billing_interval === "year") return Math.round(cents / 12);
  return cents;
}

export function maxYearlySavingsPercent(catalog: BillingPlanCatalogItem[]): number {
  let max = 0;
  for (const tier of ["professional", "team"] as const) {
    const monthly = catalog.find(
      (p) => p.tier === tier && p.billing_interval === "month"
    );
    const yearly = catalog.find(
      (p) => p.tier === tier && p.billing_interval === "year"
    );
    const m = monthly ? planAmountCents(monthly) : null;
    const y = yearly ? planAmountCents(yearly) : null;
    if (m != null && y != null && m * 12 > y) {
      const pct = Math.round(((m * 12 - y) / (m * 12)) * 100);
      max = Math.max(max, pct);
    }
  }
  return max;
}
