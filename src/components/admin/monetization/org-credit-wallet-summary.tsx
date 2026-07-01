"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { fetchAdminCreditWallets, type AdminCreditWalletRow } from "@/lib/api";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";

export function OrgCreditWalletSummary({ organizationId }: { organizationId: string }) {
  const { accessToken } = useAuth();
  const [wallet, setWallet] = useState<AdminCreditWalletRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const rows = await fetchAdminCreditWallets(accessToken, { organization_id: organizationId });
        if (!cancelled) setWallet(rows[0] ?? null);
      } catch {
        if (!cancelled) setWallet(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, organizationId]);

  if (loading) {
    return <LoadingSkeleton className="mt-4 h-16 w-full rounded-lg" />;
  }

  if (!wallet) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        No credit wallet yet — created on first subscription sync.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
      <p className="font-medium text-foreground">Credit wallet</p>
      <ul className="mt-2 space-y-1 text-muted-foreground">
        <li>
          Base:{" "}
          <span className="font-medium text-foreground">
            {wallet.base_credits_remaining.toLocaleString()} /{" "}
            {wallet.base_credits_in_cycle.toLocaleString()}
          </span>
        </li>
        <li>
          Pack:{" "}
          <span className="font-medium text-foreground">
            {wallet.pack_credits_remaining.toLocaleString()}
          </span>
        </li>
      </ul>
    </div>
  );
}
