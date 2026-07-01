"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  fetchAdminStripeEventDetail,
  listAdminStripeEvents,
  retryAdminStripeEvent,
  type StripeEventLogDetail,
  type StripeEventLogListItem,
  type StripeEventLogStatus,
} from "@/lib/api";
import { StripeEventPayloadDialog } from "@/components/admin/monetization/stripe-event-payload-dialog";
import { StripeEventStatusBadge } from "@/components/admin/monetization/stripe-event-status-badge";
import { formatAdminDateTime } from "@/components/admin/monetization/format-datetime";
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
import { EmptyState } from "@/components/ui-kit/empty-state";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { GhostButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { cn } from "@/lib/utils";
import { Eye, RefreshCw } from "lucide-react";

type StatusFilter = "all" | StripeEventLogStatus;

export default function AdminMonetizationStripeEventsPage() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const [rows, setRows] = useState<StripeEventLogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");

  const [payloadOpen, setPayloadOpen] = useState(false);
  const [payloadDetail, setPayloadDetail] = useState<StripeEventLogDetail | null>(null);
  const [payloadLoading, setPayloadLoading] = useState(false);

  const [retryTarget, setRetryTarget] = useState<StripeEventLogListItem | null>(null);
  const [retrying, setRetrying] = useState(false);

  const loadRows = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await listAdminStripeEvents(accessToken, {
        status: statusFilter === "all" ? undefined : statusFilter,
        event_type: eventTypeFilter.trim() || undefined,
        q: query || undefined,
      });
      setRows(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load Stripe events");
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter, eventTypeFilter, query, showError]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const openPayload = async (row: StripeEventLogListItem) => {
    if (!accessToken) return;
    setPayloadOpen(true);
    setPayloadLoading(true);
    setPayloadDetail(null);
    try {
      const detail = await fetchAdminStripeEventDetail(accessToken, row.id);
      setPayloadDetail(detail);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load event payload");
      setPayloadOpen(false);
    } finally {
      setPayloadLoading(false);
    }
  };

  const runRetry = async () => {
    if (!accessToken || !retryTarget) return;
    setRetrying(true);
    try {
      await retryAdminStripeEvent(accessToken, retryTarget.id);
      showSuccess("Event reprocessed successfully");
      setRetryTarget(null);
      await loadRows();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetrying(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput.trim());
  };

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Stripe event log</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Troubleshoot webhook delivery and reprocess failed events.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FormLabel htmlFor="stripe-event-search">Search</FormLabel>
            <FormInput
              id="stripe-event-search"
              className="mt-1"
              placeholder="Event id or type…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <SecondaryButton type="submit">Search</SecondaryButton>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all" as const, label: "All" },
              { id: "pending" as const, label: "Pending" },
              { id: "processed" as const, label: "Processed" },
              { id: "failed" as const, label: "Failed" },
            ] as const
          ).map((item) => (
            <SecondaryButton
              key={item.id}
              type="button"
              size="sm"
              className={cn(statusFilter === item.id && "border-primary bg-primary/10 text-primary")}
              onClick={() => setStatusFilter(item.id)}
            >
              {item.label}
            </SecondaryButton>
          ))}
        </div>
        <div>
          <FormLabel htmlFor="stripe-event-type">Event type</FormLabel>
          <FormInput
            id="stripe-event-type"
            className="mt-1 max-w-md"
            placeholder="e.g. customer.subscription.updated"
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
          />
        </div>
      </form>

      {loading ? (
        <LoadingSkeleton className="h-64 w-full rounded-2xl" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Adjust filters or wait for Stripe webhooks to arrive."
        />
      ) : (
        <DataTable
          stickyHeader
          tableClassName="table-fixed w-full min-w-[56rem]"
        >
          <TableHeader>
            <TableRow>
              <TableHead className="w-[11rem]">Event id</TableHead>
              <TableHead className="w-[12rem]">Type</TableHead>
              <TableHead className="w-[6.5rem]">Status</TableHead>
              <TableHead className="w-[9.5rem]">Received</TableHead>
              <TableHead className="w-[9.5rem]">Processed</TableHead>
              <TableHead>Error</TableHead>
              <TableHead className="w-[5.5rem] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-0 overflow-hidden">
                  <span className="block truncate font-mono text-xs" title={row.stripe_event_id}>
                    {row.stripe_event_id}
                  </span>
                </TableCell>
                <TableCell className="max-w-0 overflow-hidden">
                  <span className="block truncate text-xs" title={row.event_type}>
                    {row.event_type}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <StripeEventStatusBadge status={row.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatAdminDateTime(row.received_at)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatAdminDateTime(row.processed_at)}
                </TableCell>
                <TableCell className="max-w-0 overflow-hidden">
                  <span
                    className="block truncate text-xs text-muted-foreground"
                    title={row.error_message ?? undefined}
                  >
                    {row.error_message ?? "—"}
                  </span>
                </TableCell>
                <TableCell className="w-[5.5rem] whitespace-nowrap text-right">
                  <div className="flex justify-end gap-1">
                    <GhostButton
                      type="button"
                      size="icon-sm"
                      aria-label="View payload"
                      onClick={() => void openPayload(row)}
                    >
                      <Eye className="size-4" aria-hidden />
                    </GhostButton>
                    {(row.status === "failed" || row.status === "pending") && (
                      <GhostButton
                        type="button"
                        size="icon-sm"
                        aria-label="Retry processing"
                        onClick={() => setRetryTarget(row)}
                      >
                        <RefreshCw className="size-4" aria-hidden />
                      </GhostButton>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      <StripeEventPayloadDialog
        open={payloadOpen}
        onOpenChange={setPayloadOpen}
        detail={payloadDetail}
        loading={payloadLoading}
      />

      <AlertDialog open={retryTarget != null} onOpenChange={(o) => !o && setRetryTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retry event processing?</AlertDialogTitle>
            <AlertDialogDescription>
              Re-run webhook handlers for{" "}
              <span className="font-mono text-xs">{retryTarget?.stripe_event_id}</span>. This may
              update organization subscriptions in the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={retrying}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={retrying} onClick={() => void runRetry()}>
              {retrying ? "Retrying…" : "Retry"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
