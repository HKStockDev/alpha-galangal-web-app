"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/context/toast-context";
import {
  cancelOrganizationInvitation,
  listOrganizationInvitations,
  resendOrganizationInvitation,
  type InvitationRow,
  type InvitationStatus,
  type OrgRole,
} from "@/lib/api";
import {
  DangerButton,
  SecondaryButton,
} from "@/components/ui-kit/buttons";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { INVITE_ROLE_OPTIONS } from "./invite-teammate-form";

const ROLE_LABEL = Object.fromEntries(
  INVITE_ROLE_OPTIONS.map((o) => [o.value, o.label])
) as Record<OrgRole, string>;

const STATUS_LABEL: Record<InvitationStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  revoked: "Cancelled",
  expired: "Expired",
};

function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function isPastExpiry(inv: InvitationRow): boolean {
  if (!inv.expires_at) return false;
  return new Date(inv.expires_at) < new Date();
}

interface TeamInvitationsListProps {
  accessToken: string | null;
  organizationId: string | null;
  /** Increment to reload the list from the parent (e.g. after sending a new invite). */
  reloadNonce?: number;
  variant?: "default" | "onboarding";
}

export function TeamInvitationsList({
  accessToken,
  organizationId,
  reloadNonce = 0,
  variant = "default",
}: TeamInvitationsListProps) {
  const { showError, showSuccess } = useToast();
  const [rows, setRows] = useState<InvitationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !organizationId) return;
    setLoading(true);
    try {
      const list = await listOrganizationInvitations(accessToken, organizationId);
      setRows(list);
    } catch {
      showError("Could not load invitations");
    } finally {
      setLoading(false);
    }
  }, [accessToken, organizationId, showError]);

  useEffect(() => {
    void load();
  }, [load, reloadNonce]);

  async function runAction(
    id: string,
    kind: "cancel" | "resend" | "copy",
    inviteUrl?: string
  ) {
    if (!accessToken || !organizationId) return;
    if (kind === "copy" && inviteUrl) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        showSuccess("Invite link copied");
      } catch {
        showError("Could not copy to clipboard");
      }
      return;
    }
    setActionKey(`${kind}:${id}`);
    try {
      if (kind === "cancel") {
        await cancelOrganizationInvitation(accessToken, organizationId, id);
        showSuccess("Invitation cancelled");
      } else {
        await resendOrganizationInvitation(accessToken, organizationId, id);
        showSuccess("Invitation email sent again");
      }
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setActionKey(null);
    }
  }

  const listWrapClass =
    variant === "onboarding"
      ? "divide-y divide-border rounded-lg border border-border"
      : "divide-y divide-border rounded-2xl border border-border bg-card shadow-sm";

  if (!organizationId) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Invitations</p>
        {loading ? (
          <span className="text-muted-foreground">
            <Spinner className="size-4" />
          </span>
        ) : null}
      </div>

      {loading && rows.length === 0 ? (
        <LoadingSkeleton variant="card" lines={2} />
      ) : rows.length === 0 ? (
        <EmptyState compact description="No invitations yet." />
      ) : (
        <ul className={listWrapClass}>
          {rows.map((inv) => {
            const status = inv.status as InvitationStatus;
            const statusLabel =
              STATUS_LABEL[status] ??
              inv.status.charAt(0).toUpperCase() + inv.status.slice(1);
            const roleLabel =
              ROLE_LABEL[inv.role as OrgRole] ?? inv.role;
            const expiredPending =
              status === "pending" && isPastExpiry(inv);
            const showCancel =
              status === "pending" && !expiredPending;
            const showResend =
              status === "pending" ||
              status === "revoked" ||
              status === "expired" ||
              expiredPending;
            const showCopy =
              (status === "pending" || expiredPending) &&
              Boolean(inv.invite_url);

            const busyCancel =
              actionKey === `cancel:${inv.id}`;
            const busyResend = actionKey === `resend:${inv.id}`;

            return (
              <li
                key={inv.id}
                className="flex flex-col gap-3 px-3 py-3 text-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {inv.email}
                    </span>
                    <Badge variant="secondary" className="font-normal">
                      {roleLabel}
                    </Badge>
                    <Badge
                      variant={
                        status === "accepted"
                          ? "default"
                          : status === "pending" && !expiredPending
                            ? "outline"
                            : "secondary"
                      }
                      className="font-normal"
                    >
                      {expiredPending ? "Link expired" : statusLabel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Invited {formatShortDate(inv.created_at)}
                    {inv.expires_at ? (
                      <>
                        {" · "}
                        Expires {formatShortDate(inv.expires_at)}
                      </>
                    ) : null}
                    {inv.inviter_name ? (
                      <> · From {inv.inviter_name}</>
                    ) : null}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  {showCopy ? (
                    <SecondaryButton
                      type="button"
                      size="sm"
                      disabled={busyCancel || busyResend}
                      onClick={() =>
                        void runAction(inv.id, "copy", inv.invite_url)
                      }
                    >
                      Copy link
                    </SecondaryButton>
                  ) : null}
                  {showResend ? (
                    <SecondaryButton
                      type="button"
                      size="sm"
                      disabled={busyCancel || busyResend}
                      onClick={() => void runAction(inv.id, "resend")}
                    >
                      {busyResend ? "Sending…" : "Resend"}
                    </SecondaryButton>
                  ) : null}
                  {showCancel ? (
                    <DangerButton
                      type="button"
                      size="sm"
                      disabled={busyCancel || busyResend}
                      onClick={() => void runAction(inv.id, "cancel")}
                    >
                      {busyCancel ? "Cancelling…" : "Cancel"}
                    </DangerButton>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
