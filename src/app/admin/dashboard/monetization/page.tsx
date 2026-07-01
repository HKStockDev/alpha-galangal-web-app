import { BillingSetupPanel } from "@/components/admin/monetization/billing-setup-panel";
import { MonetizationQuickLinksList } from "@/components/admin/monetization/monetization-quick-links-list";
import { StripeManagedBadge } from "@/components/admin/monetization/stripe-managed-badge";

export default function MonetizationHubPage() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage Stripe-mapped plans, per-plan AI entitlements, organization subscriptions, and
          webhook operations. Plan pricing and catalog metadata are{" "}
          <StripeManagedBadge className="inline-flex align-middle" /> in Stripe.
        </p>
      </div>
      <BillingSetupPanel />
      <MonetizationQuickLinksList />
    </div>
  );
}
