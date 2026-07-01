"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  listMarketContentCategories,
  createMarketContentCategory,
  updateMarketContentCategory,
  type ContentCategoryRow,
} from "@/lib/api";
import { ADMIN_DASHBOARD } from "@/lib/auth-routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

const KEY_RE = /^[a-z0-9_]+$/;

function emptyForm() {
  return {
    key: "",
    label: "",
    description: "",
    is_active: true,
    sort_order: 0,
  };
}

export default function AdminContentCategoriesPage() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();

  const [rows, setRows] = useState<ContentCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ContentCategoryRow | null>(null);
  const [form, setForm] = useState(() => emptyForm());

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await listMarketContentCategories(accessToken, {
        includeInactive: includeInactive,
      });
      setRows(data);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [accessToken, includeInactive, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(row: ContentCategoryRow) {
    setEditing(row);
    setForm({
      key: row.key,
      label: row.label,
      description: row.description ?? "",
      is_active: row.is_active,
      sort_order: row.sort_order,
    });
    setDialogOpen(true);
  }

  async function onSave() {
    if (!accessToken) return;
    const key = form.key.trim().toLowerCase();
    const label = form.label.trim();
    if (!key || !KEY_RE.test(key)) {
      showError("Key is required: lowercase letters, numbers, and underscores only.");
      return;
    }
    if (!label) {
      showError("Label is required.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateMarketContentCategory(accessToken, editing.id, {
          key,
          label,
          description: form.description.trim() || null,
          is_active: form.is_active,
          sort_order: form.sort_order,
        });
        showSuccess("Category updated.");
      } else {
        await createMarketContentCategory(accessToken, {
          key,
          label,
          description: form.description.trim() || null,
          is_active: form.is_active,
          sort_order: form.sort_order,
        });
        showSuccess("Category created.");
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Content categories
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            These keys are the allowed values for{" "}
            <code className="rounded bg-muted px-1 text-xs">market_content.category</code> when
            saving classified news. Inactive keys are not accepted for new persistence.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Edit labels, order, and active state. For classifier prompts, use{" "}
                <Link
                  className="text-primary underline underline-offset-2"
                  href={`${ADMIN_DASHBOARD}/formulas`}
                >
                  Formulas
                </Link>{" "}
                → Events / news.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                />
                Show inactive
              </label>
              <Button type="button" onClick={() => void load()} variant="outline" size="sm">
                Refresh
              </Button>
              <Button type="button" onClick={openCreate}>
                Add category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Loading…
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories found.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 w-20">Order</th>
                      <th className="px-3 py-2">Key</th>
                      <th className="px-3 py-2">Label</th>
                      <th className="px-3 py-2 max-w-[240px]">Description</th>
                      <th className="px-3 py-2 w-24">Status</th>
                      <th className="px-3 py-2 w-40">Updated</th>
                      <th className="px-3 py-2 w-24 text-right"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b last:border-0",
                          !row.is_active && "bg-muted/30"
                        )}
                      >
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {row.sort_order}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{row.key}</td>
                        <td className="px-3 py-2 font-medium">{row.label}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground line-clamp-2" title={row.description ?? ""}>
                          {row.description || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {row.is_active ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(row.updated_at)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(row)}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
            <DialogDescription>
              Key is stored on{" "}
              <code className="text-xs">market_content.category</code>. Changing a key can orphan
              existing rows until they are migrated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="cc-key">Key</Label>
              <Input
                id="cc-key"
                className="font-mono text-sm"
                placeholder="e.g. regulatory"
                value={form.key}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-label">Label</Label>
              <Input
                id="cc-label"
                placeholder="Display name"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-desc">Description (optional)</Label>
              <textarea
                id="cc-desc"
                className={cn(
                  "border-input bg-background ring-offset-background placeholder:text-muted-foreground",
                  "focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm",
                  "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                )}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="When to use this category…"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cc-order">Sort order</Label>
                <Input
                  id="cc-order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  Active (allowed for new saves)
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onSave()} disabled={saving}>
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="size-4" />
                  Saving…
                </span>
              ) : editing ? (
                "Save"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
