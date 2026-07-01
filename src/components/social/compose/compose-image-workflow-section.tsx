"use client";

import Link from "next/link";
import { GhostButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { SectionCard } from "@/components/ui-kit/cards";
import { ADMIN_SOCIAL_MEDIA } from "@/lib/social-routes";
import type { WoopMediaItem } from "@/lib/api";
import { RENDER_SCRIPT_META } from "../prompts/prompt-script-meta";
import { WoopMediaGrid } from "../woop-media-grid";

const WOOP_DASHBOARD_URL = "https://app.woopsocial.com";

type ComposeImageWorkflowSectionProps = {
  selectedRenderKey: string;
  imagePromptText: string;
  loadingPrompt: boolean;
  onResolvePrompt: () => void;
  onCopyPrompt: () => void;
  generatingImage: boolean;
  generatedImageMediaId: string | null;
  onGenerateWithGemini: () => void;
  mediaItems: WoopMediaItem[];
  selectedMediaIds: string[];
  onToggleMedia: (id: string) => void;
  onRefreshMedia: () => void;
};

export function ComposeImageWorkflowSection({
  selectedRenderKey,
  imagePromptText,
  loadingPrompt,
  onResolvePrompt,
  onCopyPrompt,
  generatingImage,
  generatedImageMediaId,
  onGenerateWithGemini,
  mediaItems,
  selectedMediaIds,
  onToggleMedia,
  onRefreshMedia,
}: ComposeImageWorkflowSectionProps) {
  const caps = RENDER_SCRIPT_META[selectedRenderKey]?.capabilities;
  if (!caps?.image) return null;

  return (
    <SectionCard>
      <h3 className="text-base font-semibold text-foreground">Signal card image</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a visual for this post. Woop does not expose image generation via API — use Gemini
        here or create the image in the Woop dashboard, then attach it from the library.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">Step 1 — Image prompt</span>
            <div className="flex gap-2">
              <GhostButton type="button" size="sm" onClick={onResolvePrompt} disabled={loadingPrompt}>
                {loadingPrompt ? "Resolving…" : "Resolve prompt"}
              </GhostButton>
              <GhostButton
                type="button"
                size="sm"
                onClick={onCopyPrompt}
                disabled={!imagePromptText.trim()}
              >
                Copy prompt
              </GhostButton>
            </div>
          </div>
          <textarea
            readOnly
            className="mt-2 min-h-[120px] w-full rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm"
            value={imagePromptText}
            placeholder="Click Resolve prompt to build the image prompt from your render script and signal context."
          />
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium text-foreground">Step 2 — Create the image</p>
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Path A — In Conviction
              </p>
              <SecondaryButton
                type="button"
                className="mt-2"
                disabled={generatingImage || !imagePromptText.trim()}
                onClick={onGenerateWithGemini}
              >
                {generatingImage ? "Generating with Gemini…" : "Generate with Gemini (in Conviction)"}
              </SecondaryButton>
              {generatedImageMediaId ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Uploaded to Woop and selected — media ID{" "}
                  <span className="font-mono">{generatedImageMediaId}</span>
                </p>
              ) : null}
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Path B — Woop dashboard
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Copy the prompt above, open the Woop dashboard, generate or upload your image there,
                then return here and refresh the library in Step 3.
              </p>
              <a
                href={WOOP_DASHBOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-primary underline"
              >
                Open Woop dashboard
              </a>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">Step 3 — Attach from Woop library</span>
            <div className="flex gap-2">
              <GhostButton type="button" size="sm" onClick={onRefreshMedia}>
                Refresh library
              </GhostButton>
              <Link href={ADMIN_SOCIAL_MEDIA} className="text-sm text-primary underline">
                Full media page
              </Link>
            </div>
          </div>
          <div className="mt-2">
            <WoopMediaGrid
              items={mediaItems.filter((m) => !/video/i.test(m.mediaType))}
              selectedIds={selectedMediaIds}
              onToggle={onToggleMedia}
              selectable
              showMeta
              emptyMessage="No images in Woop library yet. Use Path A or upload via the Woop dashboard."
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
