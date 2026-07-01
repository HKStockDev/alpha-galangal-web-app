"use client";

import Link from "next/link";
import { ORG_DASHBOARD } from "@/lib/auth-routing";
import { BillingReturnShell } from "@/components/billing/billing-return-shell";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";

export function BillingCancelContent() {
  const settingsHref = `${ORG_DASHBOARD}/settings#billing`;

  return (
    <BillingReturnShell title="Checkout canceled">
      <div className="space-y-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">No payment was taken.</p>
        <p>
          You left Stripe Checkout before completing payment. Your organization&apos;s
          subscription in our database is unchanged—only a successful checkout plus webhook
          sync creates or updates a subscription.
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>No new charge on your card</li>
          <li>No plan change was applied</li>
          <li>You can try again anytime from billing settings</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Link href={settingsHref}>
          <PrimaryButton type="button">Choose a plan</PrimaryButton>
        </Link>
        <Link href={ORG_DASHBOARD}>
          <SecondaryButton type="button">Dashboard</SecondaryButton>
        </Link>
      </div>
    </BillingReturnShell>
  );
}
