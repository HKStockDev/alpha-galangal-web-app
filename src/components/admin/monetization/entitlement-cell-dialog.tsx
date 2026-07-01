"use client";

import { useEffect, useState } from "react";
import type { EntitlementCell } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EntitlementAuditLabel } from "@/components/admin/monetization/entitlement-audit-label";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { FormLabel } from "@/components/ui-kit/forms";
import { cn } from "@/lib/utils";

export type EntitlementCellDraft = {
  is_enabled: boolean;
  hard_block: boolean;
  quota_period: "" | "day" | "month" | "lifetime";
  quota_limit: string;
  upsell_message: string;
};

function cellToDraft(cell: EntitlementCell): EntitlementCellDraft {
  return {
    is_enabled: cell.is_enabled,
    hard_block: cell.hard_block,
    quota_period: cell.quota_period ?? "",
    quota_limit: cell.quota_limit != null ? String(cell.quota_limit) : "",
    upsell_message: cell.upsell_message ?? "",
  };
}

const selectClass = cn(
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
);

export function EntitlementCellDialog({
  open,
  onOpenChange,
  capabilityLabel,
  planLabel,
  cell,
  saving,
  currentUserId,
  currentUserLabel,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capabilityLabel: string;
  planLabel: string;
  cell: EntitlementCell | null;
  saving: boolean;
  currentUserId?: string | null;
  currentUserLabel?: string | null;
  onSave: (draft: EntitlementCellDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<EntitlementCellDraft | null>(null);

  useEffect(() => {
    if (cell && open) {
      setDraft(cellToDraft(cell));
    }
  }, [cell, open]);

  if (!cell || !draft) return null;

  const quotaLimitRequired = draft.quota_period !== "" && draft.quota_limit.trim() === "";
  const quotaLimitInvalid =
    draft.quota_limit.trim() !== "" &&
    (Number.isNaN(Number(draft.quota_limit)) || Number(draft.quota_limit) < 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Entitlement settings</DialogTitle>
          <DialogDescription>
            {capabilityLabel} · {planLabel}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="ent-enabled">Enabled</Label>
            <Switch
              id="ent-enabled"
              checked={draft.is_enabled}
              onCheckedChange={(checked) => setDraft((d) => d && { ...d, is_enabled: checked })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="ent-hard-block">Hard block</Label>
            <Switch
              id="ent-hard-block"
              checked={draft.hard_block}
              onCheckedChange={(checked) => setDraft((d) => d && { ...d, hard_block: checked })}
            />
          </div>
          <div>
            <FormLabel>Quota period</FormLabel>
            <select
              className={cn(selectClass, "mt-1")}
              value={draft.quota_period}
              onChange={(e) =>
                setDraft((d) =>
                  d
                    ? {
                        ...d,
                        quota_period: e.target.value as EntitlementCellDraft["quota_period"],
                      }
                    : d
                )
              }
            >
              <option value="">None</option>
              <option value="day">Day</option>
              <option value="month">Month</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
          <div>
            <FormLabel>Quota limit</FormLabel>
            <input
              type="number"
              min={0}
              className={cn(selectClass, "mt-1")}
              value={draft.quota_limit}
              onChange={(e) => setDraft((d) => d && { ...d, quota_limit: e.target.value })}
              placeholder={draft.quota_period ? "Required when period is set" : "Optional"}
            />
          </div>
          <div>
            <FormLabel>Upsell message</FormLabel>
            <Textarea
              className="mt-1 min-h-[80px]"
              value={draft.upsell_message}
              onChange={(e) => setDraft((d) => d && { ...d, upsell_message: e.target.value })}
              placeholder="Shown when this capability is blocked"
            />
          </div>
          <EntitlementAuditLabel
            cell={cell}
            currentUserId={currentUserId}
            currentUserLabel={currentUserLabel}
          />
        </div>
        <DialogFooter>
          <SecondaryButton type="button" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={saving || quotaLimitInvalid || quotaLimitRequired}
            onClick={() => void onSave(draft)}
          >
            {saving ? "Saving…" : "Save"}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
