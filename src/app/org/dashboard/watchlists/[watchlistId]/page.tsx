"use client";

import { use as usePromise, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  addOrganizationWatchlistSecurity,
  convertOrganizationWatchlistScope,
  deleteOrganizationWatchlist,
  duplicateOrganizationWatchlist,
  exportOrganizationWatchlistCsv,
  fetchMyOrganizations,
  listOrganizationClients,
  listOrganizationEquities,
  listOrganizationWatchlistSecurities,
  listOrganizationWatchlists,
  updateOrganizationWatchlist,
  type OrganizationClient,
  type OrganizationWatchlist,
  type OrganizationWatchlistSecurityRow,
  type OrgEquityRow,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { ActionConfirmDialog } from "@/components/ui-kit/action-confirm-dialog";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { Spinner } from "@/components/ui/spinner";
import { useActionConfirm } from "@/hooks/use-action-confirm";

export default function WatchlistDetailsPage({
  params,
}: {
  params: Promise<{ watchlistId: string }>;
}) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const { request, isConfirming, requestConfirm, dismissConfirm, handleConfirm } = useActionConfirm();

  const { watchlistId } = usePromise(params);

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [clients, setClients] = useState<OrganizationClient[]>([]);
  const [watchlists, setWatchlists] = useState<OrganizationWatchlist[]>([]);

  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isWatchlistsLoading, setIsWatchlistsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  const [renameName, setRenameName] = useState("");
  const [renameDescription, setRenameDescription] = useState("");
  const [convertScopeClientId, setConvertScopeClientId] = useState<string>("");
  const [duplicateName, setDuplicateName] = useState("");

  const [watchlistSecurities, setWatchlistSecurities] = useState<
    OrganizationWatchlistSecurityRow[]
  >([]);
  const [isSecuritiesLoading, setIsSecuritiesLoading] = useState(false);

  const [equitySearch, setEquitySearch] = useState("");
  const [equityOptions, setEquityOptions] = useState<OrgEquityRow[]>([]);
  const [isEquitySearchLoading, setIsEquitySearchLoading] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());

  const selectedWatchlist = useMemo(
    () => watchlists.find((w) => w.id === watchlistId) ?? null,
    [watchlists, watchlistId]
  );

  const watchlistSecurityIds = useMemo(
    () => new Set(watchlistSecurities.map((item) => item.security_id)),
    [watchlistSecurities]
  );

  const addableEquityOptions = useMemo(
    () => equityOptions.filter((row) => !watchlistSecurityIds.has(row.id)),
    [equityOptions, watchlistSecurityIds]
  );

  useEffect(() => {
    if (!selectedWatchlist) return;
    setRenameName(selectedWatchlist.name);
    setRenameDescription(selectedWatchlist.description ?? "");
    setConvertScopeClientId(selectedWatchlist.organization_client_id ?? "");
    setDuplicateName(`${selectedWatchlist.name} (copy)`);
  }, [selectedWatchlist]);

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

  const loadWatchlists = useCallback(async () => {
    if (!accessToken || !organizationId) return;
    setIsWatchlistsLoading(true);
    try {
      const rows = await listOrganizationWatchlists(accessToken, organizationId);
      setWatchlists(rows);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load watchlists");
    } finally {
      setIsWatchlistsLoading(false);
    }
  }, [accessToken, organizationId, showError]);

  useEffect(() => {
    void loadWatchlists();
  }, [loadWatchlists]);

  const loadSelectedSecurities = useCallback(async () => {
    if (!accessToken || !organizationId) return;
    setIsSecuritiesLoading(true);
    try {
      const rows = await listOrganizationWatchlistSecurities(
        accessToken,
        organizationId,
        watchlistId
      );
      setWatchlistSecurities(rows);
      // If some previously-selected items are already in the watchlist, drop them.
      const watchlistIds = new Set(rows.map((r) => r.security_id));
      setSelectedToAdd((prev) => {
        const next = new Set<string>();
        for (const id of prev) {
          if (!watchlistIds.has(id)) next.add(id);
        }
        return next;
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load watchlist securities");
    } finally {
      setIsSecuritiesLoading(false);
    }
  }, [accessToken, organizationId, showError, watchlistId]);

  useEffect(() => {
    void loadSelectedSecurities();
  }, [loadSelectedSecurities]);

  useEffect(() => {
    if (!accessToken || !organizationId) return;
    const token = accessToken;
    const orgId = organizationId;
    const trimmed = equitySearch.trim();
    let cancelled = false;

    async function loadEquities(): Promise<void> {
      setIsEquitySearchLoading(true);
      try {
        // When the search box is empty, load the full "addable stocks" list.
        if (!trimmed) {
          const PAGE_LIMIT = 100;
          const MAX_TOTAL = 5000; // safety cap; adjust if you expect more.
          const items: OrgEquityRow[] = [];

          let offset = 0;
          while (true) {
            const res = await listOrganizationEquities(token, orgId, {
              limit: PAGE_LIMIT,
              offset,
            });
            if (cancelled) return;
            items.push(...res.items);

            offset += res.items.length;
            if (!res.has_more) break;
            if (items.length >= MAX_TOTAL) break;
          }

          const ids = new Set(items.map((r) => r.id));
          setEquityOptions(items);
          setSelectedToAdd((prev) => {
            const next = new Set<string>();
            for (const id of prev) {
              if (ids.has(id)) next.add(id);
            }
            return next;
          });
          return;
        }

        // Search mode: load a small result set and keep selection scoped to those results.
        const res = await listOrganizationEquities(token, orgId, {
          q: trimmed,
          limit: 20,
          offset: 0,
        });
        if (cancelled) return;

        const ids = new Set(res.items.map((r) => r.id));
        setEquityOptions(res.items);
        setSelectedToAdd((prev) => {
          const next = new Set<string>();
          for (const id of prev) {
            if (ids.has(id)) next.add(id);
          }
          return next;
        });
      } catch (err) {
        showError(err instanceof Error ? err.message : "Failed to load equities");
      } finally {
        if (!cancelled) setIsEquitySearchLoading(false);
      }
    }

    void loadEquities();
    return () => {
      cancelled = true;
    };
  }, [accessToken, equitySearch, organizationId, showError]);

  function toggleSelectedToAdd(securityId: string) {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(securityId)) next.delete(securityId);
      else next.add(securityId);
      return next;
    });
  }

  async function runAction(
    action: () => Promise<void>,
    successMessage: string,
    reloadSecurities = false
  ) {
    setIsMutating(true);
    try {
      await action();
      showSuccess(successMessage);
      await loadWatchlists();
      if (reloadSecurities) await loadSelectedSecurities();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsMutating(false);
    }
  }

  function onSaveWatchlist() {
    if (!accessToken || !organizationId || !selectedWatchlist) return;
    const name = renameName.trim();
    if (!name) return showError("Watchlist name is required");
    const scopeChanged =
      (selectedWatchlist.organization_client_id ?? "") !== convertScopeClientId;
    const clientName = convertScopeClientId
      ? clients.find((c) => c.id === convertScopeClientId)?.name ?? "selected client"
      : "Global (no client)";
    requestConfirm({
      title: "Save watchlist changes?",
      description: (
        <>
          Save changes to <span className="font-medium text-foreground">{name}</span>
          {scopeChanged ? (
            <>
              {" "}
              and update scope to{" "}
              <span className="font-medium text-foreground">{clientName}</span>?
            </>
          ) : (
            "?"
          )}
        </>
      ),
      confirmLabel: "Save",
      onConfirm: async () => {
        setIsMutating(true);
        try {
          await updateOrganizationWatchlist(accessToken, organizationId, selectedWatchlist.id, {
            name,
            description: renameDescription.trim() || null,
          });
          if (scopeChanged) {
            await convertOrganizationWatchlistScope(accessToken, organizationId, selectedWatchlist.id, {
              organization_client_id: convertScopeClientId || null,
            });
          }
          showSuccess("Watchlist saved");
          await loadWatchlists();
        } catch (err) {
          showError(err instanceof Error ? err.message : "Failed to save watchlist");
        } finally {
          setIsMutating(false);
        }
      },
    });
  }

  function onDuplicateWatchlist() {
    if (!accessToken || !organizationId || !selectedWatchlist) return;
    const name = duplicateName.trim() || `${selectedWatchlist.name} (copy)`;
    requestConfirm({
      title: "Duplicate watchlist?",
      description: (
        <>
          Create a copy named <span className="font-medium text-foreground">{name}</span> including
          all securities?
        </>
      ),
      confirmLabel: "Duplicate",
      onConfirm: async () => {
        await runAction(
          () =>
            duplicateOrganizationWatchlist(accessToken, organizationId, selectedWatchlist.id, {
              name: duplicateName.trim() || undefined,
              include_securities: true,
            }).then(() => undefined),
          "Watchlist duplicated"
        );
      },
    });
  }

  function onExportWatchlist() {
    if (!accessToken || !organizationId || !selectedWatchlist) return;
    requestConfirm({
      title: "Export watchlist?",
      description: (
        <>
          Download <span className="font-medium text-foreground">{selectedWatchlist.name}</span> as a
          CSV file?
        </>
      ),
      confirmLabel: "Export",
      onConfirm: async () => {
        try {
          const { blob, filename } = await exportOrganizationWatchlistCsv(
            accessToken,
            organizationId,
            selectedWatchlist.id
          );
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          showSuccess("CSV exported");
        } catch (err) {
          showError(err instanceof Error ? err.message : "Failed to export watchlist");
        }
      },
    });
  }

  function onDeleteWatchlist() {
    if (!accessToken || !organizationId || !selectedWatchlist) return;
    requestConfirm({
      title: "Delete watchlist?",
      description: (
        <>
          Delete watchlist <span className="font-medium text-foreground">{selectedWatchlist.name}</span>?
          This cannot be undone.
        </>
      ),
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        setIsMutating(true);
        try {
          await deleteOrganizationWatchlist(accessToken, organizationId, selectedWatchlist.id);
          showSuccess("Watchlist deleted");
          router.push("/org/dashboard/watchlists");
        } catch (err) {
          showError(err instanceof Error ? err.message : "Failed to delete watchlist");
        } finally {
          setIsMutating(false);
        }
      },
    });
  }

  function onRefreshWatchlist() {
    requestConfirm({
      title: "Refresh watchlist?",
      description: "Reload watchlist details and securities.",
      confirmLabel: "Refresh",
      onConfirm: async () => {
        await loadWatchlists();
        await loadSelectedSecurities();
      },
    });
  }

  function onAddSelectedSecurities() {
    if (!accessToken || !organizationId || !selectedWatchlist) return;
    const selectedRows = addableEquityOptions.filter((row) => selectedToAdd.has(row.id));
    if (selectedRows.length === 0) return showError("Select at least one security to add");
    const tickers = selectedRows.map((row) => row.ticker).join(", ");
    requestConfirm({
      title: "Add securities?",
      description: (
        <>
          Add {selectedRows.length} securities ({tickers}) to{" "}
          <span className="font-medium text-foreground">{selectedWatchlist.name}</span>?
        </>
      ),
      confirmLabel: "Save",
      onConfirm: async () => {
        setIsMutating(true);
        try {
          for (const row of selectedRows) {
            await addOrganizationWatchlistSecurity(accessToken, organizationId, selectedWatchlist.id, {
              security_id: row.id,
            });
          }
          showSuccess(
            selectedRows.length === 1
              ? "Security added to watchlist"
              : `${selectedRows.length} securities added to watchlist`
          );
          setSelectedToAdd(new Set());
          await loadSelectedSecurities();
        } catch (err) {
          showError(err instanceof Error ? err.message : "Failed to add securities");
        } finally {
          setIsMutating(false);
        }
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

  const scopeLabel = selectedWatchlist?.organization_client_id
    ? `Client: ${
        clients.find((c) => c.id === selectedWatchlist.organization_client_id)?.name ??
        selectedWatchlist.organization_client_id.slice(0, 8)
      }`
    : "Global";

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <SecondaryButton asChild>
                <Link href="/org/dashboard/watchlists">
                  <ArrowLeft className="mr-1 size-4" aria-hidden />
                  Back
                </Link>
              </SecondaryButton>
              <span className="text-xs text-muted-foreground">{scopeLabel}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {selectedWatchlist?.name ?? "Watchlist"}
            </h1>
            {selectedWatchlist?.description ? (
              <p className="text-sm text-muted-foreground">{selectedWatchlist.description}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 self-end sm:self-start">
            <SecondaryButton
              type="button"
              disabled={isWatchlistsLoading || isMutating || isConfirming}
              onClick={onRefreshWatchlist}
            >
              Refresh
            </SecondaryButton>
            <SecondaryButton
              type="button"
              disabled={isMutating || isConfirming}
              onClick={onExportWatchlist}
            >
              Export CSV
            </SecondaryButton>
            <SecondaryButton
              type="button"
              disabled={isMutating || isConfirming}
              onClick={onDuplicateWatchlist}
            >
              Duplicate
            </SecondaryButton>
            <SecondaryButton
              type="button"
              disabled={isMutating || isConfirming}
              onClick={onDeleteWatchlist}
            >
              <Trash2 className="mr-1 size-4" aria-hidden />
              Delete
            </SecondaryButton>
          </div>
        </div>

        {isWatchlistsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : !selectedWatchlist ? (
          <EmptyState
            description="This watchlist was not found (or you no longer have access)."
            action={
              <SecondaryButton asChild>
                <Link href="/org/dashboard/watchlists">Back to watchlists</Link>
              </SecondaryButton>
            }
          />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pencil className="size-4" aria-hidden />
                  Edit watchlist
                </CardTitle>
                <CardDescription>Rename, update description, and convert scope.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-sm">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <FormLabel htmlFor="rename-name">Name</FormLabel>
                    <FormInput
                      id="rename-name"
                      value={renameName}
                      onChange={(e) => setRenameName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <FormLabel htmlFor="rename-desc">Description</FormLabel>
                    <FormInput
                      id="rename-desc"
                      value={renameDescription}
                      onChange={(e) => setRenameDescription(e.target.value)}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="space-y-2">
                    <FormLabel htmlFor="convert-scope">Scope client (attach/detach)</FormLabel>
                    <select
                      id="convert-scope"
                      value={convertScopeClientId}
                      onChange={(e) => setConvertScopeClientId(e.target.value)}
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
                  <div className="space-y-2">
                    <FormLabel htmlFor="duplicate-name">Duplicate name</FormLabel>
                    <FormInput
                      id="duplicate-name"
                      value={duplicateName}
                      onChange={(e) => setDuplicateName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end border-t border-border pt-4">
                  <PrimaryButton
                    type="button"
                    disabled={isMutating || isConfirming}
                    onClick={onSaveWatchlist}
                  >
                    Save
                  </PrimaryButton>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Securities</CardTitle>
                <CardDescription>Add securities to this watchlist.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="font-medium text-foreground">Add securities</p>
                    <p className="text-sm text-muted-foreground">
                      Select stocks to add to this watchlist.
                    </p>
                  </div>
                  <FormLabel htmlFor="security-search">Search stocks</FormLabel>
                  <FormInput
                    id="security-search"
                    value={equitySearch}
                    onChange={(e) => setEquitySearch(e.target.value)}
                    placeholder="Search ticker or company name"
                  />
                  <div className="rounded-md border border-border">
                    {isEquitySearchLoading ? (
                      <div className="flex items-center justify-center p-6">
                        <Spinner />
                      </div>
                    ) : addableEquityOptions.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">
                        No usable stocks found (or they are already in this watchlist).
                      </p>
                    ) : (
                      <div className="max-h-64 space-y-1 overflow-y-auto p-3">
                        {addableEquityOptions.map((row) => (
                          <label
                            key={row.id}
                            className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted/60"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 size-4 shrink-0 rounded border-input"
                              checked={selectedToAdd.has(row.id)}
                              disabled={isMutating || isConfirming}
                              onChange={() => toggleSelectedToAdd(row.id)}
                            />
                            <span className="min-w-0">
                              <span className="font-medium text-foreground">{row.ticker}</span>
                              <span className="text-muted-foreground"> — {row.name}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedToAdd.size > 0 ? "Selected stocks" : "Securities in watchlist"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedToAdd.size > 0
                        ? "The stocks you picked to add (not saved yet)."
                        : "All stocks currently saved in this watchlist."}
                    </p>
                  </div>
                  {isSecuritiesLoading ? (
                    <div className="flex min-h-64 items-center justify-center rounded-md border border-border">
                      <Spinner />
                    </div>
                  ) : selectedToAdd.size === 0 ? (
                    watchlistSecurities.length === 0 ? (
                      <EmptyState compact description="No securities in this watchlist yet." />
                    ) : (
                      <div className="rounded-md border border-border">
                        <div className="max-h-64 space-y-1 overflow-y-auto p-3">
                          {watchlistSecurities.map((item) => {
                            const ticker = item.securities?.ticker ?? "—";
                            const name = item.securities?.name ?? item.security_id;
                            return (
                              <div
                                key={item.id}
                                className="flex items-start gap-3 rounded-md px-2 py-2 text-sm"
                              >
                                <span className="min-w-0">
                                  <span className="font-medium text-foreground">{ticker}</span>
                                  <span className="text-muted-foreground"> — {name}</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                          {watchlistSecurities.length} stock
                          {watchlistSecurities.length === 1 ? "" : "s"} in watchlist.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="rounded-md border border-border">
                      <div className="max-h-64 space-y-1 overflow-y-auto p-3">
                        {addableEquityOptions
                          .filter((row) => selectedToAdd.has(row.id))
                          .map((row) => {
                            const ticker = row.ticker;
                            const name = row.name;
                          return (
                            <label
                              key={row.id}
                              className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted/60"
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5 size-4 shrink-0 rounded border-input"
                                checked={selectedToAdd.has(row.id)}
                                disabled={isMutating || isConfirming}
                                onChange={() => toggleSelectedToAdd(row.id)}
                              />
                              <span className="min-w-0">
                                <span className="font-medium text-foreground">{ticker}</span>
                                <span className="text-muted-foreground"> — {name}</span>
                              </span>
                            </label>
                          );
                          })}
                      </div>
                      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                        {selectedToAdd.size} stock{selectedToAdd.size === 1 ? "" : "s"} selected. Save to add.
                      </p>
                    </div>
                  )}
                </div>
                </div>
                <div className="flex justify-end border-t border-border pt-4">
                  <PrimaryButton
                    type="button"
                    disabled={
                      isMutating ||
                      isConfirming ||
                      selectedToAdd.size === 0
                    }
                    onClick={onAddSelectedSecurities}
                  >
                    Save
                  </PrimaryButton>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        <ActionConfirmDialog
          request={request}
          isConfirming={isConfirming || isMutating}
          onOpenChange={(open) => {
            if (!open) dismissConfirm();
          }}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}

