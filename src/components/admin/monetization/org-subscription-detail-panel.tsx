"use client";

import type { OrgSubscriptionDetailResponse } from "@/lib/api";
import { StripeManagedBadge } from "@/components/admin/monetization/stripe-managed-badge";
import { formatAdminDateTime } from "@/components/admin/monetization/format-datetime";
import { SubscriptionStatusBadge } from "@/components/admin/monetization/subscription-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { ExternalLink } from "lucide-react";
import { OrgCreditWalletSummary } from "@/components/admin/monetization/org-credit-wallet-summary";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border/60 py-3 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function StripeLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
    >
      {label}
      <ExternalLink className="size-3" aria-hidden />
    </a>
  );
}

function stripeCustomerDashboardUrl(customerId: string): string {
  return `https://dashboard.stripe.com/customers/${customerId}`;
}

export function OrgSubscriptionDetailPanel({
  detail,
  loading,
}: {
  detail: OrgSubscriptionDetailResponse | null;
  loading: boolean;
}) {
  if (loading) {
    return <LoadingSkeleton className="h-80 w-full rounded-2xl" />;
  }

  if (!detail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription detail</CardTitle>
          <CardDescription>Select an organization from the list to view Stripe state.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const sub = detail.subscription;
  const stripeCustomerId =
    sub?.stripe_customer_id ?? detail.organization.stripe_customer_id ?? null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>{detail.organization.name}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {detail.organization.id}
            </CardDescription>
          </div>
          <StripeManagedBadge />
        </div>
      </CardHeader>
      <CardContent>
        <OrgCreditWalletSummary organizationId={detail.organization.id} />
        {!sub ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              No subscription record for this organization. Complete checkout or verify webhook
              sync.
            </p>
            {stripeCustomerId ? (
              <dl>
                <DetailRow
                  label="Stripe customer"
                  value={
                    <StripeLink
                      href={stripeCustomerDashboardUrl(stripeCustomerId)}
                      label={stripeCustomerId}
                    />
                  }
                />
                <DetailRow
                  label="Payment history"
                  value={
                    <StripeLink
                      href={stripeCustomerDashboardUrl(stripeCustomerId)}
                      label="Open in Stripe Dashboard"
                    />
                  }
                />
              </dl>
            ) : null}
          </div>
        ) : (
          <dl>
            <DetailRow label="Plan" value={sub.plan.display_name ?? sub.plan.plan_key} />
            <DetailRow
              label="Status"
              value={<SubscriptionStatusBadge status={sub.status} />}
            />
            <DetailRow label="Seats" value={String(sub.seat_quantity)} />
            <DetailRow
              label="Price per seat"
              value={
                sub.price_per_seat_cents != null
                  ? `${(sub.price_per_seat_cents / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}`
                  : "—"
              }
            />
            <DetailRow
              label="Current period"
              value={`${formatAdminDateTime(sub.current_period_start)} → ${formatAdminDateTime(sub.current_period_end)}`}
            />
            <DetailRow label="Trial end" value={formatAdminDateTime(sub.trial_end)} />
            <DetailRow
              label="Cancel at period end"
              value={sub.cancel_at_period_end ? "Yes" : "No"}
            />
            <DetailRow
              label="Last Stripe event"
              value={formatAdminDateTime(sub.last_stripe_event_at)}
            />
            <DetailRow
              label="Stripe customer"
              value={
                <StripeLink
                  href={stripeCustomerDashboardUrl(sub.stripe_customer_id)}
                  label={sub.stripe_customer_id}
                />
              }
            />
            <DetailRow
              label="Stripe subscription"
              value={
                <StripeLink
                  href={`https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`}
                  label={sub.stripe_subscription_id}
                />
              }
            />
            {detail.organization.stripe_customer_id &&
              detail.organization.stripe_customer_id !== sub.stripe_customer_id && (
                <DetailRow
                  label="Org customer id"
                  value={
                    <StripeLink
                      href={stripeCustomerDashboardUrl(detail.organization.stripe_customer_id)}
                      label={detail.organization.stripe_customer_id}
                    />
                  }
                />
              )}
            {stripeCustomerId ? (
              <DetailRow
                label="Payment history"
                value={
                  <StripeLink
                    href={stripeCustomerDashboardUrl(stripeCustomerId)}
                    label="Open in Stripe Dashboard"
                  />
                }
              />
            ) : null}
          </dl>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Read-only. Org admins manage billing via Stripe Customer Portal; ops use Stripe
          Dashboard (links above).
        </p>
      </CardContent>
    </Card>
  );
}

