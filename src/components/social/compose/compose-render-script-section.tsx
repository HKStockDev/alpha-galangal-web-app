"use client";

import { SectionCard } from "@/components/ui-kit/cards";
import type { SocialRenderTemplateRow } from "@/lib/api";
import { RenderScriptGallery } from "../prompts/render-script-gallery";

type ComposeRenderScriptSectionProps = {
  renderTemplates: SocialRenderTemplateRow[];
  selectedRenderKey: string;
  onSelectRenderKey: (key: string) => void;
};

export function ComposeRenderScriptSection({
  renderTemplates,
  selectedRenderKey,
  onSelectRenderKey,
}: ComposeRenderScriptSectionProps) {
  return (
    <SectionCard>
      <h3 className="text-base font-semibold text-foreground">Render script</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose the prompt bundle that drives caption and media generation.
      </p>
      <div className="mt-4">
        <RenderScriptGallery
          scripts={renderTemplates}
          selectedKey={selectedRenderKey}
          onSelect={onSelectRenderKey}
          compact
        />
      </div>
    </SectionCard>
  );
}
