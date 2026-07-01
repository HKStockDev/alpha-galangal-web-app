"use client";

import type { EntitlementPreviewReason, EntitlementPreviewResult } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

const REASON_LABELS: Record<EntitlementPreviewReason, string> = {
  allowed: "Capability is enabled for this plan.",
  allowed_with_quota: "Capability is enabled with a configured usage quota.",
  not_enabled: "Capability is disabled or not configured for this plan.",
  hard_block: "Capability is hard-blocked for this plan.",
};

export function EntitlementPreviewPanel({
  result,
  loading,
}: {
  result: EntitlementPreviewResult | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview result</CardTitle>
          <CardDescription>Evaluating entitlement…</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview result</CardTitle>
          <CardDescription>
            Choose a plan and capability, then run preview to see the user-facing outcome.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const ent = result.entitlement;
  const quota =
    ent?.quota_period != null && ent.quota_limit != null
      ? `${ent.quota_limit} uses per ${ent.quota_period}`
      : null;

  return (
    <Card
      className={cn(
        "border-2",
        result.allowed ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"
      )}
    >
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">User experience preview</CardTitle>
            <CardDescription>
              {result.plan.display_name ?? result.plan.plan_key} · {result.capability.display_name}
            </CardDescription>
          </div>
          <Badge
            variant={result.allowed ? "default" : "destructive"}
            className={cn(
              "gap-1 px-3 py-1 text-sm",
              result.allowed && "bg-emerald-600 hover:bg-emerald-600"
            )}
          >
            {result.allowed ? (
              <CheckCircle2 className="size-4" aria-hidden />
            ) : (
              <XCircle className="size-4" aria-hidden />
            )}
            {result.allowed ? "Allowed" : "Blocked"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reason
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            <span className="font-mono text-xs text-muted-foreground">{result.reason}</span>
            {" — "}
            {REASON_LABELS[result.reason]}
          </p>
          {quota && (
            <p className="mt-1 text-sm text-muted-foreground">
              Quota: {quota} (usage not simulated in this preview)
            </p>
          )}
        </div>

        {!result.allowed && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Upsell message (shown to user)
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {result.upsell_message ?? "No upsell message configured."}
            </p>
          </div>
        )}

        {result.allowed && result.entitlement?.upsell_message && (
          <p className="text-xs text-muted-foreground">
            Note: an upsell message is configured but only applies when the capability is blocked.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Capability key:{" "}
          <span className="font-mono">{result.capability.capability_key}</span>
        </p>
      </CardContent>
    </Card>
  );
}
