import type { EntitlementCell } from "@/lib/api";
import type { EntitlementCellDraft } from "@/components/admin/monetization/entitlement-cell-dialog";

export type EntitlementPatchBody = {
  is_enabled: boolean;
  hard_block: boolean;
  quota_period: "day" | "month" | "lifetime" | null;
  quota_limit: number | null;
  upsell_message: string | null;
};

export function draftToPatch(draft: EntitlementCellDraft): EntitlementPatchBody {
  return {
    is_enabled: draft.is_enabled,
    hard_block: draft.hard_block,
    quota_period: draft.quota_period === "" ? null : draft.quota_period,
    quota_limit:
      draft.quota_limit.trim() === "" ? null : Math.max(0, Number(draft.quota_limit)),
    upsell_message: draft.upsell_message.trim() === "" ? null : draft.upsell_message.trim(),
  };
}

/** Apply a PATCH body to a cell for optimistic UI (includes audit hints). */
export function applyPatchToCell(
  cell: EntitlementCell,
  patch: EntitlementPatchBody,
  editorUserId?: string | null
): EntitlementCell {
  return {
    ...cell,
    ...patch,
    updated_at: new Date().toISOString(),
    updated_by_user_id: editorUserId ?? cell.updated_by_user_id,
  };
}
