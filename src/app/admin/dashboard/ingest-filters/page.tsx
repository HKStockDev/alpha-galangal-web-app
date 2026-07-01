"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  fetchStockIngestFilters,
  patchStockIngestFilters,
  type StockIngestFilters,
} from "@/lib/api";
import {
  ALLOWED_INGEST_COUNTRIES,
  ALLOWED_INGEST_SECURITY_TYPES,
  ALLOWED_STOCK_EXCHANGES,
  INGEST_SECURITY_TYPE_LABELS,
} from "@/lib/stock-ingest-filters.constants";
import {
  describeIngestRules,
  isIngestRulesWideOpen,
} from "@/lib/describe-ingest-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ADMIN_DASHBOARD } from "@/lib/auth-routing";
import type { LucideIcon } from "lucide-react";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import {
  BarChart3,
  Building2,
  Check,
  Globe2,
  Layers,
  ListChecks,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

type Draft = Omit<StockIngestFilters, "updated_at" | "updated_by">;

type ListDimension = "exchanges" | "security_types" | "countries";

type PendingListRemoval = {
  dimension: ListDimension;
  value: string;
  displayLabel: string;
} | null;

type NumericKey = keyof Pick<
  Draft,
  | "min_market_cap_millions"
  | "min_avg_share_volume_thousands"
  | "min_price_usd"
  | "min_avg_dollar_volume_millions"
>;

type PendingNumericClear = { key: NumericKey; label: string } | null;

function draftFromResponse(r: StockIngestFilters): Draft {
  return {
    exchanges: [...r.exchanges],
    security_types: [...r.security_types],
    countries: [...r.countries],
    min_market_cap_millions: r.min_market_cap_millions,
    min_avg_share_volume_thousands: r.min_avg_share_volume_thousands,
    min_price_usd: r.min_price_usd,
    min_avg_dollar_volume_millions: r.min_avg_dollar_volume_millions,
  };
}

function sortedCopy(arr: string[]): string[] {
  return [...arr].sort();
}

function draftEqual(a: Draft, b: Draft): boolean {
  const eqArr = (x: string[], y: string[]) =>
    sortedCopy(x).join("\0") === sortedCopy(y).join("\0");
  return (
    eqArr(a.exchanges, b.exchanges) &&
    eqArr(a.security_types, b.security_types) &&
    eqArr(a.countries, b.countries) &&
    a.min_market_cap_millions === b.min_market_cap_millions &&
    a.min_avg_share_volume_thousands === b.min_avg_share_volume_thousands &&
    a.min_price_usd === b.min_price_usd &&
    a.min_avg_dollar_volume_millions === b.min_avg_dollar_volume_millions
  );
}

function toggleListValue(list: string[], value: string, on: boolean): string[] {
  const set = new Set(list);
  if (on) set.add(value);
  else set.delete(value);
  return sortedCopy([...set]);
}

const NUMERIC_FIELDS: {
  key: NumericKey;
  label: string;
  description: string;
  step: string;
  suffix?: string;
}[] = [
  {
    key: "min_market_cap_millions",
    label: "Minimum market cap",
    description: "USD millions. Leave empty for no minimum.",
    step: "1",
    suffix: "$M",
  },
  {
    key: "min_avg_share_volume_thousands",
    label: "Minimum average daily volume",
    description: "Thousands of shares. Leave empty for no minimum.",
    step: "1",
    suffix: "K shares",
  },
  {
    key: "min_price_usd",
    label: "Minimum price",
    description: "USD per share. Leave empty for no minimum.",
    step: "0.01",
  },
  {
    key: "min_avg_dollar_volume_millions",
    label: "Minimum average dollar volume",
    description: "USD millions per day. Leave empty for no minimum.",
    step: "0.1",
    suffix: "$M",
  },
];

function syncNumericDraftFromStrings(nextStrings: Record<NumericKey, string>, prev: Draft): Draft {
  const next = { ...prev };
  (Object.keys(nextStrings) as NumericKey[]).forEach((key) => {
    const raw = nextStrings[key];
    const t = raw.trim();
    if (t === "") {
      next[key] = null;
      return;
    }
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) {
      return;
    }
    next[key] = n;
  });
  return next;
}

function FilterCheckboxRow({
  id,
  label,
  checked,
  disabled,
  onToggle,
}: {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-200",
        disabled && "pointer-events-none opacity-50",
        checked
          ? "border-primary/35 bg-primary/[0.07] shadow-sm ring-1 ring-primary/15 dark:bg-primary/10"
          : "border-border/60 bg-card/60 hover:border-border hover:bg-muted/35 dark:bg-card/40"
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/20 bg-background group-hover:border-muted-foreground/35"
        )}
        aria-hidden
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span className="font-medium leading-snug text-foreground">{label}</span>
    </label>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/50 shadow-sm shadow-black/[0.03] transition-shadow dark:shadow-black/20",
        "hover:shadow-md hover:shadow-black/[0.04] dark:hover:shadow-black/30",
        className
      )}
    >
      <CardHeader className="space-y-1 border-b border-border/40 bg-gradient-to-br from-card to-muted/20 pb-4 dark:from-card dark:to-muted/10">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/15">
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 space-y-1 pt-0.5">
            <CardTitle className="text-lg font-semibold tracking-tight">{title}</CardTitle>
            <CardDescription className="text-pretty leading-relaxed">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}

export default function AdminIngestFiltersPage() {
  const { accessToken } = useAuth();
  const { showSuccess, showError } = useToast();

  const [saved, setSaved] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [meta, setMeta] = useState<{ updated_at: string; updated_by: string | null } | null>(
    null
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingListRemoval, setPendingListRemoval] = useState<PendingListRemoval>(null);
  const [pendingNumericClear, setPendingNumericClear] = useState<PendingNumericClear>(null);
  const [numericStrings, setNumericStrings] = useState<Record<NumericKey, string>>({
    min_market_cap_millions: "",
    min_avg_share_volume_thousands: "",
    min_price_usd: "",
    min_avg_dollar_volume_millions: "",
  });

  const load = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchStockIngestFilters(accessToken);
      const d = draftFromResponse(data);
      setSaved(d);
      setDraft(d);
      setMeta({ updated_at: data.updated_at, updated_by: data.updated_by });
      setNumericStrings({
        min_market_cap_millions:
          data.min_market_cap_millions == null ? "" : String(data.min_market_cap_millions),
        min_avg_share_volume_thousands:
          data.min_avg_share_volume_thousands == null
            ? ""
            : String(data.min_avg_share_volume_thousands),
        min_price_usd: data.min_price_usd == null ? "" : String(data.min_price_usd),
        min_avg_dollar_volume_millions:
          data.min_avg_dollar_volume_millions == null
            ? ""
            : String(data.min_avg_dollar_volume_millions),
      });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
      setSaved(null);
      setDraft(null);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const isDirty = useMemo(() => {
    if (!saved || !draft) return false;
    return !draftEqual(saved, draft);
  }, [saved, draft]);

  function handleNumericInput(key: NumericKey, raw: string) {
    const nextStrings = { ...numericStrings, [key]: raw };
    setNumericStrings(nextStrings);
    setDraft((d) => (d ? syncNumericDraftFromStrings(nextStrings, d) : d));
  }

  function requestListToggle(dimension: ListDimension, value: string, nextChecked: boolean) {
    if (!draft) return;
    if (nextChecked) {
      setDraft({
        ...draft,
        [dimension]: toggleListValue(draft[dimension], value, true),
      });
      return;
    }
    const displayLabel =
      dimension === "security_types"
        ? INGEST_SECURITY_TYPE_LABELS[value as keyof typeof INGEST_SECURITY_TYPE_LABELS] ?? value
        : value;
    setPendingListRemoval({ dimension, value, displayLabel });
  }

  function confirmListRemoval() {
    if (!pendingListRemoval || !draft) return;
    const { dimension, value } = pendingListRemoval;
    setDraft({
      ...draft,
      [dimension]: toggleListValue(draft[dimension], value, false),
    });
    setPendingListRemoval(null);
  }

  function requestNumericClear(key: NumericKey, label: string) {
    setPendingNumericClear({ key, label });
  }

  function confirmNumericClear() {
    if (!pendingNumericClear || !draft) return;
    const { key } = pendingNumericClear;
    setNumericStrings((s) => ({ ...s, [key]: "" }));
    setDraft({ ...draft, [key]: null });
    setPendingNumericClear(null);
  }

  async function performSave() {
    if (!accessToken || !draft) return;
    setIsSaving(true);
    try {
      const updated = await patchStockIngestFilters(accessToken, {
        exchanges: draft.exchanges,
        security_types: draft.security_types,
        countries: draft.countries,
        min_market_cap_millions: draft.min_market_cap_millions,
        min_avg_share_volume_thousands: draft.min_avg_share_volume_thousands,
        min_price_usd: draft.min_price_usd,
        min_avg_dollar_volume_millions: draft.min_avg_dollar_volume_millions,
      });
      const d = draftFromResponse(updated);
      setSaved(d);
      setDraft(d);
      setMeta({ updated_at: updated.updated_at, updated_by: updated.updated_by });
      setNumericStrings({
        min_market_cap_millions:
          updated.min_market_cap_millions == null ? "" : String(updated.min_market_cap_millions),
        min_avg_share_volume_thousands:
          updated.min_avg_share_volume_thousands == null
            ? ""
            : String(updated.min_avg_share_volume_thousands),
        min_price_usd: updated.min_price_usd == null ? "" : String(updated.min_price_usd),
        min_avg_dollar_volume_millions:
          updated.min_avg_dollar_volume_millions == null
            ? ""
            : String(updated.min_avg_dollar_volume_millions),
      });
      setShowSaveDialog(false);
      showSuccess("Ingest filters saved.");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  function validateDraft(): string | null {
    if (!draft) return "Nothing to save.";
    for (const { key } of NUMERIC_FIELDS) {
      const raw = numericStrings[key].trim();
      if (raw === "") continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) {
        return "Numeric thresholds must be non-negative numbers, or left empty.";
      }
    }
    return null;
  }

  const validationError = draft ? validateDraft() : null;
  const canSave =
    Boolean(accessToken && draft && isDirty && !validationError && !isLoading && !isSaving);

  const effectiveRulesLines = useMemo(
    () => (draft ? describeIngestRules(draft) : []),
    [draft]
  );
  const rulesWideOpen = draft ? isIngestRulesWideOpen(draft) : false;

  const updatedLine = meta?.updated_at
    ? `Last updated ${new Date(meta.updated_at).toLocaleString()}`
    : null;

  if (isLoading && !draft) {
    return (
      <div className="relative min-h-[50vh] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.05] via-transparent to-transparent dark:from-primary/[0.08]" />
        <div className="relative flex min-h-[42vh] items-center justify-center">
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-border/50 bg-card/90 px-12 py-14 shadow-lg shadow-black/[0.04] backdrop-blur-sm dark:bg-card/70 dark:shadow-black/30">
            <Spinner className="size-10 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Loading ingest configuration…</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !draft) {
    return (
      <div className="relative min-h-[40vh] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-destructive/[0.04] to-transparent" />
        <div className="relative mx-auto max-w-lg rounded-2xl border border-border/50 bg-card/90 p-8 shadow-sm backdrop-blur-sm dark:bg-card/70">
          <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <SlidersHorizontal className="size-6" strokeWidth={1.75} />
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight">Couldn&apos;t load filters</h1>
          <p className="mt-2 text-sm text-destructive">{loadError ?? "Unable to load filters."}</p>
          <SecondaryButton type="button" className="mt-6" onClick={() => void load()}>
            Try again
          </SecondaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-32 size-[520px] rounded-full bg-primary/[0.07] blur-3xl dark:bg-primary/[0.11]" />
        <div className="absolute -right-32 top-1/4 size-[380px] rounded-full bg-muted/70 blur-3xl dark:bg-muted/15" />
        <div className="absolute bottom-0 left-1/3 size-[280px] rounded-full bg-primary/[0.04] blur-3xl dark:bg-primary/[0.06]" />
      </div>

      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex flex-col gap-6 rounded-2xl border border-border/50 bg-card/85 p-6 shadow-md shadow-black/[0.04] backdrop-blur-md dark:bg-card/55 dark:shadow-black/25 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex min-w-0 gap-4 sm:gap-5">
              <div className="hidden shrink-0 sm:flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-inner dark:from-primary/25 dark:to-primary/10">
                <SlidersHorizontal className="size-7" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Ingest filters
                  </h1>
                  <Badge variant="secondary" className="font-normal">
                    Platform-wide
                  </Badge>
                  {isDirty && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 font-normal text-amber-900 dark:text-amber-200"
                    >
                      Unsaved changes
                    </Badge>
                  )}
                </div>
                <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
                  Control which securities are allowed into the platform when syncing from market
                  data. Empty lists leave that dimension unrestricted.
                </p>
                {updatedLine && (
                  <p className="mt-3 text-xs text-muted-foreground">{updatedLine}</p>
                )}
              </div>
            </div>
            <PrimaryButton
              type="button"
              size="lg"
              className="h-11 shrink-0 px-6 shadow-md shadow-primary/25 transition-shadow hover:shadow-lg hover:shadow-primary/30"
              disabled={!canSave}
              onClick={() => setShowSaveDialog(true)}
            >
              Save changes
            </PrimaryButton>
          </div>

          {validationError && (
            <div
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive dark:bg-destructive/10"
              role="alert"
            >
              {validationError}
            </div>
          )}

          <SectionCard
            icon={ListChecks}
            title="Filtering result"
            description={
              <>
                Plain-language summary of what will pass these ingest gates. This is not a ticker
                list — the screener does not show listings yet (
                <Link
                  href={`${ADMIN_DASHBOARD}/screener`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Screener
                </Link>
                ).
              </>
            }
          >
            {isDirty && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.08] px-3 py-2.5 text-xs text-amber-950 dark:text-amber-100">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 opacity-80" />
                <span>Preview reflects your unsaved edits. Save to apply across the platform.</span>
              </div>
            )}
            {rulesWideOpen ? (
              <Alert className="border-primary/20 bg-primary/[0.04] dark:bg-primary/[0.08]">
                <AlertTitle className="text-foreground">No restrictions from this config</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Every dimension below is open (empty lists and no numeric floors), so ingest is
                  not narrowed by these rules. Other pipeline steps may still limit what is stored.
                </AlertDescription>
              </Alert>
            ) : (
              <ul className="space-y-2.5 text-sm leading-relaxed text-foreground">
                {effectiveRulesLines.map((line, i) => (
                  <li key={`${line}-${i}`} className="flex gap-3">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70"
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            icon={Building2}
            title="Exchanges"
            description="Only securities on selected exchanges are ingested. None selected means all exchanges are allowed."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {ALLOWED_STOCK_EXCHANGES.map((ex) => (
                <FilterCheckboxRow
                  key={ex}
                  id={`ex-${ex}`}
                  label={ex}
                  checked={draft.exchanges.includes(ex)}
                  disabled={isSaving}
                  onToggle={(on) => requestListToggle("exchanges", ex, on)}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            icon={Layers}
            title="Security types"
            description="Restrict ingest to these types. None selected means all configured types are allowed."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ALLOWED_INGEST_SECURITY_TYPES.map((st) => (
                <FilterCheckboxRow
                  key={st}
                  id={`st-${st}`}
                  label={INGEST_SECURITY_TYPE_LABELS[st]}
                  checked={draft.security_types.includes(st)}
                  disabled={isSaving}
                  onToggle={(on) => requestListToggle("security_types", st, on)}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            icon={Globe2}
            title="Countries"
            description="Restrict by headquarters country. None selected means no country filter."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ALLOWED_INGEST_COUNTRIES.map((c) => (
                <FilterCheckboxRow
                  key={c}
                  id={`ct-${c}`}
                  label={c}
                  checked={draft.countries.includes(c)}
                  disabled={isSaving}
                  onToggle={(on) => requestListToggle("countries", c, on)}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            icon={BarChart3}
            title="Minimum thresholds"
            description="Optional floors evaluated at ingest. Clear a field to remove its minimum."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {NUMERIC_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="flex flex-col rounded-xl border border-border/50 bg-muted/30 p-4 dark:bg-muted/15"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <FormLabel htmlFor={field.key} className="text-sm font-medium">
                        {field.label}
                      </FormLabel>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {field.description}
                      </p>
                    </div>
                    {(draft[field.key] != null || numericStrings[field.key].trim() !== "") && (
                      <SecondaryButton
                        type="button"
                        size="sm"
                        className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={isSaving}
                        onClick={() => requestNumericClear(field.key, field.label.toLowerCase())}
                      >
                        Clear
                      </SecondaryButton>
                    )}
                  </div>
                  <Separator className="my-3 opacity-50" />
                  <div className="flex items-center gap-2">
                    <FormInput
                      id={field.key}
                      type="number"
                      min={0}
                      step={field.step}
                      value={numericStrings[field.key]}
                      disabled={isSaving}
                      onChange={(e) => handleNumericInput(field.key, e.target.value)}
                      className="h-10 max-w-full border-border/60 bg-background/80 font-mono text-sm dark:bg-background/50"
                    />
                    {field.suffix && (
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {field.suffix}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <Dialog open={showSaveDialog} onOpenChange={(open) => !open && !isSaving && setShowSaveDialog(false)}>
        <DialogContent className="gap-0 rounded-2xl border-border/60 p-0 sm:max-w-md" showCloseButton={false}>
          <div className="border-b border-border/50 bg-muted/30 px-6 py-4 dark:bg-muted/20">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg">Save ingest filters?</DialogTitle>
              <DialogDescription className="text-pretty leading-relaxed">
                These settings apply to the entire platform and change which securities are ingested
                from market data. Confirm only if you intend to update global ingest behavior.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="gap-2 border-t border-border/50 bg-card px-6 py-4 sm:justify-end">
            <SecondaryButton
              type="button"
              onClick={() => setShowSaveDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton type="button" onClick={() => void performSave()} disabled={isSaving}>
              {isSaving ? "Saving…" : "Confirm save"}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingListRemoval != null}
        onOpenChange={(open) => !open && setPendingListRemoval(null)}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this filter?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingListRemoval ? (
                <>
                  Remove <strong>{pendingListRemoval.displayLabel}</strong> from the allowed{" "}
                  {pendingListRemoval.dimension === "exchanges"
                    ? "exchanges"
                    : pendingListRemoval.dimension === "countries"
                      ? "countries"
                      : "security types"}
                  ? This affects platform-wide ingest immediately after you save.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmListRemoval}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingNumericClear != null}
        onOpenChange={(open) => !open && setPendingNumericClear(null)}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear this minimum?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingNumericClear ? (
                <>
                  Clear the {pendingNumericClear.label} threshold? There will be no minimum for
                  this metric until you set one again and save.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNumericClear}>Clear minimum</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
