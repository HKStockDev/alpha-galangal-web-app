"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ConfirmSaveModal } from "@/components/formulas/confirm-save-modal";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getInsiderPrecisionScoreFormula,
  updateInsiderPrecisionScoreParams,
  type InsiderPrecisionCapNormMethod,
  type InsiderPrecisionFormulaParams,
} from "@/lib/api";
import { SectionCard } from "@/components/ui-kit/cards";
import { cn } from "@/lib/utils";

const CAP_NORM_OPTIONS: { value: InsiderPrecisionCapNormMethod; label: string }[] = [
  { value: "market_cap", label: "Market cap" },
  { value: "enterprise_value", label: "Enterprise value" },
  { value: "revenue_ttm", label: "Revenue (TTM)" },
];

/** Common SEC Form 4 transaction codes (single letter). */
const TRANSACTION_TYPE_OPTIONS: { code: string; label: string }[] = [
  { code: "P", label: "P — Open market purchase" },
  { code: "S", label: "S — Open market sale" },
  { code: "M", label: "M — Exercise of derivative" },
  { code: "A", label: "A — Grant / award" },
  { code: "G", label: "G — Gift" },
  { code: "F", label: "F — Payment of exercise price" },
  { code: "I", label: "I — Discretionary transaction" },
  { code: "C", label: "C — Conversion" },
  { code: "W", label: "W — Acquisition or disposition by will" },
  { code: "D", label: "D — Disposition to issuer" },
];

function sameParams(
  a: InsiderPrecisionFormulaParams,
  b: InsiderPrecisionFormulaParams
): boolean {
  const keys = Object.keys(a) as (keyof InsiderPrecisionFormulaParams)[];
  for (const k of keys) {
    if (k === "included_transaction_types") {
      if (a[k].length !== b[k].length) return false;
      if (a[k].some((c, i) => c !== b[k][i])) return false;
    } else if (a[k] !== b[k]) return false;
  }
  return true;
}

function NumField({
  id,
  label,
  value,
  onChange,
  step = "any",
  min,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: string;
  min?: number;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type="number"
        step={step}
        min={min}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) onChange(v);
        }}
        className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-right text-sm text-foreground dark:bg-input/30"
      />
    </div>
  );
}

export function InsiderPrecisionTab({
  accessToken,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [params, setParams] = useState<InsiderPrecisionFormulaParams | null>(null);
  const [saved, setSaved] = useState<InsiderPrecisionFormulaParams | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getInsiderPrecisionScoreFormula(accessToken)
      .then((res) => {
        const p = res.formula?.definition?.params;
        if (p) {
          setParams(p);
          setSaved(p);
        }
      })
      .catch(() => showError("Failed to load insider precision formula"))
      .finally(() => setLoading(false));
  }, [accessToken, showError]);

  function patch<K extends keyof InsiderPrecisionFormulaParams>(
    key: K,
    value: InsiderPrecisionFormulaParams[K]
  ) {
    setParams((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handleSaveClick() {
    if (!params) return;
    setConfirmOpen(true);
  }

  function handleConfirm() {
    if (!params || !accessToken) return;
    setSaving(true);
    updateInsiderPrecisionScoreParams(params, accessToken)
      .then((formula) => {
        const p = formula?.definition?.params;
        if (p) {
          setSaved(p);
          setParams(p);
        }
        setConfirmOpen(false);
        showSuccess("Insider precision settings saved");
      })
      .catch((err) => {
        showError(err instanceof Error ? err.message : "Save failed");
      })
      .finally(() => setSaving(false));
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!params || !saved) {
    return (
      <p className="text-muted-foreground">
        Insider Precision Score formula not found. Apply migration{" "}
        <code className="rounded bg-muted px-1 text-xs">20260415120000_seed_insider_precision_score_ske36.sql</code>{" "}
        and ensure an organization exists.
      </p>
    );
  }

  const hasChanges = !sameParams(params, saved);
  const txSummary =
    params.included_transaction_types.length === 0
      ? "None"
      : params.included_transaction_types.join(", ");

  return (
    <>
      <SectionCard className="rounded-xl border-border bg-card">
        <h2 className="mb-2 text-sm font-medium text-foreground">
          Insider Precision Score (SKE-36)
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Parameters for role weights, recency decay, clustering, tanh scaling, trade
          filters, and size normalization per{" "}
          <span className="font-medium text-foreground">Docs/Formulas.md</span>.
        </p>

        <h3 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Role weights
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumField
            id="ics-rw-ceo"
            label="Role weight: CEO"
            value={params.role_weight_ceo}
            onChange={(n) => patch("role_weight_ceo", n)}
            step="0.05"
            min={0}
          />
          <NumField
            id="ics-rw-cfo"
            label="Role weight: CFO"
            value={params.role_weight_cfo}
            onChange={(n) => patch("role_weight_cfo", n)}
            step="0.05"
            min={0}
          />
          <NumField
            id="ics-rw-chair"
            label="Role weight: Chairman"
            value={params.role_weight_chairman}
            onChange={(n) => patch("role_weight_chairman", n)}
            step="0.05"
            min={0}
          />
          <NumField
            id="ics-rw-pres"
            label="Role weight: President"
            value={params.role_weight_president}
            onChange={(n) => patch("role_weight_president", n)}
            step="0.05"
            min={0}
          />
          <NumField
            id="ics-rw-dir"
            label="Role weight: Director"
            value={params.role_weight_director}
            onChange={(n) => patch("role_weight_director", n)}
            step="0.05"
            min={0}
          />
          <NumField
            id="ics-rw-10"
            label="Role weight: 10% Owner"
            value={params.role_weight_ten_percent_owner}
            onChange={(n) => patch("role_weight_ten_percent_owner", n)}
            step="0.05"
            min={0}
          />
          <NumField
            id="ics-rw-off"
            label="Role weight: Officer"
            value={params.role_weight_officer}
            onChange={(n) => patch("role_weight_officer", n)}
            step="0.05"
            min={0}
          />
        </div>

        <h3 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Recency weights
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumField
            id="ics-rc-0"
            label="Recency weight: 0–30 days"
            value={params.recency_weight_0_30_days}
            onChange={(n) => patch("recency_weight_0_30_days", n)}
            step="0.05"
            min={0}
          />
          <NumField
            id="ics-rc-31"
            label="Recency weight: 31–60 days"
            value={params.recency_weight_31_60_days}
            onChange={(n) => patch("recency_weight_31_60_days", n)}
            step="0.05"
            min={0}
          />
          <NumField
            id="ics-rc-61"
            label="Recency weight: 61–90 days"
            value={params.recency_weight_61_90_days}
            onChange={(n) => patch("recency_weight_61_90_days", n)}
            step="0.05"
            min={0}
          />
        </div>

        <h3 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Window & scaling
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumField
            id="ics-lb"
            label="Signal lookback window (days)"
            value={params.signal_lookback_days}
            onChange={(n) => patch("signal_lookback_days", Math.round(n))}
            step="1"
            min={1}
          />
          <NumField
            id="ics-tanh"
            label="Score scaling factor (tanh multiplier)"
            value={params.score_scaling_factor}
            onChange={(n) => patch("score_scaling_factor", n)}
            step="1"
            min={0}
          />
          <NumField
            id="ics-min"
            label="Minimum trade value threshold (USD)"
            value={params.minimum_trade_value_threshold_usd}
            onChange={(n) => patch("minimum_trade_value_threshold_usd", n)}
            step="1000"
            min={0}
          />
        </div>

        <h3 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Buy cluster multipliers
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumField
            id="ics-bc1"
            label="Buy cluster: 1 insider"
            value={params.buy_cluster_multiplier_1}
            onChange={(n) => patch("buy_cluster_multiplier_1", n)}
            step="0.05"
            min={0}
          />
          <NumField
            id="ics-bc2"
            label="Buy cluster: 2 insiders"
            value={params.buy_cluster_multiplier_2}
            onChange={(n) => patch("buy_cluster_multiplier_2", n)}
            step="0.05"
            min={0}
          />
          <NumField
            id="ics-bc3"
            label="Buy cluster: 3+ insiders"
            value={params.buy_cluster_multiplier_3_plus}
            onChange={(n) => patch("buy_cluster_multiplier_3_plus", n)}
            step="0.05"
            min={0}
          />
        </div>

        <h3 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sell cluster multipliers
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumField
            id="ics-sc1"
            label="Sell cluster: 1 insider"
            value={params.sell_cluster_multiplier_1}
            onChange={(n) => patch("sell_cluster_multiplier_1", n)}
            step="0.05"
            min={0}
          />
          <NumField
            id="ics-sc2"
            label="Sell cluster: 2 insiders"
            value={params.sell_cluster_multiplier_2}
            onChange={(n) => patch("sell_cluster_multiplier_2", n)}
            step="0.05"
            min={0}
          />
          <NumField
            id="ics-sc3"
            label="Sell cluster: 3+ insiders"
            value={params.sell_cluster_multiplier_3_plus}
            onChange={(n) => patch("sell_cluster_multiplier_3_plus", n)}
            step="0.05"
            min={0}
          />
        </div>

        <h3 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Transaction types & normalization
        </h3>
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4">
            <span className="text-sm font-medium text-foreground">
              Included transaction types
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              SEC single-letter codes included when scoring (default open-market P / S).
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "mt-3 flex h-10 w-full max-w-md items-center justify-between rounded-lg border border-input bg-background px-3 text-left text-sm text-foreground dark:bg-input/30"
                  )}
                >
                  <span className="truncate">{txSummary}</span>
                  <ChevronDown className="size-4 shrink-0 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="start">
                {TRANSACTION_TYPE_OPTIONS.map((opt) => (
                  <DropdownMenuCheckboxItem
                    key={opt.code}
                    checked={params.included_transaction_types.includes(opt.code)}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        patch(
                          "included_transaction_types",
                          [...new Set([...params.included_transaction_types, opt.code])].sort()
                        );
                      } else if (checked === false) {
                        const next = params.included_transaction_types.filter((c) => c !== opt.code);
                        if (next.length === 0) {
                          showError("At least one transaction type must stay selected");
                          return;
                        }
                        patch("included_transaction_types", next);
                      }
                    }}
                  >
                    <span className="font-mono text-xs">{opt.label}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="rounded-lg border border-border p-4">
            <label className="text-sm font-medium text-foreground">
              Market cap normalization method
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Denominator for pressure ratio (company size proxy).
            </p>
            <Select
              value={params.market_cap_normalization_method}
              onValueChange={(v) =>
                patch("market_cap_normalization_method", v as InsiderPrecisionCapNormMethod)
              }
            >
              <SelectTrigger className="mt-3 h-10 max-w-md w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAP_NORM_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveClick}
          disabled={!hasChanges || saving}
          className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          Save
        </button>
      </SectionCard>

      <ConfirmSaveModal
        isOpen={confirmOpen}
        isSaving={saving}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
