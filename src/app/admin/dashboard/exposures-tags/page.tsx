"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  DangerButton,
} from "@/components/ui-kit/buttons";
import {
  type AdminExposureRow,
  type AdminTagRow,
  createAdminExposure,
  createAdminTag,
  deleteAdminExposure,
  deleteAdminTag,
  fetchAdminExposures,
  fetchAdminTags,
  updateAdminExposure,
  updateAdminTag,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Spinner } from "@/components/ui/spinner";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { cn } from "@/lib/utils";
import { Pencil, Plus, Tags, Trash2, TrendingUp } from "lucide-react";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";

type Tab = "exposures" | "tags";

type PendingDelete =
  | { kind: "exposure"; row: AdminExposureRow }
  | { kind: "tag"; row: AdminTagRow }
  | null;

const textareaClass =
  "min-h-[88px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

function parseOptionalInt(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalFloat(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function ExposuresTagsAdminPage() {
  const { accessToken } = useAuth();
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState<Tab>("exposures");
  const [loading, setLoading] = useState(true);
  const [exposures, setExposures] = useState<AdminExposureRow[]>([]);
  const [tags, setTags] = useState<AdminTagRow[]>([]);
  const [saving, setSaving] = useState(false);

  const [exposureDialogOpen, setExposureDialogOpen] = useState(false);
  const [editingExposure, setEditingExposure] = useState<AdminExposureRow | null>(null);
  const [exName, setExName] = useState("");
  const [exSlug, setExSlug] = useState("");
  const [exCategory, setExCategory] = useState("");
  const [exDescription, setExDescription] = useState("");
  const [exActive, setExActive] = useState(true);
  const [exSort, setExSort] = useState("");
  const [exPolarity, setExPolarity] = useState<string>("");

  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<AdminTagRow | null>(null);
  const [tgName, setTgName] = useState("");
  const [tgSlug, setTgSlug] = useState("");
  const [tgGroup, setTgGroup] = useState("");
  const [tgDescription, setTgDescription] = useState("");
  const [tgActive, setTgActive] = useState(true);
  const [tgLlm, setTgLlm] = useState(true);
  const [tgSort, setTgSort] = useState("");
  const [tgWeight, setTgWeight] = useState("");
  const [tgOrgId, setTgOrgId] = useState("");

  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const loadAll = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [ex, tg] = await Promise.all([
        fetchAdminExposures(accessToken),
        fetchAdminTags(accessToken),
      ]);
      setExposures(ex);
      setTags(tg);
    } catch (e) {
      showError(
        `Could not load data: ${e instanceof Error ? e.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, showError]);

  const refreshData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [ex, tg] = await Promise.all([
        fetchAdminExposures(accessToken),
        fetchAdminTags(accessToken),
      ]);
      setExposures(ex);
      setTags(tg);
    } catch {
      /* toast only on explicit load */
    }
  }, [accessToken]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  function openCreateExposure() {
    setEditingExposure(null);
    setExName("");
    setExSlug("");
    setExCategory("");
    setExDescription("");
    setExActive(true);
    setExSort("");
    setExPolarity("");
    setExposureDialogOpen(true);
  }

  function openEditExposure(row: AdminExposureRow) {
    setEditingExposure(row);
    setExName(row.name);
    setExSlug(row.slug);
    setExCategory(row.category);
    setExDescription(row.description ?? "");
    setExActive(row.is_active);
    setExSort(row.sort_order != null ? String(row.sort_order) : "");
    setExPolarity(
      row.polarity === null || row.polarity === undefined ? "" : String(row.polarity)
    );
    setExposureDialogOpen(true);
  }

  async function submitExposure() {
    if (!accessToken) return;
    const polarityRaw = exPolarity.trim();
    let polarity: number | null | undefined;
    if (polarityRaw === "") polarity = null;
    else if (polarityRaw === "-1" || polarityRaw === "0" || polarityRaw === "1") {
      polarity = Number.parseInt(polarityRaw, 10);
    } else {
      showError("Invalid polarity: use empty, -1, 0, or 1.");
      return;
    }
    setSaving(true);
    try {
      const sort_order = parseOptionalInt(exSort);
      if (editingExposure) {
        await updateAdminExposure(accessToken, editingExposure.exposure_id, {
          name: exName.trim(),
          slug: exSlug.trim(),
          category: exCategory.trim(),
          description: exDescription.trim() || null,
          is_active: exActive,
          sort_order,
          polarity,
        });
        showSuccess("Exposure updated");
      } else {
        await createAdminExposure(accessToken, {
          name: exName.trim(),
          slug: exSlug.trim(),
          category: exCategory.trim(),
          description: exDescription.trim() || null,
          is_active: exActive,
          sort_order,
          polarity: polarity ?? null,
        });
        showSuccess("Exposure created");
      }
      await refreshData();
      setExposureDialogOpen(false);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function openCreateTag() {
    setEditingTag(null);
    setTgName("");
    setTgSlug("");
    setTgGroup("");
    setTgDescription("");
    setTgActive(true);
    setTgLlm(true);
    setTgSort("");
    setTgWeight("");
    setTgOrgId("");
    setTagDialogOpen(true);
  }

  function openEditTag(row: AdminTagRow) {
    setEditingTag(row);
    setTgName(row.name);
    setTgSlug(row.slug);
    setTgGroup(row.group);
    setTgDescription(row.description ?? "");
    setTgActive(row.is_active);
    setTgLlm(row.is_llm_assignable);
    setTgSort(row.sort_order != null ? String(row.sort_order) : "");
    setTgWeight(row.weight_hint != null ? String(row.weight_hint) : "");
    setTgOrgId(row.organization_id);
    setTagDialogOpen(true);
  }

  async function submitTag() {
    if (!accessToken) return;
    setSaving(true);
    try {
      const sort_order = parseOptionalInt(tgSort);
      const weight_hint = parseOptionalFloat(tgWeight);
      const orgTrim = tgOrgId.trim();
      if (editingTag) {
        await updateAdminTag(accessToken, editingTag.tag_id, {
          name: tgName.trim(),
          slug: tgSlug.trim(),
          group: tgGroup.trim(),
          description: tgDescription.trim() || null,
          is_active: tgActive,
          is_llm_assignable: tgLlm,
          sort_order,
          weight_hint,
          ...(orgTrim ? { organization_id: orgTrim } : {}),
        });
        showSuccess("Tag updated");
      } else {
        await createAdminTag(accessToken, {
          name: tgName.trim(),
          slug: tgSlug.trim(),
          group: tgGroup.trim(),
          description: tgDescription.trim() || null,
          is_active: tgActive,
          is_llm_assignable: tgLlm,
          sort_order,
          weight_hint,
          ...(orgTrim ? { organization_id: orgTrim } : {}),
        });
        showSuccess("Tag created");
      }
      await refreshData();
      setTagDialogOpen(false);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!accessToken || !pendingDelete) return;
    setSaving(true);
    try {
      if (pendingDelete.kind === "exposure") {
        await deleteAdminExposure(accessToken, pendingDelete.row.exposure_id);
        showSuccess("Exposure deleted");
      } else {
        await deleteAdminTag(accessToken, pendingDelete.row.tag_id);
        showSuccess("Tag deleted");
      }
      setPendingDelete(null);
      await refreshData();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  if (!accessToken) {
    return (
      <div className="p-8">
        <EmptyState compact description="Sign in to manage exposures and tags." />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Exposures &amp; tags
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide dictionaries used for security enrichment and screening. Deleting an item
          also removes its links to tickers (cascade).
        </p>
        {!loading && (
          <p className="mt-2 text-sm text-foreground/90">
            <span className="font-medium tabular-nums">{exposures.length}</span>{" "}
            {exposures.length === 1 ? "exposure" : "exposures"}
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="font-medium tabular-nums">{tags.length}</span>{" "}
            {tags.length === 1 ? "tag" : "tags"}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <SecondaryButton
          type="button"
          size="sm"
          className={cn("gap-2", tab === "exposures" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "")}
          onClick={() => setTab("exposures")}
        >
          <TrendingUp className="size-4" />
          Exposures
          {!loading && (
            <span className="tabular-nums opacity-90">({exposures.length})</span>
          )}
        </SecondaryButton>
        <SecondaryButton
          type="button"
          size="sm"
          className={cn("gap-2", tab === "tags" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "")}
          onClick={() => setTab("tags")}
        >
          <Tags className="size-4" />
          Tags
          {!loading && <span className="tabular-nums opacity-90">({tags.length})</span>}
        </SecondaryButton>
      </div>

      {loading ? (
        <LoadingSkeleton variant="card" lines={2} className="max-w-sm" />
      ) : tab === "exposures" ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                Exposures
                <Badge variant="secondary" className="font-normal tabular-nums">
                  {exposures.length} {exposures.length === 1 ? "item" : "items"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Macro and thematic factors (e.g. rates, commodities) that securities can be linked to.
              </CardDescription>
            </div>
            <PrimaryButton type="button" size="sm" className="gap-1" onClick={openCreateExposure}>
              <Plus className="size-4" />
              Add exposure
            </PrimaryButton>
          </CardHeader>
          <CardContent>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exposures.map((row) => (
                  <TableRow key={row.exposure_id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.slug}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>
                      <Badge variant={row.is_active ? "default" : "secondary"}>
                        {row.is_active ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <GhostButton
                        type="button"
                        size="icon"
                        className="size-8"
                        aria-label={`Edit ${row.name}`}
                        onClick={() => openEditExposure(row)}
                      >
                        <Pencil className="size-4" />
                      </GhostButton>
                      <DangerButton
                        type="button"
                        size="icon"
                        className="size-8"
                        aria-label={`Delete ${row.name}`}
                        onClick={() => setPendingDelete({ kind: "exposure", row })}
                      >
                        <Trash2 className="size-4" />
                      </DangerButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
            {exposures.length === 0 && (
              <EmptyState compact description="No exposures yet." />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                Tags
                <Badge variant="secondary" className="font-normal tabular-nums">
                  {tags.length} {tags.length === 1 ? "item" : "items"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Thematic labels assigned to securities. New tags without an organization ID use the{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">default-organization</code>{" "}
                org.
              </CardDescription>
            </div>
            <PrimaryButton type="button" size="sm" className="gap-1" onClick={openCreateTag}>
              <Plus className="size-4" />
              Add tag
            </PrimaryButton>
          </CardHeader>
          <CardContent>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>LLM</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((row) => (
                  <TableRow key={row.tag_id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.slug}</TableCell>
                    <TableCell>{row.group}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                      {row.organization_name ?? row.organization_slug ?? row.organization_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.is_llm_assignable ? "outline" : "secondary"}>
                        {row.is_llm_assignable ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.is_active ? "default" : "secondary"}>
                        {row.is_active ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <GhostButton
                        type="button"
                        size="icon"
                        className="size-8"
                        aria-label={`Edit ${row.name}`}
                        onClick={() => openEditTag(row)}
                      >
                        <Pencil className="size-4" />
                      </GhostButton>
                      <DangerButton
                        type="button"
                        size="icon"
                        className="size-8"
                        aria-label={`Delete ${row.name}`}
                        onClick={() => setPendingDelete({ kind: "tag", row })}
                      >
                        <Trash2 className="size-4" />
                      </DangerButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
            {tags.length === 0 && (
              <EmptyState compact description="No tags yet." />
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={exposureDialogOpen} onOpenChange={setExposureDialogOpen}>
        <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingExposure ? "Edit exposure" : "New exposure"}</DialogTitle>
            <DialogDescription>
              Slug must be lowercase letters, numbers, and hyphens. Used by enrichment prompts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <FormLabel htmlFor="ex-name">Name</FormLabel>
              <FormInput
                id="ex-name"
                value={exName}
                onChange={(e) => setExName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <FormLabel htmlFor="ex-slug">Slug</FormLabel>
              <FormInput
                id="ex-slug"
                value={exSlug}
                onChange={(e) => setExSlug(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <FormLabel htmlFor="ex-cat">Category</FormLabel>
              <FormInput
                id="ex-cat"
                value={exCategory}
                onChange={(e) => setExCategory(e.target.value)}
                placeholder="e.g. macro, demand_driver"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <FormLabel htmlFor="ex-desc">Description</FormLabel>
              <textarea
                id="ex-desc"
                className={cn(textareaClass)}
                value={exDescription}
                onChange={(e) => setExDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={exActive}
                  onChange={(e) => setExActive(e.target.checked)}
                />
                Active
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <FormLabel htmlFor="ex-sort">Sort order</FormLabel>
                <FormInput
                  id="ex-sort"
                  value={exSort}
                  onChange={(e) => setExSort(e.target.value)}
                  placeholder="Optional integer"
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <FormLabel htmlFor="ex-pol">Polarity</FormLabel>
                <select
                  id="ex-pol"
                  className={cn(
                    "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                  )}
                  value={exPolarity}
                  onChange={(e) => setExPolarity(e.target.value)}
                >
                  <option value="">(none)</option>
                  <option value="-1">-1</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <SecondaryButton type="button" onClick={() => setExposureDialogOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="button" onClick={() => void submitExposure()} disabled={saving}>
              {saving ? <Spinner className="size-4" /> : "Save"}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit tag" : "New tag"}</DialogTitle>
            <DialogDescription>
              Group is a bucket for UI and reporting. Slug must match enrichment prompt rules.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <FormLabel htmlFor="tg-name">Name</FormLabel>
              <FormInput
                id="tg-name"
                value={tgName}
                onChange={(e) => setTgName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <FormLabel htmlFor="tg-slug">Slug</FormLabel>
              <FormInput
                id="tg-slug"
                value={tgSlug}
                onChange={(e) => setTgSlug(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <FormLabel htmlFor="tg-group">Group</FormLabel>
              <FormInput
                id="tg-group"
                value={tgGroup}
                onChange={(e) => setTgGroup(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <FormLabel htmlFor="tg-desc">Description</FormLabel>
              <textarea
                id="tg-desc"
                className={cn(textareaClass)}
                value={tgDescription}
                onChange={(e) => setTgDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={tgActive}
                  onChange={(e) => setTgActive(e.target.checked)}
                />
                Active
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={tgLlm}
                  onChange={(e) => setTgLlm(e.target.checked)}
                />
                LLM assignable
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <FormLabel htmlFor="tg-sort">Sort order</FormLabel>
                <FormInput
                  id="tg-sort"
                  value={tgSort}
                  onChange={(e) => setTgSort(e.target.value)}
                  placeholder="Optional"
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <FormLabel htmlFor="tg-w">Weight hint</FormLabel>
                <FormInput
                  id="tg-w"
                  value={tgWeight}
                  onChange={(e) => setTgWeight(e.target.value)}
                  placeholder="Optional decimal"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <FormLabel htmlFor="tg-org">Organization ID</FormLabel>
              <FormInput
                id="tg-org"
                value={tgOrgId}
                onChange={(e) => setTgOrgId(e.target.value)}
                placeholder={editingTag ? "UUID" : "Leave empty for default org"}
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <SecondaryButton type="button" onClick={() => setTagDialogOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="button" onClick={() => void submitTag()} disabled={saving}>
              {saving ? <Spinner className="size-4" /> : "Save"}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete != null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this {pendingDelete?.kind === "tag" ? "tag" : "exposure"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === "exposure" && (
                <>
                  <span className="font-medium text-foreground">{pendingDelete.row.name}</span> (
                  {pendingDelete.row.slug}) will be removed. Links from securities to this exposure
                  are deleted as well.
                </>
              )}
              {pendingDelete?.kind === "tag" && (
                <>
                  <span className="font-medium text-foreground">{pendingDelete.row.name}</span> (
                  {pendingDelete.row.slug}) will be removed. Links from securities to this tag are
                  deleted as well.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-4">
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-700 text-white hover:bg-red-800"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={saving}
            >
              {saving ? <Spinner className="size-4" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
