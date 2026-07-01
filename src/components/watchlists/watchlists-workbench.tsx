"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  createOrganizationWatchlist,
  deleteOrganizationWatchlist,
  fetchMyOrganizations,
  listOrganizationClients,
  listOrganizationWatchlists,
  type OrganizationClient,
  type OrganizationWatchlist,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui-kit/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { ActionConfirmDialog } from "@/components/ui-kit/action-confirm-dialog";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useActionConfirm } from "@/hooks/use-action-confirm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ScopeFilter = "all" | "global" | "client";

export function WatchlistsWorkbench() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const { request, isConfirming, requestConfirm, dismissConfirm, handleConfirm } = useActionConfirm();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [clients, setClients] = useState<OrganizationClient[]>([]);
  const [watchlists, setWatchlists] = useState<OrganizationWatchlist[]>([]);

  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isWatchlistsLoading, setIsWatchlistsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [scopeClientFilter, setScopeClientFilter] = useState<string>("");

  const [createWatchlistModalOpen, setCreateWatchlistModalOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newWatchlistDescription, setNewWatchlistDescription] = useState("");
  const [newWatchlistScopeClientId, setNewWatchlistScopeClientId] = useState<string>("");

  const loadWatchlists = useCallback(async () => {
    if (!accessToken || !organizationId) return;
    setIsWatchlistsLoading(true);
    try {
      const params =
        scopeFilter === "all"
          ? undefined
          : scopeFilter === "global"
            ? { global_only: true as const }
            : scopeClientFilter
              ? { organization_client_id: scopeClientFilter }
              : undefined;
      const rows = await listOrganizationWatchlists(accessToken, organizationId, params);
      setWatchlists(rows);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load watchlists");
    } finally {
      setIsWatchlistsLoading(false);
    }
  }, [accessToken, organizationId, scopeClientFilter, scopeFilter, showError]);

  useEffect(() => {
    if (!accessToken) return;
    setIsBootLoading(true);
    fetchMyOrganizations(accessToken)
      .then(async (orgs) => {
        if (orgs.length === 0) {
          throw new Error("No organization found for this account");
        }
        const orgId = orgs[0].id;
        setOrganizationId(orgId);
        const clientRows = await listOrganizationClients(accessToken, orgId);
        setClients(clientRows);
      })
      .catch((err) => showError(err instanceof Error ? err.message : "Failed to bootstrap page"))
      .finally(() => setIsBootLoading(false));
  }, [accessToken, showError]);

  useEffect(() => {
    void loadWatchlists();
  }, [loadWatchlists]);

  function resetCreateWatchlistForm() {
    setNewWatchlistName("");
    setNewWatchlistDescription("");
    setNewWatchlistScopeClientId("");
  }

  function openCreateWatchlistModal() {
    resetCreateWatchlistForm();
    setCreateWatchlistModalOpen(true);
  }

  function onCreateWatchlist(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !organizationId) return;
    const name = newWatchlistName.trim();
    if (!name) {
      showError("Watchlist name is required");
      return;
    }
    const description = newWatchlistDescription.trim() || undefined;
    const organization_client_id = newWatchlistScopeClientId || null;
    requestConfirm({
      title: "Create watchlist?",
      description: (
        <>
          Create watchlist <span className="font-medium text-foreground">{name}</span>?
        </>
      ),
      confirmLabel: "Create",
      onConfirm: async () => {
        setIsSaving(true);
        try {
          await createOrganizationWatchlist(accessToken, organizationId, {
            name,
            description,
            organization_client_id,
          });
          showSuccess("Watchlist created");
          setCreateWatchlistModalOpen(false);
          resetCreateWatchlistForm();
          await loadWatchlists();
        } catch (err) {
          showError(err instanceof Error ? err.message : "Failed to create watchlist");
        } finally {
          setIsSaving(false);
        }
      },
    });
  }

  function onDeleteWatchlistFromList(watchlist: OrganizationWatchlist) {
    if (!accessToken || !organizationId) return;
    requestConfirm({
      title: "Delete watchlist?",
      description: (
        <>
          Delete watchlist <span className="font-medium text-foreground">{watchlist.name}</span>?
          This cannot be undone.
        </>
      ),
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteOrganizationWatchlist(accessToken, organizationId, watchlist.id);
          showSuccess("Watchlist deleted");
          await loadWatchlists();
        } catch (err) {
          showError(err instanceof Error ? err.message : "Failed to delete watchlist");
        }
      },
    });
  }

  function onRefreshWatchlists() {
    requestConfirm({
      title: "Refresh watchlists?",
      description: "Reload the watchlist list with the current filters.",
      confirmLabel: "Refresh",
      onConfirm: async () => {
        await loadWatchlists();
      },
    });
  }

  if (isBootLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Watchlists
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage watchlists end-to-end and save screener output.
            </p>
          </div>
          <PrimaryButton type="button" className="shrink-0 self-end sm:self-start" onClick={openCreateWatchlistModal}>
            <Plus className="mr-1 size-4" aria-hidden />
            Add watchlist
          </PrimaryButton>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>integration</CardTitle>
            <CardDescription>Create watchlists from multi-formula screener results.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/org/dashboard/multi-formula-screener"
              className="text-sm font-medium text-primary underline underline-offset-4"
            >
              Open multi formula screener and use "Convert to watchlist"
            </Link>
          </CardContent>
        </Card>

        <Dialog
          open={createWatchlistModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setCreateWatchlistModalOpen(false);
              resetCreateWatchlistForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New watchlist</DialogTitle>
              <DialogDescription>
                Create a global or client-scoped watchlist for your organization.
              </DialogDescription>
            </DialogHeader>
            <form id="create-watchlist-form" className="space-y-4" onSubmit={onCreateWatchlist}>
              <div className="space-y-2">
                <FormLabel htmlFor="wl-name">Name</FormLabel>
                <FormInput
                  id="wl-name"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  placeholder="My watchlist"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="wl-desc">Description</FormLabel>
                <FormInput
                  id="wl-desc"
                  value={newWatchlistDescription}
                  onChange={(e) => setNewWatchlistDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="wl-client">Scope client</FormLabel>
                <select
                  id="wl-client"
                  value={newWatchlistScopeClientId}
                  onChange={(e) => setNewWatchlistScopeClientId(e.target.value)}
                  className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="">Global (no client)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </form>
            <DialogFooter>
              <SecondaryButton
                type="button"
                onClick={() => {
                  setCreateWatchlistModalOpen(false);
                  resetCreateWatchlistForm();
                }}
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton
                type="submit"
                form="create-watchlist-form"
                disabled={isSaving || isConfirming}
              >
                {isSaving ? "Creating…" : "Create watchlist"}
              </PrimaryButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Watchlist list</CardTitle>
            <CardDescription>Filter and view watchlists by scope.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <FormLabel htmlFor="scope-filter">Scope filter</FormLabel>
                <select
                  id="scope-filter"
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value as ScopeFilter)}
                  className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="all">All</option>
                  <option value="global">Global only</option>
                  <option value="client">Client only</option>
                </select>
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="scope-client-filter">Client filter</FormLabel>
                <select
                  id="scope-client-filter"
                  value={scopeClientFilter}
                  onChange={(e) => setScopeClientFilter(e.target.value)}
                  disabled={scopeFilter !== "client"}
                  className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
                >
                  <option value="">Choose client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <SecondaryButton type="button" onClick={onRefreshWatchlists}>
                  Refresh
                </SecondaryButton>
              </div>
            </div>

            {isWatchlistsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : watchlists.length === 0 ? (
              <EmptyState compact description="No watchlists found for this filter." />
            ) : (
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {watchlists.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>
                        <span className="font-medium text-foreground">{w.name}</span>
                      </TableCell>
                      <TableCell>
                        {w.organization_client_id
                          ? `Client: ${clients.find((c) => c.id === w.organization_client_id)?.name ?? w.organization_client_id.slice(0, 8)}`
                          : "Global"}
                      </TableCell>
                      <TableCell className="max-w-[360px] truncate text-muted-foreground">
                        {w.description || "—"}
                      </TableCell>
                      <TableCell>{new Date(w.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="ghost" size="icon-xs" aria-label="Show watchlist">
                            <Link href={`/org/dashboard/watchlists/${w.id}`}>
                              <Eye aria-hidden />
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Delete watchlist"
                            onClick={() => onDeleteWatchlistFromList(w)}
                          >
                            <Trash2 aria-hidden className="text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            )}
          </CardContent>
        </Card>
        <ActionConfirmDialog
          request={request}
          isConfirming={isConfirming || isSaving}
          onOpenChange={(open) => {
            if (!open) dismissConfirm();
          }}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}
