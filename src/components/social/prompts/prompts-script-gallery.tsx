"use client";

import { SectionCard } from "@/components/ui-kit/cards";
import type { SocialRenderTemplateRow } from "@/lib/api";
import { RenderScriptGallery } from "./render-script-gallery";

type PromptsScriptGalleryProps = {
  scripts: SocialRenderTemplateRow[];
  selectedKey: string;
  onSelect: (key: string) => void;
  onViewDetail: (key: string) => void;
};

export function PromptsScriptGallery({
  scripts,
  selectedKey,
  onSelect,
  onViewDetail,
}: PromptsScriptGalleryProps) {
  return (
    <SectionCard>
      <h3 className="text-base font-semibold text-foreground">Render scripts</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Select the default bundle for preview, Compose, and stock-page publish.
      </p>
      <div className="mt-4">
        <RenderScriptGallery
          scripts={scripts}
          selectedKey={selectedKey}
          onSelect={onSelect}
          onViewDetail={onViewDetail}
        />
      </div>
    </SectionCard>
  );
}
