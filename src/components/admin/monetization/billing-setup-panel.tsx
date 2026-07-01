"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  fetchBillingSetupStatus,
  syncBillingPortalConfiguration,
  type BillingSetupStatus,
} from "@/lib/api";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { SectionCard } from "@/components/ui-kit/cards";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { FormHelperText } from "@/components/ui-kit/forms";

/** CON-98 S1: platform-admin view of Stripe + catalog readiness (GET /billing/setup). */
export function BillingSetupPanel() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [setup, setSetup] = useState<BillingSetupStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBillingSetupStatus(accessToken);
      setSetup(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing setup");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSyncPortal() {
    if (!accessToken) return;
    setSyncing(true);
    try {
      const result = await syncBillingPortalConfiguration(accessToken);
      const correctionNote =
        result.product_id_corrections.length > 0
          ? ` Fixed ${result.product_id_corrections.length} product id mismatch(es) in the database.`
          : "";
      showSuccess(
        `Billing synced: ${result.product_count} products, ${result.price_count} prices (${result.configuration_id}).${correctionNote}`
      );
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Portal sync failed");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <SectionCard>
        <LoadingSkeleton variant="card" lines={3} />
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard>
        <h3 className="text-sm font-semibold text-foreground">Billing setup (S1)</h3>
        <p className="mt-2 text-sm text-destructive">{error}</p>
        <SecondaryButton type="button" className="mt-3" onClick={() => void load()}>
          Retry
        </SecondaryButton>
      </SectionCard>
    );
  }

  if (!setup) return null;

  return (
    <SectionCard>
      <h3 className="text-sm font-semibold text-foreground">Billing setup (S1)</h3>
      <FormHelperText className="mt-1">
        Readiness for Checkout, Stripe Customer Portal, and in-app plan switching. Sync validates
        subscription_plans against Stripe and updates the portal configuration.
      </FormHelperText>
      <ul className="mt-3 space-y-1 text-sm">
        <li>
          Checkout ready:{" "}
          <span
            className={
              setup.checkout_ready ? "text-green-700 dark:text-green-400" : "text-destructive"
            }
          >
            {setup.checkout_ready ? "Yes" : "No"}
          </span>
        </li>
        <li>
          Webhook ready:{" "}
          <span
            className={
              setup.webhook_ready ? "text-green-700 dark:text-green-400" : "text-destructive"
            }
          >
            {setup.webhook_ready ? "Yes" : "No"}
          </span>
        </li>
        <li>
          Portal plan switch ready:{" "}
          <span
            className={
              setup.portal_switch_ready
                ? "text-green-700 dark:text-green-400"
                : "text-destructive"
            }
          >
            {setup.portal_switch_ready ? "Yes" : "No"}
          </span>
        </li>
        <li>
          Sellable catalog: {setup.portal_product_count} products, {setup.portal_price_count} prices
          {setup.portal_configuration_id ? (
            <span className="text-muted-foreground"> ({setup.portal_configuration_id})</span>
          ) : null}
        </li>
        <li>Active plans in DB: {setup.active_plan_count}</li>
        {setup.plans_with_placeholder_stripe_ids.length > 0 ? (
          <li className="text-destructive">
            Placeholder Stripe IDs: {setup.plans_with_placeholder_stripe_ids.join(", ")}
          </li>
        ) : null}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <PrimaryButton type="button" disabled={syncing} onClick={() => void onSyncPortal()}>
          {syncing ? "Syncing…" : "Sync billing catalog"}
        </PrimaryButton>
        <SecondaryButton type="button" disabled={syncing} onClick={() => void load()}>
          Refresh
        </SecondaryButton>
      </div>
      {setup.blockers.length > 0 ? (
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-muted-foreground">
          {setup.blockers.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
    </SectionCard>
  );
}
