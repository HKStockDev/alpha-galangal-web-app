"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useToast } from "@/context/toast-context";
import {
  deleteAdminFormulaHeroImage,
  fetchMyOrganizations,
  getAdminFormulaMarketing,
  listAdminFormulaMarketing,
  patchAdminFormulaMarketing,
  uploadAdminFormulaHeroImage,
  type FormulaMarketingRow,
} from "@/lib/api";
import { FormHelperText, FormInput, FormLabel, FormSection } from "@/components/ui-kit/forms";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { cn } from "@/lib/utils";
import { useFormulaPageMarketingTab } from "@/components/dashboard/formula-page-marketing-tab-context";
import { FormulaMarketingHubSeo } from "@/components/dashboard/formula-marketing-hub-seo";
import { FormulaMarketingReleasesSeo } from "@/components/dashboard/formula-marketing-releases-seo";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";

const DEFAULT_SORT_OPTIONS = [
  { value: "score_desc", label: "Score (highest first)" },
  { value: "score_asc", label: "Score (lowest first)" },
  { value: "ticker_asc", label: "Ticker (A–Z)" },
] as const;

type Visibility = "organization" | "private" | "public";

function isVisibility(s: string): s is Visibility {
  return s === "organization" || s === "private" || s === "public";
}

function readString(obj: Record<string, unknown>, key: string, fallback: string) {
  const v = obj[key];
  return typeof v === "string" ? v : fallback;
}

function readNumber(obj: Record<string, unknown>, key: string, fallback: number) {
  const v = obj[key];
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

export function FormulaMarketingForm({
  accessToken,
  formulaKey,
  contextLabel,
  showReleaseSeo = false,
}: {
  accessToken: string | null;
  /** Must match `formulas.key` in the list endpoint response. */
  formulaKey: string;
  contextLabel: string;
  /** Admin-only: list + edit per-release SEO (current vs past). */
  showReleaseSeo?: boolean;
}) {
  const id = useId();
  const { showError, showSuccess } = useToast();

  const [candidates, setCandidates] = useState<FormulaMarketingRow[]>([]);
  const [orgNames, setOrgNames] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [row, setRow] = useState<FormulaMarketingRow | null>(null);
  /** Shown in-form (not as toast) when the list has no row for `formulaKey`. */
  const [loadHint, setLoadHint] = useState<string | null>(null);
  const [loadPhase, setLoadPhase] = useState<"idle" | "list" | "get">("idle");
  const [saving, setSaving] = useState(false);

  const [marketingSlug, setMarketingSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("organization");
  const [ctaKey, setCtaKey] = useState("");
  const [publicTickerLimit, setPublicTickerLimit] = useState("5");
  const [defaultSort, setDefaultSort] = useState("score_desc");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickPreviewUrl, setPickPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [heroAction, setHeroAction] = useState<"idle" | "upload" | "delete">("idle");
  const [marketingTab, setMarketingTab] = useState<"settings" | "releases" | "seo">("settings");
  const pageLevelMarketingTab = useFormulaPageMarketingTab();
  const activeMarketingTab = pageLevelMarketingTab ?? marketingTab;
  const showNestedMarketingTabBar = showReleaseSeo && pageLevelMarketingTab === null;

  const clearFilePick = useCallback(() => {
    if (pickPreviewUrl) {
      URL.revokeObjectURL(pickPreviewUrl);
    }
    setPickPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [pickPreviewUrl]);

  useEffect(
    () => () => {
      if (pickPreviewUrl) URL.revokeObjectURL(pickPreviewUrl);
    },
    [pickPreviewUrl]
  );

  const applyRowToForm = useCallback((r: FormulaMarketingRow) => {
    setMarketingSlug(r.marketing_slug ?? "");
    setDescription(r.description ?? "");
    if (isVisibility(r.visibility)) {
      setVisibility(r.visibility);
    } else {
      setVisibility("organization");
    }
    const s = (r.marketing_settings && typeof r.marketing_settings === "object"
      ? (r.marketing_settings as Record<string, unknown>)
      : {}) as Record<string, unknown>;
    setCtaKey(readString(s, "cta_key", ""));
    setPublicTickerLimit(String(readNumber(s, "public_ticker_limit", 5)));
    setDefaultSort(readString(s, "default_sort", "score_desc"));
  }, []);

  const fetchSelected = useCallback(
    async (token: string, selectedFormulaId: string) => {
      setLoadPhase("get");
      try {
        const r = await getAdminFormulaMarketing(token, selectedFormulaId);
        setRow(r);
        applyRowToForm(r);
        setPickPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        setRow(null);
        showError(err instanceof Error ? err.message : "Failed to load formula");
      } finally {
        setLoadPhase("idle");
      }
    },
    [applyRowToForm, showError]
  );

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      setLoadPhase("list");
      setRow(null);
      setSelectedId(null);
      setCandidates([]);
      setLoadHint(null);
      try {
        try {
          const orgs = await fetchMyOrganizations(accessToken);
          if (!cancelled) {
            setOrgNames(Object.fromEntries(orgs.map((o) => [o.id, o.name])));
          }
        } catch {
          if (!cancelled) setOrgNames({});
        }
        const all = await listAdminFormulaMarketing(accessToken);
        if (cancelled) return;
        const match = all.filter((f) => f.key === formulaKey);
        setCandidates(match);
        if (match.length === 0) {
          setLoadHint(
            all.length === 0
              ? "The marketing list returned no formulas. Confirm you are a platform admin and the API is configured."
              : `No row with key “${formulaKey}”. Update INVESTOR_SCORE_FORMULA_KEY (investor models) or formula-marketing-keys (other models) in the repo so it matches your database formulas.key, or add the matching row on the server.`
          );
          return;
        }
        setLoadHint(null);
        setSelectedId(match[0].id);
        await fetchSelected(accessToken, match[0].id);
      } catch (err) {
        if (!cancelled) {
          showError(err instanceof Error ? err.message : "Failed to list formulas");
        }
      } finally {
        if (!cancelled) setLoadPhase("idle");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, formulaKey, showError, fetchSelected]);

  useEffect(() => {
    setMarketingTab("settings");
  }, [row?.id]);

  const onSelectOrg = async (newId: string) => {
    setSelectedId(newId);
    if (!accessToken) return;
    await fetchSelected(accessToken, newId);
  };

  const MAX_HERO_BYTES = 8 * 1024 * 1024;

  const onHeroFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      clearFilePick();
      return;
    }
    if (!f.type.startsWith("image/")) {
      showError("Please choose an image file (PNG, JPEG, WebP, …).");
      clearFilePick();
      return;
    }
    if (f.size > MAX_HERO_BYTES) {
      showError(`Image must be ${MAX_HERO_BYTES / (1024 * 1024)}MB or smaller.`);
      clearFilePick();
      return;
    }
    setPickPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setSelectedFile(f);
  };

  const uploadHero = async () => {
    if (!accessToken || !row || !selectedFile) return;
    setHeroAction("upload");
    try {
      const updated = await uploadAdminFormulaHeroImage(accessToken, row.id, selectedFile);
      setRow(updated);
      applyRowToForm(updated);
      clearFilePick();
      showSuccess("Hero image uploaded");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setHeroAction("idle");
    }
  };

  const removeHero = async () => {
    if (!accessToken || !row?.hero_image_url) return;
    setHeroAction("delete");
    try {
      const updated = await deleteAdminFormulaHeroImage(accessToken, row.id);
      setRow(updated);
      applyRowToForm(updated);
      clearFilePick();
      showSuccess("Hero image removed");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setHeroAction("idle");
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !row) return;
    const lim = publicTickerLimit.trim() ? parseInt(publicTickerLimit.trim(), 10) : NaN;
    if (Number.isNaN(lim) || lim < 0) {
      showError("Public ticker limit must be a non-negative integer");
      return;
    }
    const base =
      (row.marketing_settings && typeof row.marketing_settings === "object"
        ? (row.marketing_settings as Record<string, unknown>)
        : {}) as Record<string, unknown>;
    const marketing_settings: Record<string, unknown> = {
      ...base,
      cta_key: ctaKey.trim(),
      public_ticker_limit: lim,
      default_sort: defaultSort,
    };
    setSaving(true);
    try {
      const updated = await patchAdminFormulaMarketing(accessToken, row.id, {
        marketing_slug: marketingSlug.trim() || null,
        description: description.trim() || null,
        marketing_settings,
        visibility,
      });
      setRow(updated);
      applyRowToForm(updated);
      showSuccess("Marketing settings saved");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!accessToken) {
    return null;
  }

  const orgLabel = (oid: string | null) =>
    oid == null ? "Shared (no organization)" : (orgNames[oid] ?? `Organization ${oid.slice(0, 8)}…`);

  const renderSettingsForm = () => {
    if (!row) {
      return null;
    }
    return (
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        {row.updated_at ? (
          <p className="text-xs text-muted-foreground">Last updated {row.updated_at}</p>
        ) : null}

        <div className="space-y-2">
          <FormLabel htmlFor={`${id}-slug`}>Marketing slug</FormLabel>
          <FormInput
            id={`${id}-slug`}
            value={marketingSlug}
            onChange={(e) => setMarketingSlug(e.target.value)}
            placeholder="e.g. my-formula"
            autoComplete="off"
          />
          <FormHelperText>URL segment; unique per organization. Leave empty to clear.</FormHelperText>
        </div>

        <div className="space-y-2">
          <FormLabel htmlFor={`${id}-description`}>Description</FormLabel>
          <textarea
            id={`${id}-description`}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={cn(
              "flex min-h-24 w-full max-w-2xl resize-y rounded-xl border border-input bg-background px-3 py-2",
              "text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground",
              "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            )}
            placeholder="Short description for marketing / public use."
          />
          <FormHelperText>Stored on the formula row. Leave empty to clear (if the API allows).</FormHelperText>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <div>
            <FormLabel className="text-foreground">Hero image</FormLabel>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload replaces the current image. Hero is stored on the server; use Save
              marketing for slug, visibility, and other fields only.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            id={`${id}-hero-file`}
            aria-label="Choose hero image file"
            onChange={onHeroFileInputChange}
          />

          {row.hero_image_url && !selectedFile ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Current</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- dynamic admin URLs */}
                <img
                  src={row.hero_image_url}
                  alt=""
                  className="h-32 max-w-full rounded-lg border border-border object-contain"
                />
                <div className="min-w-0 flex-1 space-y-1 text-xs break-all text-muted-foreground">
                  <a
                    href={row.hero_image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Open image URL
                  </a>
                  <p className="font-mono text-[10px] leading-relaxed opacity-80">
                    {row.hero_image_url}
                  </p>
                </div>
              </div>
            </div>
          ) : !row.hero_image_url && !selectedFile ? (
            <p className="text-sm text-muted-foreground">No hero image set.</p>
          ) : null}

          {selectedFile && pickPreviewUrl ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">New selection (not uploaded yet)</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pickPreviewUrl}
                alt=""
                className="h-32 max-w-full rounded-lg border border-dashed border-primary/50 object-contain"
              />
              <p className="text-sm text-foreground">
                {selectedFile.name}{" "}
                <span className="text-muted-foreground">
                  ({(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <SecondaryButton
              type="button"
              disabled={heroAction !== "idle"}
              onClick={() => fileInputRef.current?.click()}
            >
              {row.hero_image_url || selectedFile ? "Replace with file…" : "Choose file…"}
            </SecondaryButton>
            {selectedFile ? (
              <>
                <PrimaryButton
                  type="button"
                  disabled={heroAction !== "idle" || !selectedFile}
                  onClick={() => void uploadHero()}
                >
                  {heroAction === "upload" ? "Uploading…" : "Upload"}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  disabled={heroAction !== "idle"}
                  onClick={() => clearFilePick()}
                >
                  Clear selection
                </SecondaryButton>
              </>
            ) : null}
            {row.hero_image_url && !selectedFile ? (
              <SecondaryButton
                type="button"
                disabled={heroAction !== "idle"}
                onClick={() => void removeHero()}
              >
                {heroAction === "delete" ? "Removing…" : "Remove image"}
              </SecondaryButton>
            ) : null}
          </div>
          <FormHelperText>
            Empty or invalid files are ignored. Max size {MAX_HERO_BYTES / (1024 * 1024)}MB. Supported:
            common image types.
          </FormHelperText>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">Visibility</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            {(
              [
                { v: "public" as const, t: "Public" },
                { v: "organization" as const, t: "Organization" },
                { v: "private" as const, t: "Private" },
              ] as const
            ).map(({ v, t }) => (
              <label key={v} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`${id}-vis`}
                  value={v}
                  checked={visibility === v}
                  onChange={() => setVisibility(v)}
                  className="size-4 accent-primary"
                />
                {t}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <FormLabel htmlFor={`${id}-cta`}>CTA key</FormLabel>
          <FormInput
            id={`${id}-cta`}
            value={ctaKey}
            onChange={(e) => setCtaKey(e.target.value)}
            placeholder="Create Account"
          />
          <FormHelperText>
            Stored in <span className="font-mono">marketing_settings.cta_key</span>
          </FormHelperText>
        </div>

        <div className="space-y-2">
          <FormLabel htmlFor={`${id}-limit`}>Public ticker limit</FormLabel>
          <FormInput
            id={`${id}-limit`}
            inputMode="numeric"
            value={publicTickerLimit}
            onChange={(e) => setPublicTickerLimit(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <FormLabel htmlFor={`${id}-sort`}>Default sort</FormLabel>
          <select
            id={`${id}-sort`}
            className={cn(
              "flex h-9 w-full max-w-md rounded-xl border border-input bg-background px-3 py-2",
              "text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            )}
            value={defaultSort}
            onChange={(e) => setDefaultSort(e.target.value)}
          >
            {defaultSort && !DEFAULT_SORT_OPTIONS.some((o) => o.value === defaultSort) && (
              <option value={defaultSort}>{defaultSort} (from API)</option>
            )}
            {DEFAULT_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <PrimaryButton type="submit" disabled={saving || loadPhase !== "idle"}>
            {saving ? "Saving…" : "Save marketing"}
          </PrimaryButton>
          <SecondaryButton
            type="button"
            disabled={saving}
            onClick={() => {
              if (row && accessToken) {
                void fetchSelected(accessToken, row.id);
              }
            }}
          >
            Reload
          </SecondaryButton>
        </div>
      </form>
    );
  };

  return (
    <FormSection className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Marketing (public site)</h2>
        <p className="text-sm text-muted-foreground">
          {contextLabel} — <span className="font-mono text-xs">{formulaKey}</span>
        </p>
        {loadHint ? (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
            {loadHint}
          </p>
        ) : null}
      </div>

      {candidates.length > 1 && (
        <div className="space-y-2">
          <FormLabel htmlFor={`${id}-org`}>Organization</FormLabel>
          <select
            id={`${id}-org`}
            className={cn(
              "flex h-9 w-full max-w-md rounded-xl border border-input bg-background px-3 py-2",
              "text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            )}
            value={selectedId ?? ""}
            onChange={(e) => {
              void onSelectOrg(e.target.value);
            }}
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {orgLabel(c.organization_id)} — {c.name}
              </option>
            ))}
          </select>
          <FormHelperText>
            More than one formula row matches this key; pick which org to edit.
          </FormHelperText>
        </div>
      )}

      {loadPhase !== "idle" && !row ? (
        <LoadingSkeleton variant="card" lines={4} className="py-4" />
      ) : null}

      {candidates.length === 0 && loadPhase === "idle" ? (
        <p className="text-sm text-muted-foreground">No rows to show.</p>
      ) : null}

      {row && !showReleaseSeo && renderSettingsForm()}

      {row && showReleaseSeo && (
        <div className="space-y-0">
          {showNestedMarketingTabBar ? (
            <div
              className="flex flex-wrap gap-0 border-b border-border"
              role="tablist"
              aria-label="Marketing sections"
            >
              {(
                [
                  { id: "releases" as const, label: "Releases" },
                  { id: "seo" as const, label: "SEO" },
                  { id: "settings" as const, label: "Settings" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeMarketingTab === tab.id}
                  onClick={() => setMarketingTab(tab.id)}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    activeMarketingTab === tab.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}
          <div
            className={cn(
              "min-h-[12rem] p-4 sm:p-5",
              showNestedMarketingTabBar && "rounded-b-lg border border-t-0 border-border bg-card/20"
            )}
          >
            {activeMarketingTab === "settings" && renderSettingsForm()}
            {activeMarketingTab === "releases" && (
              <FormulaMarketingReleasesSeo
                key={row.id}
                embedded
                accessToken={accessToken}
                formulaId={row.id}
              />
            )}
            {activeMarketingTab === "seo" && (
              <FormulaMarketingHubSeo
                accessToken={accessToken}
                row={row}
                onRowUpdated={(r) => {
                  setRow(r);
                  applyRowToForm(r);
                }}
              />
            )}
          </div>
        </div>
      )}
    </FormSection>
  );
}
