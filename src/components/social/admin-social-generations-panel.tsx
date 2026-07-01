"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  generateSocialPromptMedia,
  linkSocialPromptGenerationMedia,
  listSocialPromptGenerations,
  listWoopMedia,
  type SocialPromptGenerationRow,
  type WoopMediaItem,
} from "@/lib/api";
import { ADMIN_SOCIAL_COMPOSE } from "@/lib/social-routes";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { SectionCard } from "@/components/ui-kit/cards";
import { GenerationCard } from "./generations/generation-card";
import { GenerationDetailDialog } from "./generations/generation-detail-dialog";
import { GenerationEmptyState } from "./generations/generation-empty-state";
import { GenerationFiltersBar } from "./generations/generation-filters-bar";
import { GenerationLinkMediaDialog } from "./generations/generation-link-media-dialog";
import { GenerationNewCta } from "./generations/generation-new-cta";
import { GenerationSummary } from "./generations/generation-summary";
import {
  filterGenerations,
  generationSummary,
  uniqueRenderScripts,
  type GenerationFilters,
} from "./generations/generation-utils";

const DEFAULT_FILTERS: GenerationFilters = {
  search: "",
  kind: "",
  status: "",
  renderScript: "",
};

export function AdminSocialGenerationsPanel() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();

  const [rows, setRows] = useState<SocialPromptGenerationRow[]>([]);
  const [woopMedia, setWoopMedia] = useState<WoopMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [filters, setFilters] = useState<GenerationFilters>(DEFAULT_FILTERS);
  const [detailRow, setDetailRow] = useState<SocialPromptGenerationRow | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const loadGenerations = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setRows(await listSocialPromptGenerations(accessToken, { limit: "100" }));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load generations");
    } finally {
      setLoading(false);
    }
  }, [accessToken, showError]);

  const loadWoopMedia = useCallback(async () => {
    if (!accessToken) return;
    setMediaLoading(true);
    try {
      setWoopMedia(await listWoopMedia(accessToken));
    } catch {
      // Thumbnails are optional; don't block the page.
    } finally {
      setMediaLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadGenerations();
    void loadWoopMedia();
  }, [loadGenerations, loadWoopMedia]);

  const mediaById = useMemo(() => {
    const map = new Map<string, WoopMediaItem>();
    for (const item of woopMedia) map.set(item.id, item);
    return map;
  }, [woopMedia]);

  const renderScripts = useMemo(() => uniqueRenderScripts(rows), [rows]);
  const filteredRows = useMemo(() => filterGenerations(rows, filters), [rows, filters]);
  const stats = useMemo(() => generationSummary(filteredRows), [filteredRows]);

  const updateFilters = (patch: Partial<GenerationFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const openLinkModal = async (id: string) => {
    setDetailRow(null);
    setLinkingId(id);
    setSelectedMediaId("");
    if (!woopMedia.length) {
      await loadWoopMedia();
    }
  };

  const confirmLink = async () => {
    if (!accessToken || !linkingId || !selectedMediaId) return;
    try {
      await linkSocialPromptGenerationMedia(accessToken, linkingId, selectedMediaId);
      showSuccess("Woop media linked.");
      setLinkingId(null);
      setSelectedMediaId("");
      await Promise.all([loadGenerations(), loadWoopMedia()]);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to link media");
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess("Copied to clipboard.");
    } catch {
      showError("Could not copy to clipboard.");
    }
  };

  const generateGeminiImage = async (row: SocialPromptGenerationRow) => {
    if (!accessToken || row.generation_kind !== "image_prompt") return;
    const ctx = (row.context ?? {}) as Record<string, string>;
    setGeneratingId(row.id);
    try {
      await generateSocialPromptMedia(accessToken, {
        platform: row.platform ?? "linkedin",
        post_kind: row.post_kind ?? "single_image",
        render_template_key: row.render_template_key ?? undefined,
        context: ctx,
        media_kind: "image",
      });
      showSuccess("Image generated with Gemini and uploaded to Woop.");
      await Promise.all([loadGenerations(), loadWoopMedia()]);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Image generation failed");
    } finally {
      setGeneratingId(null);
    }
  };

  const composeUrl = useCallback(
    (row: SocialPromptGenerationRow) =>
      `${ADMIN_SOCIAL_COMPOSE}?generationId=${encodeURIComponent(row.id)}`,
    []
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 pb-8">
        <header>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Generations</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            History of AI-generated captions, image prompts, and video scripts.
          </p>
        </header>
        <GenerationNewCta />
        <LoadingSkeleton variant="card" lines={8} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <header>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Generations</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          History of AI-generated captions, image prompts, and video scripts.
        </p>
      </header>

      <GenerationNewCta />

      <GenerationSummary stats={stats} />

      <SectionCard className="space-y-5">
        <GenerationFiltersBar
          filters={filters}
          renderScripts={renderScripts}
          resultCount={filteredRows.length}
          onChange={updateFilters}
          onRefresh={() => void Promise.all([loadGenerations(), loadWoopMedia()])}
          onClear={() => setFilters(DEFAULT_FILTERS)}
        />

        {rows.length === 0 ? (
          <GenerationEmptyState />
        ) : filteredRows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No generations match your filters. Try clearing filters or adjusting your search.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredRows.map((row) => (
              <GenerationCard
                key={row.id}
                row={row}
                linkedMedia={row.woop_media_id ? mediaById.get(row.woop_media_id) ?? null : null}
                composeUrl={composeUrl(row)}
                generating={generatingId === row.id}
                onCopy={copyText}
                onView={setDetailRow}
                onGenerateImage={generateGeminiImage}
                onLinkMedia={openLinkModal}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <GenerationDetailDialog
        row={detailRow}
        open={detailRow !== null}
        generating={detailRow ? generatingId === detailRow.id : false}
        onOpenChange={(open) => {
          if (!open) setDetailRow(null);
        }}
        onCopy={copyText}
        onGenerateImage={generateGeminiImage}
        onLinkMedia={openLinkModal}
      />

      <GenerationLinkMediaDialog
        open={linkingId !== null}
        items={woopMedia}
        selectedMediaId={selectedMediaId}
        loading={mediaLoading}
        onOpenChange={(open) => {
          if (!open) {
            setLinkingId(null);
            setSelectedMediaId("");
          }
        }}
        onSelect={setSelectedMediaId}
        onConfirm={() => void confirmLink()}
        onRefresh={() => void loadWoopMedia()}
      />
    </div>
  );
}
