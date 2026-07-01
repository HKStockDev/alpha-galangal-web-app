"use client";

import { useState } from "react";
import type { EntitlementCell } from "@/lib/api";
import { isCriticalCapability } from "@/components/admin/monetization/entitlement-constants";
import {
  EntitlementCellDialog,
  type EntitlementCellDraft,
} from "@/components/admin/monetization/entitlement-cell-dialog";
import type { PlanCapabilityRow } from "@/components/admin/monetization/plan-capabilities-utils";
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
import { Settings2 } from "lucide-react";

type PendingToggle = {
  capabilityKey: string;
  capabilityLabel: string;
  nextEnabled: boolean;
};

type PendingSave = {
  capabilityKey: string;
  capabilityLabel: string;
  draft: EntitlementCellDraft;
};

export function PlanCapabilitiesList({
  planId,
  planLabel,
  rows,
  currentUserId,
  currentUserLabel,
  onToggle,
  onSaveCell,
}: {
  planId: string;
  planLabel: string;
  rows: PlanCapabilityRow[];
  currentUserId?: string | null;
  currentUserLabel?: string | null;
  onToggle: (capabilityKey: string, isEnabled: boolean) => Promise<void>;
  onSaveCell: (capabilityKey: string, draft: EntitlementCellDraft) => Promise<EntitlementCell>;
}) {
  const [dialogCell, setDialogCell] = useState<{
    cell: EntitlementCell;
    capabilityLabel: string;
  } | null>(null);
  const [savingDialog, setSavingDialog] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const runToggle = async (capabilityKey: string, isEnabled: boolean) => {
    setTogglingKey(capabilityKey);
    try {
      await onToggle(capabilityKey, isEnabled);
    } finally {
      setTogglingKey(null);
    }
  };

  const handleSwitchChange = (row: PlanCapabilityRow, checked: boolean) => {
    if (!checked && isCriticalCapability(row.capability_key)) {
      setPendingToggle({
        capabilityKey: row.capability_key,
        capabilityLabel: row.display_name,
        nextEnabled: false,
      });
      return;
    }
    void runToggle(row.capability_key, checked);
  };

  const runSave = async (capabilityKey: string, draft: EntitlementCellDraft) => {
    setSavingDialog(true);
    try {
      await onSaveCell(capabilityKey, draft);
      setDialogCell(null);
    } catch {
      /* toast + rollback handled in hook */
    } finally {
      setSavingDialog(false);
    }
  };

  const requestSave = (
    capabilityKey: string,
    capabilityLabel: string,
    draft: EntitlementCellDraft
  ) => {
    if (!draft.is_enabled && isCriticalCapability(capabilityKey)) {
      setPendingSave({ capabilityKey, capabilityLabel, draft });
      return;
    }
    void runSave(capabilityKey, draft);
  };

  return (
    <>
      <DataTable stickyHeader>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px]">Capability</TableHead>
            <TableHead className="min-w-[200px]">Description</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="w-[120px] text-center">Enabled</TableHead>
            <TableHead className="w-[80px] text-center">Settings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const cell = row.cell;
            const isToggling = togglingKey === row.capability_key;

            return (
              <TableRow key={row.capability_key}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{row.display_name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {row.capability_key}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.description || "—"}
                </TableCell>
                <TableCell>
                  {row.is_mutating ? (
                    <Badge variant="outline" className="text-[10px]">
                      Mutating
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Read-only
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Switch
                      checked={cell.is_enabled}
                      disabled={isToggling || savingDialog}
                      onCheckedChange={(checked) => handleSwitchChange(row, checked)}
                      aria-label={`${row.display_name} for ${planLabel}`}
                    />
                    {cell.hard_block && (
                      <span className="text-[10px] text-destructive">Hard block</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <GhostButton
                    type="button"
                    size="icon-sm"
                    className="h-8 w-8"
                    aria-label="Edit entitlement settings"
                    onClick={() =>
                      setDialogCell({
                        cell,
                        capabilityLabel: row.display_name,
                      })
                    }
                  >
                    <Settings2 className="size-3.5" aria-hidden />
                  </GhostButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </DataTable>

      <EntitlementCellDialog
        open={dialogCell != null}
        onOpenChange={(open) => !open && setDialogCell(null)}
        capabilityLabel={dialogCell?.capabilityLabel ?? ""}
        planLabel={planLabel}
        cell={dialogCell?.cell ?? null}
        saving={savingDialog}
        currentUserId={currentUserId}
        currentUserLabel={currentUserLabel}
        onSave={async (draft) => {
          if (!dialogCell) return;
          requestSave(dialogCell.cell.capability_key, dialogCell.capabilityLabel, draft);
        }}
      />

      <AlertDialog open={pendingToggle != null} onOpenChange={(o) => !o && setPendingToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable critical capability?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to disable <strong>{pendingToggle?.capabilityLabel}</strong> for{" "}
              <strong>{planLabel}</strong>. This may block core product functionality for
              subscribers on that plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingToggle) return;
                void runToggle(pendingToggle.capabilityKey, pendingToggle.nextEnabled);
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
              <strong>{planLabel}</strong>. This may block core product functionality for
              subscribers on that plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingSave) return;
                void runSave(pendingSave.capabilityKey, pendingSave.draft);
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
