"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  fetchAdminCreditPolicy,
  patchAdminCreditPolicy,
  type CreditPolicyConfig,
} from "@/lib/api";
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
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { PrimaryButton } from "@/components/ui-kit/buttons";
import { FormInput, FormLabel, FormHelperText } from "@/components/ui-kit/forms";
import { SectionCard } from "@/components/ui-kit/cards";

export default function AdminCreditPolicyPage() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const [policy, setPolicy] = useState<CreditPolicyConfig | null>(null);
  const [draft, setDraft] = useState<Partial<CreditPolicyConfig>>({});
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await fetchAdminCreditPolicy(accessToken);
      setPolicy(data);
      setDraft({});
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load policy");
    } finally {
      setLoading(false);
    }
  }, [accessToken, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = { ...policy, ...draft } as CreditPolicyConfig;

  const save = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      await patchAdminCreditPolicy(accessToken, {
        pack_expiry_days: value.pack_expiry_days,
        base_carryover_enabled: value.base_carryover_enabled,
        pack_carryover_until_expiry: value.pack_carryover_until_expiry,
        carryover_cap_credits: value.carryover_cap_credits,
        upgrade_proration_mode: value.upgrade_proration_mode,
        downgrade_effective_mode: value.downgrade_effective_mode,
      });
      showSuccess("Credit policy updated");
      setConfirmOpen(false);
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !policy) {
    return <LoadingSkeleton className="h-64 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Credit policy</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Global rules for consumption order, pack expiry, and plan-change behavior.
        </p>
      </div>

      <SectionCard>
        <div className="space-y-4">
          <div>
            <FormLabel>Consumption order</FormLabel>
            <FormHelperText className="mt-1">{value.consumption_order} (read-only in MVP)</FormHelperText>
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="pack-expiry">Pack expiry (days)</FormLabel>
            <FormInput
              id="pack-expiry"
              type="number"
              min={1}
              value={value.pack_expiry_days}
              onChange={(e) =>
                setDraft((d) => ({ ...d, pack_expiry_days: Number(e.target.value) }))
              }
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.base_carryover_enabled}
              onChange={(e) =>
                setDraft((d) => ({ ...d, base_carryover_enabled: e.target.checked }))
              }
            />
            Base credits carry over on renewal
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.pack_carryover_until_expiry}
              onChange={(e) =>
                setDraft((d) => ({ ...d, pack_carryover_until_expiry: e.target.checked }))
              }
            />
            Pack credits carry until lot expiry
          </label>
          <FormHelperText className="-mt-2">
            When unchecked, unused pack credits are forfeited at each subscription renewal
            (independent of lot expiry dates).
          </FormHelperText>

          <div className="space-y-2">
            <FormLabel htmlFor="carryover-cap">Carryover cap (credits, empty = no cap)</FormLabel>
            <FormHelperText className="mt-1">
              Applies to base credits only when carryover on renewal is enabled. Pack credits use
              lot expiry, not this cap.
            </FormHelperText>
            <FormInput
              id="carryover-cap"
              type="number"
              min={0}
              disabled={!value.base_carryover_enabled}
              value={value.carryover_cap_credits ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  carryover_cap_credits: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="upgrade-mode">Upgrade proration mode</FormLabel>
            <select
              id="upgrade-mode"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={value.upgrade_proration_mode}
              onChange={(e) =>
                setDraft((d) => ({ ...d, upgrade_proration_mode: e.target.value }))
              }
            >
              <option value="immediate_prorated">immediate_prorated</option>
              <option value="immediate_full">immediate_full</option>
              <option value="next_cycle">next_cycle</option>
            </select>
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="downgrade-mode">Downgrade effective mode</FormLabel>
            <select
              id="downgrade-mode"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={value.downgrade_effective_mode}
              onChange={(e) =>
                setDraft((d) => ({ ...d, downgrade_effective_mode: e.target.value }))
              }
            >
              <option value="next_cycle">next_cycle</option>
              <option value="immediate">immediate</option>
            </select>
          </div>

          <PrimaryButton type="button" onClick={() => setConfirmOpen(true)}>
            Save policy
          </PrimaryButton>
        </div>
      </SectionCard>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update credit policy?</AlertDialogTitle>
            <AlertDialogDescription>
              This affects how credits are granted, consumed, and expired for all organizations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
