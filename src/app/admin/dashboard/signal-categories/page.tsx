"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  createAdminSignalCategory,
  getAdminSignalCategory,
  listAdminSignalCategories,
  updateAdminSignalCategory,
  type SignalCategory,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { GhostButton, PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const DESCRIPTION_MAX = 10000;
const NAME_MAX = 255;

const textareaClass = cn(
  "min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
);

export default function AdminSignalCategoriesPage() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const [rows, setRows] = useState<SignalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadRows = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await listAdminSignalCategories(accessToken);
      setRows(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [accessToken, showError]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setDialogOpen(true);
  };

  const openEdit = async (row: SignalCategory) => {
    if (!accessToken) return;
    setEditingId(row.id);
    setDialogOpen(true);
    setName(row.name);
    setDescription(row.description ?? "");
    try {
      const full = await getAdminSignalCategory(accessToken, row.id);
      setName(full.name);
      setDescription(full.description ?? "");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load category details");
    }
  };

  const submit = async () => {
    if (!accessToken) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      showError("Name is required.");
      return;
    }
    if (trimmedName.length > NAME_MAX) {
      showError(`Name must be ${NAME_MAX} characters or fewer.`);
      return;
    }
    if (description.length > DESCRIPTION_MAX) {
      showError(`Description must be ${DESCRIPTION_MAX} characters or fewer.`);
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateAdminSignalCategory(accessToken, editingId, {
          name: trimmedName,
          description: description.trim() ? description.trim() : null,
        });
        showSuccess("Category updated");
      } else {
        await createAdminSignalCategory(accessToken, {
          name: trimmedName,
          description: description.trim() ? description.trim() : null,
        });
        showSuccess("Category created");
      }
      await loadRows();
      setDialogOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Formula categories
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage signal categories used to group formulas across the platform.
            </p>
          </div>
          <PrimaryButton type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New category
          </PrimaryButton>
        </header>

        {loading ? (
          <LoadingSkeleton variant="card" lines={4} className="py-6" />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Create your first signal category to start organizing formulas."
            action={
              <PrimaryButton type="button" onClick={openCreate}>
                Create category
              </PrimaryButton>
            }
          />
        ) : (
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[1%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.description?.trim() ? row.description : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <GhostButton
                      type="button"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => void openEdit(row)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </GhostButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit category" : "Create category"}</DialogTitle>
            <DialogDescription>
              Name is required (1..255 chars). Description is optional (up to 10,000 chars).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <FormLabel htmlFor="signal-category-name">Name</FormLabel>
              <FormInput
                id="signal-category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={NAME_MAX}
                placeholder="e.g. BUSINESS_QUALITY"
              />
            </div>
            <div className="space-y-1.5">
              <FormLabel htmlFor="signal-category-description">Description</FormLabel>
              <textarea
                id="signal-category-description"
                className={textareaClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={DESCRIPTION_MAX}
                placeholder="Optional category description"
              />
              <p className="text-xs text-muted-foreground">{description.length}/{DESCRIPTION_MAX}</p>
            </div>
          </div>
          <DialogFooter>
            <SecondaryButton type="button" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="button" disabled={saving} onClick={() => void submit()}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Create category"}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
