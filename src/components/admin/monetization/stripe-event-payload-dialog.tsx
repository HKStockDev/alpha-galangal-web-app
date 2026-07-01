"use client";

import type { StripeEventLogDetail } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StripeEventStatusBadge } from "@/components/admin/monetization/stripe-event-status-badge";
import { formatAdminDateTime } from "@/components/admin/monetization/format-datetime";
import { SecondaryButton } from "@/components/ui-kit/buttons";

export function StripeEventPayloadDialog({
  open,
  onOpenChange,
  detail,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: StripeEventLogDetail | null;
  loading: boolean;
}) {
  const json =
    detail != null ? JSON.stringify(detail.payload, null, 2) : "";

  const copyPayload = async () => {
    if (!json) return;
    try {
      await navigator.clipboard.writeText(json);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">{detail?.stripe_event_id ?? "Event"}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {detail && <StripeEventStatusBadge status={detail.status} />}
              {detail && (
                <span className="text-xs text-muted-foreground">{detail.event_type}</span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading payload…</p>
        ) : detail ? (
          <>
            <dl className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <div>
                <dt className="font-medium uppercase tracking-wide">Received</dt>
                <dd>{formatAdminDateTime(detail.received_at)}</dd>
              </div>
              <div>
                <dt className="font-medium uppercase tracking-wide">Processed</dt>
                <dd>{formatAdminDateTime(detail.processed_at)}</dd>
              </div>
            </dl>
            {detail.error_message && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {detail.error_message}
              </p>
            )}
            <pre className="min-h-[200px] flex-1 overflow-auto rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs">
              {json}
            </pre>
            <div className="flex justify-end">
              <SecondaryButton type="button" onClick={() => void copyPayload()}>
                Copy JSON
              </SecondaryButton>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
