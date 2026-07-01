"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/context/toast-context";
import {
  listOrganizationMemberships,
  removeOrganizationMembership,
  type OrganizationMembershipRow,
  type OrgRole,
} from "@/lib/api";
import { DangerButton } from "@/components/ui-kit/buttons";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { INVITE_ROLE_OPTIONS } from "./invite-teammate-form";

const ROLE_LABEL = Object.fromEntries(
  INVITE_ROLE_OPTIONS.map((o) => [o.value, o.label])
) as Record<OrgRole, string>;

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  invited: "Invited",
  disabled: "Removed",
};

function displayName(row: OrganizationMembershipRow): string {
  if (row.full_name?.trim()) return row.full_name.trim();
  if (row.email) return row.email;
  return "Team member";
}

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

interface TeamMembersListProps {
  accessToken: string | null;
  organizationId: string | null;
  currentUserId: string | null;
  perSeatBilling?: boolean;
  reloadNonce?: number;
  onMemberRemoved?: () => void;
}

export function TeamMembersList({
  accessToken,
  organizationId,
  currentUserId,
  perSeatBilling = false,
  reloadNonce = 0,
  onMemberRemoved,
}: TeamMembersListProps) {
  const { showError, showSuccess } = useToast();
  const [rows, setRows] = useState<OrganizationMembershipRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<OrganizationMembershipRow | null>(
    null
  );

  const load = useCallback(async () => {
    if (!accessToken || !organizationId) return;
    setLoading(true);
    try {
      const list = await listOrganizationMemberships(accessToken, organizationId);
      setRows(list);
    } catch {
      showError("Could not load team members");
    } finally {
      setLoading(false);
    }
  }, [accessToken, organizationId, showError]);

  useEffect(() => {
    void load();
  }, [load, reloadNonce]);

  async function confirmRemove() {
    if (!accessToken || !organizationId || !confirmTarget) return;
    setRemovingId(confirmTarget.id);
    try {
      const result = await removeOrganizationMembership(
        accessToken,
        organizationId,
        confirmTarget.id
      );
      const name = displayName(confirmTarget);
      if (perSeatBilling && result.seat_quantity_updated) {
        showSuccess(`${name} was removed. Your subscription seat count was updated.`);
      } else {
        showSuccess(`${name} was removed from the team`);
      }
      setConfirmTarget(null);
      onMemberRemoved?.();
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not remove member");
    } finally {
      setRemovingId(null);
    }
  }

  if (!organizationId) return null;

  const activeRows = rows.filter((r) => r.status !== "disabled");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Team members</p>
        {loading ? (
          <span className="text-muted-foreground">
            <Spinner className="size-4" />
          </span>
        ) : null}
      </div>

      {perSeatBilling ? (
        <p className="text-sm text-muted-foreground">
          Removing someone from the team lowers your Team subscription seat count
          at the start of the next billing period (no mid-cycle credit for
          downgrades).
        </p>
      ) : null}

      {loading && rows.length === 0 ? (
        <LoadingSkeleton variant="card" lines={2} />
      ) : activeRows.length === 0 ? (
        <EmptyState compact description="No active team members yet." />
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
          {activeRows.map((member) => {
            const roleLabel = ROLE_LABEL[member.role as OrgRole] ?? member.role;
            const statusLabel =
              STATUS_LABEL[member.status] ??
              member.status.charAt(0).toUpperCase() + member.status.slice(1);
            const isSelf = currentUserId != null && member.user_id === currentUserId;
            const canRemove = member.status === "active" && !isSelf;
            const busy = removingId === member.id;

            return (
              <li
                key={member.id}
                className="flex flex-col gap-3 px-3 py-3 text-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {displayName(member)}
                      {isSelf ? (
                        <span className="font-normal text-muted-foreground"> (you)</span>
                      ) : null}
                    </span>
                    <Badge variant="secondary" className="font-normal">
                      {roleLabel}
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      {statusLabel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {member.email ? <>{member.email} · </> : null}
                    Joined {formatShortDate(member.joined_at)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  {canRemove ? (
                    <DangerButton
                      type="button"
                      size="sm"
                      disabled={busy || Boolean(removingId)}
                      onClick={() => setConfirmTarget(member)}
                    >
                      {busy ? "Removing…" : "Remove"}
                    </DangerButton>
                  ) : isSelf ? (
                    <span className="text-xs text-muted-foreground self-center">
                      Ask another admin to remove you
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog
        open={confirmTarget != null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget ? (
                <>
                  <span className="font-medium text-foreground">
                    {displayName(confirmTarget)}
                  </span>{" "}
                  will lose access to this organization.
                  {perSeatBilling ? (
                    <>
                      {" "}
                      On Team billing, your subscription seat count will decrease
                      to match active members.
                    </>
                  ) : null}
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(removingId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(removingId)}
              onClick={(e) => {
                e.preventDefault();
                void confirmRemove();
              }}
            >
              {removingId ? "Removing…" : "Remove member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
