"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { fetchMyOrganizations, fetchOrganizationBillingStatus } from "@/lib/api";
import { ORG_BILLING_SETTINGS_PATH } from "@/lib/billing-plans";

/**
 * CON-98: nudge org users without an entitled subscription toward billing settings.
 * Shown on org dashboard; does not block navigation (API guard enforces on LLM routes).
 */
export function BillingEntitlementBanner() {
  const { accessToken, user } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken || user?.is_platform_admin) {
      setShow(false);
      setLoading(false);
      return;
    }
    try {
      const orgs = await fetchMyOrganizations(accessToken);
      if (orgs.length === 0) {
        setShow(false);
        return;
      }
      const org = orgs[0];
      if (org.role !== "org_admin") {
        setShow(false);
        return;
      }
      const status = await fetchOrganizationBillingStatus(accessToken, org.id);
      setShow(!status.is_entitled);
    } catch {
      setShow(false);
    } finally {
      setLoading(false);
    }
  }, [accessToken, user?.is_platform_admin]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !show) {
    return null;
  }

  return (
    <div
      role="status"
      className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
    >
      <p className="font-medium">Subscription required</p>
      <p className="mt-1 text-muted-foreground">
        Start a free trial or subscribe to unlock the AI assistant and full workspace features.
        Billing is completed on Stripe&apos;s secure pages.
      </p>
      <Link
        href={ORG_BILLING_SETTINGS_PATH}
        className="mt-2 inline-block text-sm font-medium text-primary underline"
      >
        Go to billing settings
      </Link>
    </div>
  );
}
