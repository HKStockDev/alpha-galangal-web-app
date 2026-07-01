"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  bulkEnableAdminReadonlyEntitlements,
  copyAdminPlanEntitlements,
  fetchAdminEntitlementsMatrix,
  type EntitlementsMatrixResponse,
} from "@/lib/api";
import { EntitlementsMatrix } from "@/components/admin/monetization/entitlements-matrix";
import { EntitlementsMatrixSkeleton } from "@/components/admin/monetization/entitlements-matrix-skeleton";
import { useOptimisticEntitlement } from "@/components/admin/monetization/use-optimistic-entitlement";
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
import { EmptyState } from "@/components/ui-kit/empty-state";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { FormLabel } from "@/components/ui-kit/forms";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "h-9 min-w-[12rem] rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
);

export default function AdminMonetizationEntitlementsPage() {
  const searchParams = useSearchParams();
  const highlightPlanId = searchParams.get("planId");
  const { accessToken, user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [matrix, setMatrix] = useState<EntitlementsMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [baselinePlanId, setBaselinePlanId] = useState<string>("");
  const [bulkPlanId, setBulkPlanId] = useState<string>("");
  const [copySourceId, setCopySourceId] = useState<string>("");
  const [copyTargetId, setCopyTargetId] = useState<string>("");
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [copyRunning, setCopyRunning] = useState(false);

  const loadMatrix = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await fetchAdminEntitlementsMatrix(accessToken);
      setMatrix(data);
      setBaselinePlanId((prev) => {
        if (prev && data.plans.some((p) => p.id === prev)) return prev;
        const professional = data.plans.find((p) => p.plan_key.startsWith("professional"));
        return professional?.id ?? data.plans[0]?.id ?? "";
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load entitlements");
    } finally {
      setLoading(false);
    }
  }, [accessToken, showError]);

  useEffect(() => {
    void loadMatrix();
  }, [loadMatrix]);

  const plans = matrix?.plans ?? [];

  const highlightedPlan = useMemo(
    () => (highlightPlanId ? plans.find((p) => p.id === highlightPlanId) : undefined),
    [highlightPlanId, plans]
  );

  const { toggleEntitlement, saveEntitlementFromDraft } = useOptimisticEntitlement({
    accessToken,
    currentUserId: user?.id,
    matrix,
    setMatrix,
    showSuccess,
    showError,
  });

  const currentUserLabel = user?.full_name ?? user?.email ?? null;

  const runBulkReadonly = async () => {
    if (!accessToken) return;
    setBulkRunning(true);
    try {
      const result = await bulkEnableAdminReadonlyEntitlements(
        accessToken,
        bulkPlanId || undefined
      );
      showSuccess(
        `Enabled read-only capabilities (${result.entitlements_upserted} cells across ${result.plans_updated} plan(s))`
      );
      await loadMatrix();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Bulk enable failed");
    } finally {
      setBulkRunning(false);
    }
  };

  const runCopy = async () => {
    if (!accessToken || !copySourceId || !copyTargetId) return;
    setCopyRunning(true);
    try {
      const result = await copyAdminPlanEntitlements(
        accessToken,
        copySourceId,
        copyTargetId
      );
      showSuccess(`Copied ${result.entitlements_copied} entitlements`);
      setCopyDialogOpen(false);
      await loadMatrix();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Copy failed");
    } finally {
      setCopyRunning(false);
    }
  };

  const planOptions = useMemo(
    () =>
      plans.map((p) => (
        <option key={p.id} value={p.id}>
          {p.display_name ?? p.plan_key}
        </option>
      )),
    [plans]
  );

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Plan entitlements</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Control which AI capabilities each active plan can use. Amber cells differ from the
            baseline plan.
          </p>
          {highlightedPlan && (
            <p className="mt-2 text-sm text-primary">
              Highlighting column:{" "}
              <span className="font-medium">
                {highlightedPlan.display_name ?? highlightedPlan.plan_key}
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div>
            <FormLabel>Baseline plan (diff)</FormLabel>
            <select
              className={cn(selectClass, "mt-1")}
              value={baselinePlanId}
              onChange={(e) => setBaselinePlanId(e.target.value)}
              disabled={loading || plans.length === 0}
            >
              {planOptions}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-foreground">Bulk actions</p>
        <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:items-end">
          <div>
            <FormLabel>Enable read-only on plan</FormLabel>
            <select
              className={cn(selectClass, "mt-1")}
              value={bulkPlanId}
              onChange={(e) => setBulkPlanId(e.target.value)}
              disabled={loading}
            >
              <option value="">All active plans</option>
              {planOptions}
            </select>
          </div>
          <PrimaryButton
            type="button"
            disabled={bulkRunning || loading}
            onClick={() => void runBulkReadonly()}
          >
            {bulkRunning ? "Enabling…" : "Enable all read-only capabilities"}
          </PrimaryButton>
          <div className="hidden h-9 w-px bg-border sm:block" aria-hidden />
          <div>
            <FormLabel>Copy from</FormLabel>
            <select
              className={cn(selectClass, "mt-1")}
              value={copySourceId}
              onChange={(e) => setCopySourceId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select source…</option>
              {planOptions}
            </select>
          </div>
          <div>
            <FormLabel>Copy to</FormLabel>
            <select
              className={cn(selectClass, "mt-1")}
              value={copyTargetId}
              onChange={(e) => setCopyTargetId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select target…</option>
              {planOptions}
            </select>
          </div>
          <SecondaryButton
            type="button"
            disabled={!copySourceId || !copyTargetId || copySourceId === copyTargetId}
            onClick={() => setCopyDialogOpen(true)}
          >
            Copy entitlements…
          </SecondaryButton>
        </div>
      </div>

      {loading ? (
        <EntitlementsMatrixSkeleton planCount={matrix?.plans.length ?? 4} />
      ) : !matrix || matrix.plans.length === 0 ? (
        <EmptyState
          title="No active plans"
          description="Activate subscription plans before configuring entitlements."
        />
      ) : (
        <EntitlementsMatrix
          plans={matrix.plans}
          rows={matrix.rows}
          baselinePlanId={baselinePlanId || null}
          highlightPlanId={highlightPlanId}
          currentUserId={user?.id}
          currentUserLabel={currentUserLabel}
          onToggle={toggleEntitlement}
          onSaveCell={saveEntitlementFromDraft}
        />
      )}

      <AlertDialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copy entitlements?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces all entitlements on the target plan with a copy from the source plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={copyRunning}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={copyRunning} onClick={() => void runCopy()}>
              {copyRunning ? "Copying…" : "Copy now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
