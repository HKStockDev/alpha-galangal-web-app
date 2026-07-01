"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useToast } from "@/context/toast-context";
import {
  deleteAdminFormulaMarketingReleaseSeoOgImage,
  getAdminFormulaMarketingRelease,
  listAdminFormulaMarketingReleases,
  patchAdminFormulaMarketingRelease,
  uploadAdminFormulaMarketingReleaseSeoOgImage,
  type FormulaMarketingReleaseLineRow,
  type FormulaMarketingReleaseRow,
} from "@/lib/api";
import { formatMarketingDate } from "@/lib/public-marketing-api";
import { absolutePublicMarketingUrl } from "@/lib/public-marketing-base-url";
import { marketingReleasePath } from "@/components/marketing/formula/routes";
import { FormHelperText, FormInput, FormLabel, FormSection } from "@/components/ui-kit/forms";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { DataTable } from "@/components/ui-kit/data-table";
import { FormulaMarketingReleaseTickerTable } from "@/components/dashboard/formula-marketing-release-ticker-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const MAX_SEO_OG_BYTES = 8 * 1024 * 1024;

function sortReleases(rows: FormulaMarketingReleaseRow[]) {
  return [...rows].sort((a, b) => {
    if (a.is_current !== b.is_current) {
      return a.is_current ? -1 : 1;
    }
    return b.published_at.localeCompare(a.published_at);
  });
}

type Props = {
  accessToken: string;
  formulaId: string;
  embedded?: boolean;
};

export function FormulaMarketingReleasesSeo({ accessToken, formulaId, embedded }: Props) {
  const { showError, showSuccess } = useToast();
  const id = useId();
  const [releases, setReleases] = useState<FormulaMarketingReleaseRow[]>([]);
  const [listPhase, setListPhase] = useState<"idle" | "loading">("loading");
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const [detailRelease, setDetailRelease] = useState<FormulaMarketingReleaseRow | null>(null);
  const [detailRows, setDetailRows] = useState<FormulaMarketingReleaseLineRow[]>([]);
  const [detailPhase, setDetailPhase] = useState<"idle" | "loading">("idle");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [savingSeo, setSavingSeo] = useState(false);
  const ogFileRef = useRef<HTMLInputElement>(null);
  const [ogPreviewUrl, setOgPreviewUrl] = useState<string | null>(null);
  const [ogSelectedFile, setOgSelectedFile] = useState<File | null>(null);
  const [ogAction, setOgAction] = useState<"idle" | "upload" | "delete">("idle");
  const lastDetailIdRef = useRef<string | null>(null);

  const clearOgPick = useCallback(() => {
    if (ogPreviewUrl) {
      URL.revokeObjectURL(ogPreviewUrl);
    }
    setOgPreviewUrl(null);
    setOgSelectedFile(null);
    if (ogFileRef.current) {
      ogFileRef.current.value = "";
    }
  }, [ogPreviewUrl]);

  const load = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    setListPhase("loading");
    try {
      const raw = await listAdminFormulaMarketingReleases(accessToken, formulaId);
      setReleases(sortReleases(raw));
    } catch (e) {
      setReleases([]);
      showError(e instanceof Error ? e.message : "Failed to load marketing releases");
    } finally {
      setListPhase("idle");
    }
  }, [accessToken, formulaId, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!activeDetailId || !accessToken) {
      if (!activeDetailId) {
        setDetailRelease(null);
        setDetailRows([]);
        setDetailPhase("idle");
      }
      return;
    }
    setDetailRelease(null);
    setDetailRows([]);
    let cancelled = false;
    setDetailPhase("loading");
    (async () => {
      try {
        const { release, rows } = await getAdminFormulaMarketingRelease(accessToken, activeDetailId);
        if (cancelled) {
          return;
        }
        setDetailRelease(release);
        setDetailRows(rows);
        setSeoTitle(release.seo_title ?? "");
        setSeoDescription(release.seo_description ?? "");
      } catch (e) {
        if (!cancelled) {
          showError(e instanceof Error ? e.message : "Failed to load release");
          setActiveDetailId(null);
          setDetailRelease(null);
          setDetailRows([]);
        }
      } finally {
        if (!cancelled) {
          setDetailPhase("idle");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeDetailId, accessToken, showError]);

  useEffect(() => {
    if (lastDetailIdRef.current === activeDetailId) {
      return;
    }
    lastDetailIdRef.current = activeDetailId;
    clearOgPick();
  }, [activeDetailId, clearOgPick]);

  const mergeRow = (row: FormulaMarketingReleaseRow) => {
    setReleases((prev) => {
      const i = prev.findIndex((r) => r.id === row.id);
      if (i === -1) {
        return sortReleases([...prev, row]);
      }
      const next = [...prev];
      next[i] = row;
      return sortReleases(next);
    });
    setDetailRelease((d) => (d?.id === row.id ? row : d));
  };

  const onOgFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      clearOgPick();
      return;
    }
    if (!f.type.startsWith("image/")) {
      showError("Please choose an image file (PNG, JPEG, WebP, …).");
      clearOgPick();
      return;
    }
    if (f.size > MAX_SEO_OG_BYTES) {
      showError(`Image must be ${MAX_SEO_OG_BYTES / (1024 * 1024)}MB or smaller.`);
      clearOgPick();
      return;
    }
    setOgPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(f);
    });
    setOgSelectedFile(f);
  };

  const onSaveSeo = async () => {
    if (!accessToken || !activeDetailId) {
      return;
    }
    setSavingSeo(true);
    try {
      const updated = await patchAdminFormulaMarketingRelease(accessToken, activeDetailId, {
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
      });
      mergeRow(updated);
      setSeoTitle(updated.seo_title ?? "");
      setSeoDescription(updated.seo_description ?? "");
      showSuccess("Release SEO saved");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingSeo(false);
    }
  };

  const onUploadOg = async () => {
    if (!accessToken || !activeDetailId || !ogSelectedFile) {
      return;
    }
    setOgAction("upload");
    try {
      const updated = await uploadAdminFormulaMarketingReleaseSeoOgImage(
        accessToken,
        activeDetailId,
        ogSelectedFile
      );
      mergeRow(updated);
      clearOgPick();
      showSuccess("OG image uploaded");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setOgAction("idle");
    }
  };

  const onRemoveOg = async () => {
    if (!accessToken || !activeDetailId) {
      return;
    }
    setOgAction("delete");
    try {
      const updated = await deleteAdminFormulaMarketingReleaseSeoOgImage(
        accessToken,
        activeDetailId
      );
      if (updated) {
        mergeRow(updated);
      } else {
        try {
          const { release, rows } = await getAdminFormulaMarketingRelease(
            accessToken,
            activeDetailId
          );
          setDetailRelease(release);
          setDetailRows(rows);
        } catch {
          await load();
        }
      }
      clearOgPick();
      showSuccess("OG image removed");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setOgAction("idle");
    }
  };

  const reloadListAndDetail = async () => {
    await load();
    if (activeDetailId && accessToken) {
      setDetailPhase("loading");
      try {
        const { release, rows } = await getAdminFormulaMarketingRelease(accessToken, activeDetailId);
        setDetailRelease(release);
        setDetailRows(rows);
        setSeoTitle(release.seo_title ?? "");
        setSeoDescription(release.seo_description ?? "");
      } catch (e) {
        showError(e instanceof Error ? e.message : "Failed to reload release");
      } finally {
        setDetailPhase("idle");
      }
    }
  };

  const openRow = (releaseId: string) => {
    setActiveDetailId(releaseId);
  };

  const backToList = () => {
    setActiveDetailId(null);
  };

  if (listPhase === "loading" && releases.length === 0) {
    if (embedded) {
      return (
        <div className="space-y-3">
          <LoadingSkeleton variant="card" lines={4} className="py-4" />
        </div>
      );
    }
    return (
      <FormSection>
        <h2 className="text-base font-semibold text-foreground">Marketing releases (SEO)</h2>
        <LoadingSkeleton variant="card" lines={4} className="py-4" />
      </FormSection>
    );
  }

  if (releases.length === 0) {
    if (embedded) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            No published marketing releases for this formula. Create and publish a release in your
            backend, then return here to set SEO and manage releases.
          </p>
        </div>
      );
    }
    return (
      <FormSection>
        <h2 className="text-base font-semibold text-foreground">Marketing releases (SEO)</h2>
        <p className="text-sm text-muted-foreground">
          No published marketing releases for this formula. Create and publish a release in your
          backend, then return here to set SEO.
        </p>
      </FormSection>
    );
  }

  const intro = embedded ? (
    <p className="text-sm text-muted-foreground">
      The <span className="font-medium text-foreground">current</span> release is the one
      surfaced as “live” on the public marketing hub. Open a row to see tickers and edit SEO.
    </p>
  ) : (
    <>
      <h2 className="text-base font-semibold text-foreground">Marketing releases (SEO)</h2>
      <p className="text-sm text-muted-foreground">
        The <span className="font-medium text-foreground">current</span> release is the one
        surfaced as “live” on the public marketing hub. Open a row to see tickers and edit SEO.
      </p>
    </>
  );

  const listTable = (
    <DataTable>
      <TableHeader>
        <TableRow>
          <TableHead>Released</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[1%] text-right">Public</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {releases.map((r) => (
          <TableRow
            key={r.id}
            tabIndex={0}
            role="button"
            onClick={() => openRow(r.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openRow(r.id);
              }
            }}
            className="cursor-pointer hover:bg-muted/50"
          >
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatMarketingDate(r.published_at)}
            </TableCell>
            <TableCell className="font-medium">{r.title || "—"}</TableCell>
            <TableCell className="font-mono text-sm">{r.slug}</TableCell>
            <TableCell>
              {r.is_current ? (
                <span className="rounded-md bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                  Current
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Past</span>
              )}
            </TableCell>
            <TableCell
              className="text-right"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    absolutePublicMarketingUrl(marketingReleasePath(r.slug)),
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                View as public
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );

  const selected = detailRelease;

  const detailPanel = activeDetailId ? (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <SecondaryButton type="button" size="sm" onClick={backToList}>
          ← All releases
        </SecondaryButton>
      </div>

      {detailPhase === "loading" && !selected ? (
        <LoadingSkeleton variant="card" lines={5} className="py-6" />
      ) : selected ? (
          <>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {selected.title || selected.slug}
              </h3>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono text-foreground">{selected.slug}</span>
                <span className="mx-2">·</span>
                Released {formatMarketingDate(selected.published_at)} · as of{" "}
                {formatMarketingDate(selected.as_of)}
              </p>
              <button
                type="button"
                onClick={() => {
                  window.open(
                    absolutePublicMarketingUrl(marketingReleasePath(selected.slug)),
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                className="mt-1 text-sm text-primary underline-offset-2 hover:underline"
              >
                Open public release page
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Tickers in this release</h4>
              {detailRows.length === 0 ? (
                <EmptyState
                  title="No ticker rows"
                  description={
                    <>
                      This release has no line items yet. Populate them with{" "}
                      <span className="font-mono text-foreground break-all">
                        PUT /admin/formula-marketing/releases/:id/rows
                      </span>{" "}
                      with a body like <span className="font-mono">{"{ \"rows\": [ … ] }"}</span>.
                    </>
                  }
                />
              ) : (
                <FormulaMarketingReleaseTickerTable rows={detailRows} />
              )}
            </div>

            <div className="space-y-4 rounded-xl border border-border/80 bg-muted/15 p-4">
              <p className="text-sm font-medium text-foreground">SEO (this release)</p>

              <div className="space-y-2">
                <FormLabel htmlFor={`${id}-seo-title`}>SEO title</FormLabel>
                <FormInput
                  id={`${id}-seo-title`}
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Optional — overrides the release title in meta tags"
                  autoComplete="off"
                />
                <FormHelperText>
                  If empty, the public site can fall back to the release name or title.
                </FormHelperText>
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor={`${id}-seo-desc`}>SEO description</FormLabel>
                <textarea
                  id={`${id}-seo-desc`}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={3}
                  className={cn(
                    "flex min-h-20 w-full max-w-2xl resize-y rounded-xl border border-input bg-background px-3 py-2",
                    "text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground",
                    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  )}
                  placeholder="Optional — search / social description"
                />
                <FormHelperText>
                  If empty, the public site can fall back to name or title and the release hero image
                  file.
                </FormHelperText>
              </div>

              <div className="space-y-2 rounded-lg border border-border/60 bg-background/50 p-3">
                <div>
                  <FormLabel className="text-foreground">SEO OG image</FormLabel>
                  <p className="mt-1 text-xs text-muted-foreground">
                    If empty, the public site can fall back to name or title and the release hero
                    image file.
                  </p>
                </div>
                <input
                  ref={ogFileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  id={`${id}-seo-og-file`}
                  aria-label="Choose SEO Open Graph image"
                  onChange={onOgFileChange}
                />
                {selected.seo_og_image_url && !ogSelectedFile ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Current</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin API URLs */}
                      <img
                        src={selected.seo_og_image_url}
                        alt=""
                        className="h-24 max-w-full rounded-lg border border-border object-contain"
                      />
                      <a
                        href={selected.seo_og_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary underline-offset-2 hover:underline break-all"
                      >
                        Open image URL
                      </a>
                    </div>
                  </div>
                ) : !selected.seo_og_image_url && !ogSelectedFile ? (
                  <p className="text-sm text-muted-foreground">No OG image set for this release.</p>
                ) : null}
                {ogSelectedFile && ogPreviewUrl ? (
                  <p className="text-sm text-foreground">
                    {ogSelectedFile.name} ({(ogSelectedFile.size / 1024).toFixed(0)} KB)
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <SecondaryButton
                    type="button"
                    disabled={ogAction !== "idle"}
                    onClick={() => ogFileRef.current?.click()}
                  >
                    {selected.seo_og_image_url || ogSelectedFile ? "Replace image…" : "Choose image…"}
                  </SecondaryButton>
                  {ogSelectedFile ? (
                    <>
                      <PrimaryButton
                        type="button"
                        disabled={ogAction !== "idle" || !ogSelectedFile}
                        onClick={() => void onUploadOg()}
                      >
                        {ogAction === "upload" ? "Uploading…" : "Upload OG image"}
                      </PrimaryButton>
                      <SecondaryButton type="button" disabled={ogAction !== "idle"} onClick={clearOgPick}>
                        Clear selection
                      </SecondaryButton>
                    </>
                  ) : null}
                  {selected.seo_og_image_url && !ogSelectedFile ? (
                    <SecondaryButton
                      type="button"
                      disabled={ogAction !== "idle"}
                      onClick={() => void onRemoveOg()}
                    >
                      {ogAction === "delete" ? "Removing…" : "Remove OG image"}
                    </SecondaryButton>
                  ) : null}
                </div>
                <FormHelperText>Max {MAX_SEO_OG_BYTES / (1024 * 1024)}MB. Common image types.</FormHelperText>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <PrimaryButton
                  type="button"
                  onClick={() => void onSaveSeo()}
                  disabled={savingSeo || !activeDetailId}
                >
                  {savingSeo ? "Saving…" : "Save SEO text"}
                </PrimaryButton>
                <SecondaryButton type="button" disabled={savingSeo} onClick={() => void reloadListAndDetail()}>
                  Reload
                </SecondaryButton>
              </div>
            </div>
          </>
        ) : null}
    </div>
  ) : null;

  if (embedded) {
    return (
      <div className="space-y-4">
        {intro}
        {activeDetailId ? (
          detailPanel
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Releases</p>
            {listTable}
          </div>
        )}
      </div>
    );
  }

  return (
    <FormSection className="space-y-4">
      {intro}
      {activeDetailId ? (
        detailPanel
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Releases</p>
          {listTable}
        </div>
      )}
    </FormSection>
  );
}
