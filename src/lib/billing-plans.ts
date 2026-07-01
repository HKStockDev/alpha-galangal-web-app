/** Max seats for Team tier (matches API `TEAM_PLAN_MAX_SEATS`). */
export const TEAM_PLAN_MAX_SEATS = 10;

/** CON-168: plan_key for free-trial Checkout (must match API TRIAL_ENTRY_PLAN_KEY). */
export const TRIAL_PLAN_KEY = "professional_monthly";

/** Display default; server uses STRIPE_TRIAL_DAYS. */
export const DEFAULT_TRIAL_DAYS = 14;

export const ORG_BILLING_SETTINGS_PATH = "/org/dashboard/settings#billing" as const;

/** Stripe Customer Portal deep-link flows (CON-98 S2). */
export const BILLING_PORTAL_FLOWS = [
  "home",
  "invoice_history",
  "payment_method_update",
  "subscription_cancel",
  "subscription_update",
] as const;

export type BillingPortalFlow = (typeof BILLING_PORTAL_FLOWS)[number];

export const PLAN_GROUPS = [
  {
    title: "Professional",
    description: "For individual advisors and small practices.",
    planKeys: {
      monthly: "professional_monthly",
      annual: "professional_annual",
    },
    perSeat: false,
  },
  {
    title: "Team",
    description: "Per-seat pricing for teams (up to 10 seats).",
    planKeys: {
      monthly: "team_monthly",
      annual: "team_annual",
    },
    perSeat: true,
  },
  {
    title: "Enterprise",
    description: "Annual enterprise subscription.",
    planKeys: {
      annual: "enterprise_annual",
    },
    perSeat: false,
  },
] as const;
