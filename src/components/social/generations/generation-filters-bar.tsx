"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GhostButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { cn } from "@/lib/utils";
import { KIND_META, type GenerationFilters } from "./generation-utils";

const KIND_OPTIONS = [
  { value: "", label: "All kinds" },
  { value: "caption", label: KIND_META.caption.label },
  { value: "image_prompt", label: KIND_META.image_prompt.label },
  { value: "video_script", label: KIND_META.video_script.label },
] as const;

type GenerationFiltersBarProps = {
  filters: GenerationFilters;
  renderScripts: string[];
  resultCount: number;
  onChange: (patch: Partial<GenerationFilters>) => void;
  onRefresh: () => void;
  onClear: () => void;
};

export function GenerationFiltersBar({
  filters,
  renderScripts,
  resultCount,
  onChange,
  onRefresh,
  onClear,
}: GenerationFiltersBarProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.kind) ||
    Boolean(filters.status) ||
    Boolean(filters.renderScript);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search text, script, platform, media ID…"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="rounded-xl pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <SecondaryButton type="button" size="sm" onClick={onRefresh}>
            Refresh
          </SecondaryButton>
          {hasActiveFilters ? (
            <GhostButton type="button" size="sm" onClick={onClear}>
              <X className="size-3.5" />
              Clear filters
            </GhostButton>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {KIND_OPTIONS.map((opt) => (
          <button
            key={opt.value || "all"}
            type="button"
            onClick={() => onChange({ kind: opt.value })}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              filters.kind === opt.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2 text-muted-foreground">
          Status
          <select
            className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value })}
          >
            <option value="">Any</option>
            <option value="text_only">Text only</option>
            <option value="media_linked">Media linked</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-muted-foreground">
          Render script
          <select
            className="max-w-[200px] rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
            value={filters.renderScript}
            onChange={(e) => onChange({ renderScript: e.target.value })}
          >
            <option value="">Any</option>
            {renderScripts.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-xs text-muted-foreground">
          {resultCount} {resultCount === 1 ? "result" : "results"}
        </span>
      </div>
    </div>
  );
}
