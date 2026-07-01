"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  fetchAdminOrgSubscriptionDetail,
  searchAdminOrgSubscriptions,
  type OrgSubscriptionDetailResponse,
  type OrgSubscriptionListItem,
} from "@/lib/api";
import { OrgSubscriptionDetailPanel } from "@/components/admin/monetization/org-subscription-detail-panel";
import { formatAdminDateTime } from "@/components/admin/monetization/format-datetime";
import { SubscriptionStatusBadge } from "@/components/admin/monetization/subscription-status-badge";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { SecondaryButton } from "@/components/ui-kit/buttons";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export default function AdminMonetizationOrganizationsPage() {
  const { accessToken } = useAuth();
  const { showError } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<OrgSubscriptionListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrgSubscriptionDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = useCallback(async () => {
    if (!accessToken) return;
    setListLoading(true);
    try {
      const data = await searchAdminOrgSubscriptions(accessToken, query || undefined);
      setRows(data);
      setSelectedOrgId((prev) => {
        if (prev && data.some((r) => r.organization_id === prev)) return prev;
        return data[0]?.organization_id ?? null;
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load subscriptions");
    } finally {
      setListLoading(false);
    }
  }, [accessToken, query, showError]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadDetail = useCallback(
    async (orgId: string) => {
      if (!accessToken) return;
      setDetailLoading(true);
      try {
        const data = await fetchAdminOrgSubscriptionDetail(accessToken, orgId);
        setDetail(data);
      } catch (err) {
        showError(err instanceof Error ? err.message : "Failed to load subscription detail");
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [accessToken, showError]
  );

  useEffect(() => {
    if (selectedOrgId) {
      void loadDetail(selectedOrgId);
    } else {
      setDetail(null);
    }
  }, [selectedOrgId, loadDetail]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput.trim());
    setSelectedOrgId(null);
    setDetail(null);
  };

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Organization subscriptions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Search by organization name, Stripe customer id, or subscription id. Read-only ops view of
          webhook-synced state.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <FormLabel htmlFor="org-sub-search">Search</FormLabel>
          <div className="relative mt-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <FormInput
              id="org-sub-search"
              className="pl-9"
              placeholder="Org name, cus_…, or sub_…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <SecondaryButton type="submit">Search</SecondaryButton>
      </form>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section>
          {listLoading ? (
            <LoadingSkeleton className="h-64 w-full rounded-2xl" />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No subscriptions found"
              description={
                query
                  ? "Try a different search term."
                  : "No subscription rows in the database yet."
              }
            />
          ) : (
            <DataTable stickyHeader>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Seats</TableHead>
                  <TableHead>Period end</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const selected = selectedOrgId === row.organization_id;
                  return (
                    <TableRow
                      key={row.subscription_row_id}
                      className={cn(
                        "cursor-pointer",
                        selected && "bg-primary/10 hover:bg-primary/15"
                      )}
                      onClick={() => setSelectedOrgId(row.organization_id)}
                    >
                      <TableCell>
                        <div className="font-medium">{row.organization_name}</div>
                        <p className="font-mono text-xs text-muted-foreground">
                          {row.stripe_subscription_id}
                        </p>
                      </TableCell>
                      <TableCell>{row.plan_display_name ?? row.plan_key}</TableCell>
                      <TableCell>
                        <SubscriptionStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.seat_quantity}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatAdminDateTime(row.current_period_end)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </DataTable>
          )}
        </section>

        <section>
          <OrgSubscriptionDetailPanel
            detail={selectedOrgId ? detail : null}
            loading={Boolean(selectedOrgId) && detailLoading}
          />
        </section>
      </div>
    </div>
  );
}

