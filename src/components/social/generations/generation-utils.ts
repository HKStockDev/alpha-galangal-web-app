import type { SocialPromptGenerationRow } from "@/lib/api";

export type GenerationKind = SocialPromptGenerationRow["generation_kind"];
export type GenerationStatus = SocialPromptGenerationRow["status"];

export const KIND_META: Record<
  GenerationKind,
  { label: string; description: string }
> = {
  caption: { label: "Caption", description: "Post caption text" },
  image_prompt: { label: "Image prompt", description: "Signal card image prompt" },
  video_script: { label: "Video script", description: "Short-form video script" },
};

export const STATUS_META: Record<
  GenerationStatus,
  { label: string; className: string }
> = {
  text_only: {
    label: "Text only",
    className: "bg-muted text-muted-foreground border-border",
  },
  media_linked: {
    label: "Media linked",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  published: {
    label: "Published",
    className: "bg-positive/15 text-positive-foreground border-positive/30",
  },
};

export type GenerationFilters = {
  search: string;
  kind: string;
  status: string;
  renderScript: string;
};

export function filterGenerations(
  rows: SocialPromptGenerationRow[],
  filters: GenerationFilters
): SocialPromptGenerationRow[] {
  const q = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.kind && row.generation_kind !== filters.kind) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.renderScript && row.render_template_key !== filters.renderScript) return false;
    if (!q) return true;
    const haystack = [
      row.output_text,
      row.render_template_key,
      row.platform,
      row.woop_media_id,
      row.generation_kind,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function uniqueRenderScripts(rows: SocialPromptGenerationRow[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    if (row.render_template_key) keys.add(row.render_template_key);
  }
  return [...keys].sort();
}

export function generationSummary(rows: SocialPromptGenerationRow[]) {
  return {
    total: rows.length,
    captions: rows.filter((r) => r.generation_kind === "caption").length,
    imagePrompts: rows.filter((r) => r.generation_kind === "image_prompt").length,
    videoScripts: rows.filter((r) => r.generation_kind === "video_script").length,
    withMedia: rows.filter((r) => Boolean(r.woop_media_id)).length,
  };
}
