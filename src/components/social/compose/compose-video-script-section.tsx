"use client";

import { SecondaryButton } from "@/components/ui-kit/buttons";
import { SectionCard } from "@/components/ui-kit/cards";
import { RENDER_SCRIPT_META } from "../prompts/prompt-script-meta";

type ComposeVideoScriptSectionProps = {
  selectedRenderKey: string;
  videoScript: string;
  onVideoScriptChange: (value: string) => void;
  generatingScript: boolean;
  onGenerateVideoScript: () => void;
};

export function ComposeVideoScriptSection({
  selectedRenderKey,
  videoScript,
  onVideoScriptChange,
  generatingScript,
  onGenerateVideoScript,
}: ComposeVideoScriptSectionProps) {
  const caps = RENDER_SCRIPT_META[selectedRenderKey]?.capabilities;
  if (!caps?.videoScript) return null;

  return (
    <SectionCard>
      <h3 className="text-base font-semibold text-foreground">Video script</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Generate a short on-camera script, then upload your video file in the media picker below.
      </p>
      <SecondaryButton
        type="button"
        className="mt-4"
        disabled={generatingScript}
        onClick={onGenerateVideoScript}
      >
        {generatingScript ? "Generating script…" : "Generate video script"}
      </SecondaryButton>
      <label className="mt-4 block text-sm">
        <span className="text-muted-foreground">Script (editable)</span>
        <textarea
          className="mt-1 min-h-[140px] w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
          placeholder="Generate a script or write your own."
          value={videoScript}
          onChange={(e) => onVideoScriptChange(e.target.value)}
        />
      </label>
    </SectionCard>
  );
}
