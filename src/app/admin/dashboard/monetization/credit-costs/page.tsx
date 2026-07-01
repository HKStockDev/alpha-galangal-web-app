"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  fetchAdminCreditCosts,
  patchAdminCreditCost,
  type CapabilityCreditCostAdminRow,
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
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { PrimaryButton } from "@/components/ui-kit/buttons";
import { FormInput } from "@/components/ui-kit/forms";
import { Badge } from "@/components/ui/badge";

type PendingSave = {
  capability_key: string;
  credits_cost: number;
  is_enabled: boolean;
};

export default function AdminCreditCostsPage() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const [rows, setRows] = useState<CapabilityCreditCostAdminRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { credits_cost: number; is_enabled: boolean }>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingSave | null>(null);
  const [saving, setSaving] = useState(false);

  const loadRows = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await fetchAdminCreditCosts(accessToken);
      setRows(data);
      const next: Record<string, { credits_cost: number; is_enabled: boolean }> = {};
      for (const row of data) {
        next[row.capability_key] = {
          credits_cost: row.credits_cost,
          is_enabled: row.is_enabled,
        };
      }
      setDrafts(next);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load credit costs");
    } finally {
      setLoading(false);
    }
  }, [accessToken, showError]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const confirmSave = async () => {
    if (!accessToken || !pending) return;
    setSaving(true);
    try {
      await patchAdminCreditCost(accessToken, pending.capability_key, {
        credits_cost: pending.credits_cost,
        is_enabled: pending.is_enabled,
      });
      showSuccess(`Updated ${pending.capability_key}`);
      setPending(null);
      await loadRows();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Capability credit costs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fixed credits per successful capability execution. Changes require confirmation.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton className="h-48 w-full rounded-2xl" />
      ) : (
        <DataTable stickyHeader>
          <TableHeader>
            <TableRow>
              <TableHead>Capability</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Credits cost</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const draft = drafts[row.capability_key] ?? {
                credits_cost: row.credits_cost,
                is_enabled: row.is_enabled,
              };
              return (
                <TableRow key={row.capability_key}>
                  <TableCell>
                    <div className="font-medium">{row.display_name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {row.capability_key}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground">
                    {row.description}
                  </TableCell>
                  <TableCell>
                    <FormInput
                      type="number"
                      min={0}
                      className="w-24"
                      value={draft.credits_cost}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [row.capability_key]: {
                            ...draft,
                            credits_cost: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={draft.is_enabled}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.capability_key]: {
                              ...draft,
                              is_enabled: e.target.checked,
                            },
                          }))
                        }
                      />
                      <Badge variant={draft.is_enabled ? "default" : "secondary"}>
                        {draft.is_enabled ? "On" : "Off"}
                      </Badge>
                    </label>
                  </TableCell>
                  <TableCell className="text-right">
                    <PrimaryButton
                      type="button"
                      size="sm"
                      onClick={() =>
                        setPending({
                          capability_key: row.capability_key,
                          credits_cost: draft.credits_cost,
                          is_enabled: draft.is_enabled,
                        })
                      }
                    >
                      Save
                    </PrimaryButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </DataTable>
      )}

      <AlertDialog open={pending != null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update credit cost?</AlertDialogTitle>
            <AlertDialogDescription>
              Set <strong>{pending?.capability_key}</strong> to {pending?.credits_cost} credits
              (billing {pending?.is_enabled ? "enabled" : "disabled"}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmSave()} disabled={saving}>
              {saving ? "Saving…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
