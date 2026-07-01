"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  fetchAdminEntitlementsMatrix,
  fetchAdminMonetizationPlans,
  previewAdminEntitlement,
  type EntitlementMatrixRow,
  type EntitlementPreviewResult,
  type SubscriptionPlanAdminRow,
} from "@/lib/api";
import { EntitlementPreviewPanel } from "@/components/admin/monetization/entitlement-preview-panel";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { FormLabel } from "@/components/ui-kit/forms";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "h-9 w-full min-w-[12rem] rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
);

export default function AdminMonetizationPreviewPage() {
  const { accessToken } = useAuth();
  const { showError } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlanAdminRow[]>([]);
  const [capabilities, setCapabilities] = useState<EntitlementMatrixRow[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [planId, setPlanId] = useState("");
  const [capabilityKey, setCapabilityKey] = useState("");
  const [preview, setPreview] = useState<EntitlementPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadOptions = useCallback(async () => {
    if (!accessToken) return;
    setOptionsLoading(true);
    try {
      const [planRows, matrix] = await Promise.all([
        fetchAdminMonetizationPlans(accessToken, { active: true }),
        fetchAdminEntitlementsMatrix(accessToken),
      ]);
      setPlans(planRows);
      setCapabilities(matrix.rows);
      setPlanId((prev) => prev || planRows[0]?.id || "");
      setCapabilityKey((prev) => prev || matrix.rows[0]?.capability_key || "");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load preview options");
    } finally {
      setOptionsLoading(false);
    }
  }, [accessToken, showError]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const capabilityGroups = useMemo(() => {
    const readOnly = capabilities.filter((c) => !c.is_mutating);
    const mutating = capabilities.filter((c) => c.is_mutating);
    return { readOnly, mutating };
  }, [capabilities]);

  const runPreview = useCallback(async () => {
    if (!accessToken || !planId || !capabilityKey) return;
    setPreviewLoading(true);
    setPreview(null);
    try {
      const result = await previewAdminEntitlement(accessToken, planId, capabilityKey);
      setPreview(result);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  }, [accessToken, planId, capabilityKey, showError]);

  useEffect(() => {
    if (!planId || !capabilityKey || optionsLoading) return;
    void runPreview();
  }, [planId, capabilityKey, optionsLoading, runPreview]);

  if (optionsLoading) {
    return <LoadingSkeleton className="h-64 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Blocked response preview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Simulate what subscribers see when a capability is allowed or blocked for a plan.
          Preview updates when you change the selection.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
          <div>
            <FormLabel htmlFor="preview-plan">Plan</FormLabel>
            <select
              id="preview-plan"
              className={cn(selectClass, "mt-1")}
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name ?? p.plan_key}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FormLabel htmlFor="preview-capability">Capability</FormLabel>
            <select
              id="preview-capability"
              className={cn(selectClass, "mt-1")}
              value={capabilityKey}
              onChange={(e) => setCapabilityKey(e.target.value)}
            >
              {capabilityGroups.readOnly.length > 0 && (
                <optgroup label="Read-only">
                  {capabilityGroups.readOnly.map((c) => (
                    <option key={c.capability_key} value={c.capability_key}>
                      {c.display_name}
                    </option>
                  ))}
                </optgroup>
              )}
              {capabilityGroups.mutating.length > 0 && (
                <optgroup label="Mutating">
                  {capabilityGroups.mutating.map((c) => (
                    <option key={c.capability_key} value={c.capability_key}>
                      {c.display_name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <PrimaryButton type="button" onClick={() => void runPreview()} disabled={previewLoading}>
              {previewLoading ? "Previewing…" : "Preview"}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              onClick={() => {
                setPreview(null);
                setPlanId(plans[0]?.id ?? "");
                setCapabilityKey(capabilities[0]?.capability_key ?? "");
              }}
            >
              Reset
            </SecondaryButton>
          </div>
        </div>

        <EntitlementPreviewPanel result={preview} loading={previewLoading} />
      </div>
    </div>
  );
}
