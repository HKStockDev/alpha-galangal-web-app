"use client";

import { useMemo } from "react";
import { ChevronDown, Plug, RefreshCw, AlertTriangle } from "lucide-react";
import {
  socialPlatformLabel,
  type ConfigurableSocialPlatform,
  type SocialAccountRow,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { GhostButton, PrimaryButton } from "@/components/ui-kit/buttons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  SOCIAL_PLATFORMS,
  SocialPlatformIcon,
  formatSocialAbsolute,
  formatSocialRelative,
  isConfigurableSocialPlatform,
  socialStatusBadgeVariant,
} from "@/components/social/social-platform-ui";
import { useSocialAccounts } from "@/components/social/use-social-accounts";

type Props = {
  showSectionHeader?: boolean;
};

export function AdminSocialAccountsPanel({ showSectionHeader = true }: Props) {
  const {
    rows,
    loading,
    refreshingId,
    connectingPlatform,
    handleConnect,
    handleRefresh,
  } = useSocialAccounts();

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (a.platform !== b.platform) return a.platform.localeCompare(b.platform);
        return (a.account_label ?? "").localeCompare(b.account_label ?? "");
      }),
    [rows]
  );

  const hasRows = sortedRows.length > 0;

  const connectMenu = (variant: "header" | "empty") => {
    const triggerLabel = connectingPlatform
      ? `Redirecting to ${socialPlatformLabel(connectingPlatform)}…`
      : variant === "empty"
        ? "Connect an account"
        : "Connect account";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <PrimaryButton type="button" disabled={connectingPlatform != null}>
            <Plug className="mr-2 h-4 w-4" />
            {triggerLabel}
            <ChevronDown className="ml-2 h-4 w-4 opacity-80" />
          </PrimaryButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={variant === "header" ? "end" : "center"} className="w-56">
          {SOCIAL_PLATFORMS.map(({ id, label, Icon, brandColorClass }) => (
            <DropdownMenuItem
              key={id}
              onSelect={(e) => {
                e.preventDefault();
                void handleConnect(id);
              }}
              disabled={connectingPlatform != null}
            >
              <Icon className={cn("mr-2 h-4 w-4", brandColorClass)} />
              Connect {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {showSectionHeader ? (
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Connected accounts
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Conviction-managed accounts used to publish on social platforms. Connect a network and
              refresh access tokens here.
            </p>
          </div>
          {connectMenu("header")}
        </header>
      ) : (
        <div className="flex justify-end">{connectMenu("header")}</div>
      )}

      {loading ? (
        <LoadingSkeleton variant="card" lines={4} className="py-6" />
      ) : !hasRows ? (
        <EmptyState
          title="No accounts connected"
          description="Connect Conviction social accounts for publishing. LinkedIn, Facebook, Instagram, X, and TikTok OAuth are supported."
          action={connectMenu("empty")}
        />
      ) : (
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Access token expires</TableHead>
              <TableHead>Last token sync</TableHead>
              <TableHead>Refresh error</TableHead>
              <TableHead className="w-[1%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((row) => (
              <SocialAccountTableRow
                key={row.id}
                row={row}
                refreshingId={refreshingId}
                connectingPlatform={connectingPlatform}
                onConnect={handleConnect}
                onRefresh={handleRefresh}
              />
            ))}
          </TableBody>
        </DataTable>
      )}
    </div>
  );
}

function SocialAccountTableRow({
  row,
  refreshingId,
  connectingPlatform,
  onConnect,
  onRefresh,
}: {
  row: SocialAccountRow;
  refreshingId: string | null;
  connectingPlatform: ConfigurableSocialPlatform | null;
  onConnect: (platform: ConfigurableSocialPlatform) => void;
  onRefresh: (account: SocialAccountRow) => void;
}) {
  const creds = row.social_account_credentials ?? null;
  const isWoopManaged = row.metadata?.woop === true;
  const expiresAbs = isWoopManaged ? "—" : formatSocialAbsolute(creds?.token_expires_at);
  const expiresRel = isWoopManaged ? null : formatSocialRelative(creds?.token_expires_at);
  const lastSyncAbs = isWoopManaged ? "—" : formatSocialAbsolute(creds?.last_refreshed_at);
  const lastSyncRel = isWoopManaged ? null : formatSocialRelative(creds?.last_refreshed_at);
  const refreshErrAbs = creds?.last_refresh_error_at
    ? formatSocialAbsolute(creds.last_refresh_error_at)
    : null;
  const isExpired =
    !isWoopManaged &&
    creds?.token_expires_at != null &&
    new Date(creds.token_expires_at).getTime() < Date.now();
  const isRefreshing = refreshingId === row.id;
  const canConfigure = isConfigurableSocialPlatform(row.platform);
  const showReconnect =
    canConfigure &&
    ((row.status ?? "").toLowerCase() === "disconnected" || (isExpired && !isWoopManaged));

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <SocialPlatformIcon platform={row.platform} />
          <span className="font-medium">{socialPlatformLabel(row.platform)}</span>
          {isWoopManaged ? (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              Woop
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {row.account_label ?? row.external_account_name ?? "—"}
          </span>
          {row.external_account_name && row.account_label ? (
            <span className="text-xs text-muted-foreground">{row.external_account_name}</span>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={socialStatusBadgeVariant(row.status)}
          className={cn("capitalize", row.status === "active" && "bg-emerald-600 text-white")}
        >
          {row.status || "unknown"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col leading-tight">
          <span className={cn("text-foreground", isExpired && "text-destructive")}>{expiresAbs}</span>
          {expiresRel ? (
            <span
              className={cn("text-xs", isExpired ? "text-destructive" : "text-muted-foreground")}
            >
              {isExpired ? `expired ${expiresRel}` : expiresRel}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col leading-tight">
          <span className="text-foreground">{lastSyncAbs}</span>
          {lastSyncRel ? (
            <span className="text-xs text-muted-foreground">{lastSyncRel}</span>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        {isWoopManaged ? (
          <span className="text-xs text-muted-foreground">Managed by Woop</span>
        ) : creds?.last_refresh_error_message ? (
          <div className="flex items-start gap-1.5 text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="line-clamp-2 max-w-[18rem] text-xs">
                {creds.last_refresh_error_message}
              </span>
              {refreshErrAbs ? (
                <span className="text-[11px] text-destructive/80">{refreshErrAbs}</span>
              ) : null}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {showReconnect ? (
            <PrimaryButton
              type="button"
              size="sm"
              className="h-8"
              onClick={() => {
                if (isConfigurableSocialPlatform(row.platform)) {
                  onConnect(row.platform);
                }
              }}
              disabled={connectingPlatform != null}
            >
              <SocialPlatformIcon platform={row.platform} className="mr-1 h-3.5 w-3.5" />
              Reconnect
            </PrimaryButton>
          ) : isWoopManaged ? null : (
            <GhostButton
              type="button"
              size="sm"
              className="h-8 px-2"
              onClick={() => void onRefresh(row)}
              disabled={isRefreshing || !canConfigure}
              title={
                canConfigure
                  ? "Refresh access token"
                  : `Token refresh not implemented for ${row.platform} yet`
              }
            >
              <RefreshCw className={cn("mr-1 h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Refreshing…" : "Refresh token"}
            </GhostButton>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
