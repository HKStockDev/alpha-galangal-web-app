import type {
  EntitlementCell,
  EntitlementMatrixRow,
  EntitlementsMatrixResponse,
  SubscriptionPlanAdminRow,
} from "@/lib/api";

export function defaultEntitlementCell(
  planId: string,
  capabilityKey: string
): EntitlementCell {
  return {
    id: null,
    plan_id: planId,
    capability_key: capabilityKey,
    is_enabled: false,
    hard_block: false,
    quota_period: null,
    quota_limit: null,
    upsell_message: null,
    updated_at: null,
    updated_by_user_id: null,
  };
}

export function getCellForPlan(
  row: EntitlementMatrixRow,
  planId: string
): EntitlementCell {
  return (
    row.cells.find((c) => c.plan_id === planId) ??
    defaultEntitlementCell(planId, row.capability_key)
  );
}

/** Ensures matrix rows include cells for a plan (e.g. inactive plans omitted from matrix API). */
export function ensurePlanInMatrix(
  matrix: EntitlementsMatrixResponse,
  plan: SubscriptionPlanAdminRow
): EntitlementsMatrixResponse {
  if (matrix.plans.some((p) => p.id === plan.id)) {
    const rows = matrix.rows.map((row) => {
      if (row.cells.some((c) => c.plan_id === plan.id)) return row;
      return {
        ...row,
        cells: [...row.cells, defaultEntitlementCell(plan.id, row.capability_key)],
      };
    });
    return { ...matrix, rows };
  }

  return {
    plans: [...matrix.plans, plan],
    rows: matrix.rows.map((row) => ({
      ...row,
      cells: [...row.cells, defaultEntitlementCell(plan.id, row.capability_key)],
    })),
  };
}

export type PlanCapabilityRow = EntitlementMatrixRow & {
  cell: EntitlementCell;
};

export function buildPlanCapabilityRows(
  matrix: EntitlementsMatrixResponse,
  planId: string
): PlanCapabilityRow[] {
  return matrix.rows.map((row) => ({
    ...row,
    cell: getCellForPlan(row, planId),
  }));
}
