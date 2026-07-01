"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ADMIN_DASHBOARD } from "@/lib/auth-routing";
import type {
  EntitlementCell,
  EntitlementMatrixRow,
  SubscriptionPlanAdminRow,
} from "@/lib/api";
import { StripeManagedBadge } from "@/components/admin/monetization/stripe-managed-badge";
import { isCriticalCapability } from "@/components/admin/monetization/entitlement-constants";
import { cellsDiffer } from "@/components/admin/monetization/entitlement-diff";
import {
  EntitlementCellDialog,
  type EntitlementCellDraft,
} from "@/components/admin/monetization/entitlement-cell-dialog";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import { GhostButton } from "@/components/ui-kit/buttons";
import { cn } from "@/lib/utils";
import { Settings2 } from "lucide-react";

type PendingToggle = {
  planId: string;
  capabilityKey: string;
  capabilityLabel: string;
  planLabel: string;
  nextEnabled: boolean;
};

type PendingSave = {
  planId: string;
  capabilityKey: string;
  capabilityLabel: string;
  planLabel: string;
  draft: EntitlementCellDraft;
};

export function EntitlementsMatrix({
  plans,
  rows,
  baselinePlanId,
  highlightPlanId,
  currentUserId,
  currentUserLabel,
  onToggle,
  onSaveCell,
}: {
  plans: SubscriptionPlanAdminRow[];
  rows: EntitlementMatrixRow[];
  baselinePlanId: string | null;
  /** Column to emphasize (e.g. from `?planId=` deep link). */
  highlightPlanId?: string | null;
  currentUserId?: string | null;
  currentUserLabel?: string | null;
  onToggle: (planId: string, capabilityKey: string, isEnabled: boolean) => Promise<void>;
  onSaveCell: (
    planId: string,
    capabilityKey: string,
    draft: EntitlementCellDraft
  ) => Promise<EntitlementCell>;
}) {
  const [dialogCell, setDialogCell] = useState<{
    cell: EntitlementCell;
    capabilityLabel: string;
    planLabel: string;
  } | null>(null);
  const [savingDialog, setSavingDialog] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const baselineIndex = useMemo(
    () => plans.findIndex((p) => p.id === baselinePlanId),
    [plans, baselinePlanId]
  );

  const getCell = (row: EntitlementMatrixRow, planId: string) =>
    row.cells.find((c) => c.plan_id === planId);

  const runToggle = async (planId: string, capabilityKey: string, isEnabled: boolean) => {
    const key = `${planId}:${capabilityKey}`;
    setTogglingKey(key);
    try {
      await onToggle(planId, capabilityKey, isEnabled);
    } finally {
      setTogglingKey(null);
    }
  };

  const handleSwitchChange = (
    row: EntitlementMatrixRow,
    plan: SubscriptionPlanAdminRow,
    cell: EntitlementCell,
    checked: boolean
  ) => {
    if (!checked && isCriticalCapability(row.capability_key)) {
      setPendingToggle({
        planId: plan.id,
        capabilityKey: row.capability_key,
        capabilityLabel: row.display_name,
        planLabel: plan.display_name ?? plan.plan_key,
        nextEnabled: false,
      });
      return;
    }
    void runToggle(plan.id, row.capability_key, checked);
  };

  const requestSave = (
    planId: string,
    capabilityKey: string,
    capabilityLabel: string,
    planLabel: string,
    draft: EntitlementCellDraft
  ) => {
    if (!draft.is_enabled && isCriticalCapability(capabilityKey)) {
      setPendingSave({ planId, capabilityKey, capabilityLabel, planLabel, draft });
      return;
    }
    void runSave(planId, capabilityKey, draft);
  };

  const runSave = async (
    planId: string,
    capabilityKey: string,
    draft: EntitlementCellDraft
  ) => {
    setSavingDialog(true);
    try {
      await onSaveCell(planId, capabilityKey, draft);
      setDialogCell(null);
    } catch {
      /* toast + rollback handled in hook */
    } finally {
      setSavingDialog(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <DataTable stickyHeader className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-20 min-w-[200px] bg-muted/60">
                Capability
              </TableHead>
              {plans.map((plan) => {
                const isHighlighted = highlightPlanId === plan.id;
                return (
                  <TableHead
                    key={plan.id}
                    className={cn(
                      "min-w-[140px] text-center",
                      isHighlighted && "bg-primary/5 ring-2 ring-inset ring-primary"
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-center text-xs font-semibold normal-case">
                        {plan.display_name ?? plan.plan_key}
                      </span>
                      <StripeManagedBadge />
                      <Link
                        href={`${ADMIN_DASHBOARD}/monetization/plans/${plan.id}/capabilities`}
                        className="text-[10px] font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Open plan view
                      </Link>
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.capability_key}>
                <TableCell className="sticky left-0 z-10 bg-card">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{row.display_name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {row.capability_key}
                    </span>
                    {row.is_mutating ? (
                      <Badge variant="outline" className="w-fit text-[10px]">
                        Mutating
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="w-fit text-[10px]">
                        Read-only
                      </Badge>
                    )}
                  </div>
                </TableCell>
                {plans.map((plan) => {
                  const cell = getCell(row, plan.id);
                  if (!cell) return <TableCell key={plan.id}>—</TableCell>;

                  const baselineCell =
                    baselineIndex >= 0 ? row.cells[baselineIndex] : undefined;
                  const differsFromBaseline =
                    baselineCell &&
                    baselinePlanId !== plan.id &&
                    cellsDiffer(cell, baselineCell);
                  const isHighlighted = highlightPlanId === plan.id;

                  const toggleKey = `${plan.id}:${row.capability_key}`;
                  const isToggling = togglingKey === toggleKey;

                  return (
                    <TableCell
                      key={plan.id}
                      className={cn(
                        "text-center",
                        differsFromBaseline && "bg-amber-500/10 ring-1 ring-inset ring-amber-500/30",
                        isHighlighted && "bg-primary/5 ring-1 ring-inset ring-primary/40"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Switch
                          checked={cell.is_enabled}
                          disabled={isToggling || savingDialog}
                          onCheckedChange={(checked) =>
                            handleSwitchChange(row, plan, cell, checked)
                          }
                          aria-label={`${row.display_name} for ${plan.display_name ?? plan.plan_key}`}
                        />
                        <GhostButton
                          type="button"
                          size="icon-sm"
                          className="h-8 w-8"
                          aria-label="Edit entitlement settings"
                          onClick={() =>
                            setDialogCell({
                              cell,
                              capabilityLabel: row.display_name,
                              planLabel: plan.display_name ?? plan.plan_key,
                            })
                          }
                        >
                          <Settings2 className="size-3.5" aria-hidden />
                        </GhostButton>
                      </div>
                      {cell.hard_block && (
                        <p className="mt-1 text-[10px] text-destructive">Hard block</p>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </div>

      <EntitlementCellDialog
        open={dialogCell != null}
        onOpenChange={(open) => !open && setDialogCell(null)}
        capabilityLabel={dialogCell?.capabilityLabel ?? ""}
        planLabel={dialogCell?.planLabel ?? ""}
        cell={dialogCell?.cell ?? null}
        saving={savingDialog}
        currentUserId={currentUserId}
        currentUserLabel={currentUserLabel}
        onSave={async (draft) => {
          if (!dialogCell) return;
          requestSave(
            dialogCell.cell.plan_id,
            dialogCell.cell.capability_key,
            dialogCell.capabilityLabel,
            dialogCell.planLabel,
            draft
          );
        }}
      />

      <AlertDialog open={pendingToggle != null} onOpenChange={(o) => !o && setPendingToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable critical capability?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to disable <strong>{pendingToggle?.capabilityLabel}</strong> for{" "}
              <strong>{pendingToggle?.planLabel}</strong>. This may block core product functionality
              for subscribers on that plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingToggle) return;
                void runToggle(
                  pendingToggle.planId,
                  pendingToggle.capabilityKey,
                  pendingToggle.nextEnabled
                );
                setPendingToggle(null);
              }}
            >
              Disable anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingSave != null} onOpenChange={(o) => !o && setPendingSave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable critical capability?</AlertDialogTitle>
            <AlertDialogDescription>
              Saving will disable <strong>{pendingSave?.capabilityLabel}</strong> for{" "}
              <strong>{pendingSave?.planLabel}</strong>. This may block core product functionality
              for subscribers on that plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingSave) return;
                void runSave(
                  pendingSave.planId,
                  pendingSave.capabilityKey,
                  pendingSave.draft
                );
                setPendingSave(null);
              }}
            >
              Save anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

