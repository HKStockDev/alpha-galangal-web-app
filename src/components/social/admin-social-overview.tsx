"use client";

import Link from "next/link";
import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import type { SocialAccountRow } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui-kit/cards";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { GhostButton, PrimaryButton } from "@/components/ui-kit/buttons";
import { cn } from "@/lib/utils";
import {
  SOCIAL_PLATFORMS,
  SocialPlatformIcon,
  formatSocialRelative,
  socialStatusBadgeVariant,
} from "@/components/social/social-platform-ui";
import { useSocialAccounts } from "@/components/social/use-social-accounts";
import { ADMIN_SOCIAL_ACCOUNTS } from "@/lib/social-routes";

type PlatformStatus = "not_connected" | "active" | "disconnected" | "expired" | "error";

function resolvePlatformStatus(
  platformId: string,
  accounts: SocialAccountRow[]
): { status: PlatformStatus; account: SocialAccountRow | null } {
  const matches = accounts.filter((a) => a.platform === platformId);
  if (!matches.length) {
    return { status: "not_connected", account: null };
  }
  const account =
    matches.find((a) => (a.status ?? "").toLowerCase() === "active") ?? matches[0];
  const creds = account.social_account_credentials;
  const isExpired =
    creds?.token_expires_at != null && new Date(creds.token_expires_at).getTime() < Date.now();
  if (creds?.last_refresh_error_message) {
    return { status: "error", account };
  }
  if (isExpired) {
    return { status: "expired", account };
  }
  const s = (account.status ?? "").toLowerCase();
  if (s === "active") return { status: "active", account };
  if (s === "disconnected") return { status: "disconnected", account };
  if (s === "error") return { status: "error", account };
  return { status: "disconnected", account };
}

function statusLabel(status: PlatformStatus): string {
  switch (status) {
    case "not_connected":
      return "Not connected";
    case "active":
      return "Connected";
    case "disconnected":
      return "Disconnected";
    case "expired":
      return "Token expired";
    case "error":
      return "Error";
  }
}

function statusBadgeClass(status: PlatformStatus): string {
  switch (status) {
    case "active":
      return "bg-emerald-600 text-white";
    case "not_connected":
      return "";
    case "expired":
    case "error":
      return "";
    default:
      return "";
  }
}

export function AdminSocialOverview() {
  const {
    rows,
    loading,
    refreshingId,
    connectingPlatform,
    handleConnect,
    handleRefresh,
  } = useSocialAccounts();

  const platformCards = useMemo(
    () =>
      SOCIAL_PLATFORMS.map((platform) => ({
        platform,
        ...resolvePlatformStatus(platform.id, rows),
      })),
    [rows]
  );

  const connectedCount = platformCards.filter((c) => c.status === "active").length;

  if (loading) {
    return <LoadingSkeleton variant="card" lines={6} className="mx-auto max-w-6xl py-6" />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{connectedCount}</span> of{" "}
        {SOCIAL_PLATFORMS.length} platforms connected. Use Connect to run OAuth, or open{" "}
        <Link href={ADMIN_SOCIAL_ACCOUNTS} className="text-primary underline">
          Connected accounts
        </Link>{" "}
        for token details.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platformCards.map(({ platform, status, account }) => {
          const creds = account?.social_account_credentials;
          const expiresRel = formatSocialRelative(creds?.token_expires_at);
          const isRefreshing = account != null && refreshingId === account.id;
          const showReconnect = status === "disconnected" || status === "expired" || status === "error";

          return (
            <SectionCard key={platform.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <platform.Icon className={cn("h-5 w-5", platform.brandColorClass)} />
                  <span className="font-semibold text-foreground">{platform.label}</span>
                </div>
                <Badge
                  variant={socialStatusBadgeVariant(
                    status === "not_connected" ? "disconnected" : status
                  )}
                  className={cn("capitalize", statusBadgeClass(status))}
                >
                  {statusLabel(status)}
                </Badge>
              </div>

              {account ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">
                    {account.account_label ?? account.external_account_name ?? "—"}
                  </p>
                  {expiresRel ? (
                    <p className="text-xs text-muted-foreground">
                      Token {status === "expired" ? "expired" : "expires"} {expiresRel}
                    </p>
                  ) : null}
                  {creds?.last_refresh_error_message ? (
                    <p className="line-clamp-2 text-xs text-destructive">
                      {creds.last_refresh_error_message}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No {platform.label} account linked for Precision publishing.
                </p>
              )}

              <div className="mt-auto flex flex-wrap gap-2">
                {showReconnect || status === "not_connected" ? (
                  <PrimaryButton
                    type="button"
                    size="sm"
                    disabled={connectingPlatform != null}
                    onClick={() => void handleConnect(platform.id)}
                  >
                    {connectingPlatform === platform.id
                      ? `Redirecting…`
                      : status === "not_connected"
                        ? "Connect"
                        : "Reconnect"}
                  </PrimaryButton>
                ) : account ? (
                  <GhostButton
                    type="button"
                    size="sm"
                    disabled={isRefreshing || connectingPlatform != null}
                    onClick={() => void handleRefresh(account)}
                  >
                    <RefreshCw className={cn("mr-1 h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                    {isRefreshing ? "Refreshing…" : "Refresh token"}
                  </GhostButton>
                ) : null}
                <GhostButton type="button" size="sm" asChild>
                  <Link href={ADMIN_SOCIAL_ACCOUNTS}>Manage</Link>
                </GhostButton>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
