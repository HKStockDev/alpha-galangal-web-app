import { ADMIN_DASHBOARD } from "@/lib/auth-routing";

export type MonetizationQuickLink = {
  href: string;
  title: string;
  description: string;
};

export const MONETIZATION_QUICK_LINKS: readonly MonetizationQuickLink[] = [
  {
    href: `${ADMIN_DASHBOARD}/monetization/plans`,
    title: "Plans",
    description:
      "Stripe-mapped subscription plans; open each plan to manage capabilities.",
  },
  {
    href: `${ADMIN_DASHBOARD}/monetization/entitlements`,
    title: "Entitlements matrix",
    description:
      "Cross-plan capability matrix with bulk copy, diff highlighting, and plan deep links.",
  },
  {
    href: `${ADMIN_DASHBOARD}/monetization/organizations`,
    title: "Organization subscriptions",
    description: "Search orgs and inspect live subscription state.",
  },
  {
    href: `${ADMIN_DASHBOARD}/monetization/stripe-events`,
    title: "Stripe events",
    description: "Webhook log, payload viewer, and retry for failed events.",
  },
  {
    href: `${ADMIN_DASHBOARD}/monetization/credit-packs`,
    title: "Credit packs",
    description: "Stripe-mapped add-on credit packs; sync from Stripe.",
  },
  {
    href: `${ADMIN_DASHBOARD}/monetization/credit-costs`,
    title: "Capability credit costs",
    description: "Fixed credits per AI capability action.",
  },
  {
    href: `${ADMIN_DASHBOARD}/monetization/credit-policy`,
    title: "Credit policy",
    description: "Consumption order, pack expiry, carryover, and proration.",
  },
  {
    href: `${ADMIN_DASHBOARD}/monetization/credit-wallets`,
    title: "Organization wallets",
    description: "Per-org base and pack credit balances.",
  },
  {
    href: `${ADMIN_DASHBOARD}/monetization/credit-transactions`,
    title: "Credit ledger",
    description: "Audit log of purchases, consumption, and resets.",
  },
  {
    href: `${ADMIN_DASHBOARD}/monetization/preview`,
    title: "Blocked response preview",
    description: "Simulate allowed/blocked UX and upsell copy for a plan + capability.",
  },
] as const;
