"use client";

import { Badge } from "@/components/ui/badge";
import type { SocialRenderTemplateRow } from "@/lib/api";
import { cn } from "@/lib/utils";
import { RENDER_SCRIPT_META } from "./prompt-script-meta";

type RenderScriptGalleryProps = {
  scripts: SocialRenderTemplateRow[];
  selectedKey: string;
  onSelect: (key: string) => void;
  onViewDetail?: (key: string) => void;
  compact?: boolean;
};

export function RenderScriptGallery({
  scripts,
  selectedKey,
  onSelect,
  onViewDetail,
  compact = false,
}: RenderScriptGalleryProps) {
  return (
    <div className={cn("grid gap-4", compact ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
      {scripts.map((rt) => {
        const meta = RENDER_SCRIPT_META[rt.template_key];
        const selected = selectedKey === rt.template_key;
        return (
          <button
            key={rt.template_key}
            type="button"
            onClick={() => onSelect(rt.template_key)}
            className={cn(
              "rounded-xl border p-4 text-left transition",
              meta?.accentClass,
              selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                {meta?.icon ?? "📝"}
              </span>
              <span className="font-medium text-foreground">{rt.display_name}</span>
              {selected ? <Badge variant="default">Selected</Badge> : null}
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{rt.template_key}</p>
            {meta?.useCase ? (
              <p className="mt-2 text-sm text-muted-foreground">{meta.useCase}</p>
            ) : rt.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{rt.description}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1">
              {rt.compatible_post_kinds.map((k) => (
                <Badge key={k} variant="outline" className="text-[10px]">
                  {k}
                </Badge>
              ))}
            </div>
            {meta?.platforms.length ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Platforms: {meta.platforms.join(", ")}
              </p>
            ) : null}
            {onViewDetail ? (
              <span
                role="presentation"
                className="mt-3 inline-block text-xs text-primary underline"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetail(rt.template_key);
                }}
              >
                View bundle
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
