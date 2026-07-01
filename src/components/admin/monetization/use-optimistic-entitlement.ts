"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  patchAdminEntitlement,
  type EntitlementCell,
  type EntitlementsMatrixResponse,
} from "@/lib/api";
import {
  applyPatchToCell,
  draftToPatch,
  type EntitlementPatchBody,
} from "@/components/admin/monetization/entitlement-patch";
import type { EntitlementCellDraft } from "@/components/admin/monetization/entitlement-cell-dialog";

export function mergeEntitlementCell(
  matrix: EntitlementsMatrixResponse,
  updated: EntitlementCell
): EntitlementsMatrixResponse {
  return {
    ...matrix,
    rows: matrix.rows.map((row) => {
      if (row.capability_key !== updated.capability_key) return row;
      const hasCell = row.cells.some(
        (c) => c.plan_id === updated.plan_id && c.capability_key === updated.capability_key
      );
      return {
        ...row,
        cells: hasCell
          ? row.cells.map((c) =>
              c.plan_id === updated.plan_id && c.capability_key === updated.capability_key
                ? updated
                : c
            )
          : [...row.cells, updated],
      };
    }),
  };
}

export function useOptimisticEntitlement({
  accessToken,
  currentUserId,
  matrix,
  setMatrix,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  currentUserId?: string | null;
  matrix: EntitlementsMatrixResponse | null;
  setMatrix: Dispatch<SetStateAction<EntitlementsMatrixResponse | null>>;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}) {
  const toggleEntitlement = useCallback(
    async (planId: string, capabilityKey: string, isEnabled: boolean) => {
      if (!accessToken || !matrix) return;
      const row = matrix.rows.find((r) => r.capability_key === capabilityKey);
      const cell = row?.cells.find((c) => c.plan_id === planId);
      if (!cell) return;

      const previous = { ...cell };
      const optimistic = applyPatchToCell(
        cell,
        {
          is_enabled: isEnabled,
          hard_block: cell.hard_block,
          quota_period: cell.quota_period,
          quota_limit: cell.quota_limit,
          upsell_message: cell.upsell_message,
        },
        currentUserId
      );
      setMatrix(mergeEntitlementCell(matrix, optimistic));

      try {
        const updated = await patchAdminEntitlement(accessToken, planId, capabilityKey, {
          is_enabled: isEnabled,
        });
        setMatrix((m) => (m ? mergeEntitlementCell(m, updated) : m));
        showSuccess("Entitlement updated");
      } catch (err) {
        setMatrix((m) => (m ? mergeEntitlementCell(m, previous) : m));
        showError(err instanceof Error ? err.message : "Failed to update entitlement");
        throw err;
      }
    },
    [accessToken, currentUserId, matrix, setMatrix, showError, showSuccess]
  );

  const saveEntitlement = useCallback(
    async (planId: string, capabilityKey: string, body: EntitlementPatchBody) => {
      if (!accessToken || !matrix) {
        throw new Error("Not ready");
      }
      const row = matrix.rows.find((r) => r.capability_key === capabilityKey);
      const cell = row?.cells.find((c) => c.plan_id === planId);
      if (!cell) {
        throw new Error("Cell not found");
      }

      const previous = { ...cell };
      const optimistic = applyPatchToCell(cell, body, currentUserId);
      setMatrix(mergeEntitlementCell(matrix, optimistic));

      try {
        const updated = await patchAdminEntitlement(
          accessToken,
          planId,
          capabilityKey,
          body
        );
        setMatrix((m) => (m ? mergeEntitlementCell(m, updated) : m));
        showSuccess("Entitlement saved");
        return updated;
      } catch (err) {
        setMatrix((m) => (m ? mergeEntitlementCell(m, previous) : m));
        showError(err instanceof Error ? err.message : "Failed to save entitlement");
        throw err;
      }
    },
    [accessToken, currentUserId, matrix, setMatrix, showError, showSuccess]
  );

  const saveEntitlementFromDraft = useCallback(
    async (planId: string, capabilityKey: string, draft: EntitlementCellDraft) =>
      saveEntitlement(planId, capabilityKey, draftToPatch(draft)),
    [saveEntitlement]
  );

  return { toggleEntitlement, saveEntitlement, saveEntitlementFromDraft };
}

export type { EntitlementCellDraft };
