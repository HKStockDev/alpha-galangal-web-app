"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  createOrganizationCreditPackCheckout,
  fetchMyOrganizations,
  fetchOrganizationCreditPacks,
  fetchOrganizationCreditWallet,
  type CreditPackCatalogItem,
  type OrganizationCreditWallet,
} from "@/lib/api";
import { SectionCard } from "@/components/ui-kit/cards";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { FormHelperText } from "@/components/ui-kit/forms";

function formatCredits(n: number): string {
  return n.toLocaleString();
}

function formatPackPrice(cents: number | null, currency: string): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export function OrgCreditsSettings() {
  const { accessToken } = useAuth();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [wallet, setWallet] = useState<OrganizationCreditWallet | null>(null);
  const [packs, setPacks] = useState<CreditPackCatalogItem[]>([]);
  const [busyPackKey, setBusyPackKey] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const orgs = await fetchMyOrganizations(accessToken);
      const org = orgs[0];
      if (!org) {
        setOrganizationId(null);
        return;
      }
      setOrganizationId(org.id);
      setIsOrgAdmin(org.role === "org_admin");

      const [walletData, packData] = await Promise.all([
        fetchOrganizationCreditWallet(accessToken, org.id),
        fetchOrganizationCreditPacks(accessToken, org.id),
      ]);
      setWallet(walletData);
      setPacks(packData);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load credits");
    } finally {
      setLoading(false);
    }
  }, [accessToken, showError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleBuyPack = async (packKey: string) => {
    if (!accessToken || !organizationId || !isOrgAdmin) return;
    setBusyPackKey(packKey);
    try {
      const { url } = await createOrganizationCreditPackCheckout(
        accessToken,
        organizationId,
        packKey
      );
      window.location.href = url;
    } catch (err) {
      showError(err instanceof Error ? err.message : "Checkout failed");
      setBusyPackKey(null);
    }
  };

  if (loading) {
    return <LoadingSkeleton className="h-48 w-full rounded-2xl" />;
  }

  if (!organizationId || !wallet) {
    return null;
  }

  const cycleEnd = formatDate(wallet.cycle_end);
  const lowBalance = wallet.total_credits_remaining <= 10;

  return (
    <SectionCard id="credits">
      <h2 className="text-base font-semibold text-foreground">Credits</h2>
      <FormHelperText className="mt-1">
        AI usage credits for your organization.
      </FormHelperText>
      <div className="mt-6 space-y-4">
        {lowBalance ? (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
            Your credit balance is low. Purchase a pack below to keep using AI features.
          </p>
        ) : null}

        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Base credits
            </dt>
            <dd className="text-lg font-semibold text-foreground">
              {formatCredits(wallet.base_credits_remaining)}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {formatCredits(wallet.base_credits_in_cycle)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pack credits
            </dt>
            <dd className="text-lg font-semibold text-foreground">
              {formatCredits(wallet.pack_credits_remaining)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total available
            </dt>
            <dd className="text-lg font-semibold text-foreground">
              {formatCredits(wallet.total_credits_remaining)}
            </dd>
          </div>
        </dl>

        {cycleEnd ? (
          <FormHelperText>
            Base credits reset at the start of each billing cycle (next: {cycleEnd}). Pack credits
            carry until expiry.
          </FormHelperText>
        ) : null}

        {packs.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Buy credit packs</h3>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {packs.map((pack) => (
                <li
                  key={pack.pack_key}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{pack.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCredits(pack.credits_amount)} credits ·{" "}
                      {formatPackPrice(pack.unit_amount_cents, pack.currency)}
                    </p>
                  </div>
                  {isOrgAdmin ? (
                    <PrimaryButton
                      type="button"
                      disabled={busyPackKey !== null}
                      onClick={() => void handleBuyPack(pack.pack_key)}
                    >
                      {busyPackKey === pack.pack_key ? "Redirecting…" : "Buy"}
                    </PrimaryButton>
                  ) : (
                    <FormHelperText>Org admin required to purchase</FormHelperText>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <FormHelperText>No credit packs are available for purchase yet.</FormHelperText>
        )}

        <SecondaryButton type="button" onClick={() => void reload()}>
          Refresh balance
        </SecondaryButton>
      </div>
    </SectionCard>
  );
}
