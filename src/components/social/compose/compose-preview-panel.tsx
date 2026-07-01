"use client";

import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui-kit/cards";
import { cn } from "@/lib/utils";
import { PLATFORM_CHAR_LIMITS } from "./compose-types";
import { SOCIAL_PLATFORMS } from "../social-platform-ui";

type ComposePreviewPanelProps = {
  platform: string;
  caption: string;
  onCaptionChange: (caption: string) => void;
  resolvedKeys: string[];
  linkUrl: string;
  selectedMediaCount: number;
};

export function ComposePreviewPanel({
  platform,
  caption,
  onCaptionChange,
  resolvedKeys,
  linkUrl,
  selectedMediaCount,
}: ComposePreviewPanelProps) {
  const limit = PLATFORM_CHAR_LIMITS[platform] ?? 5000;
  const count = caption.length;
  const overLimit = count > limit;
  const nearLimit = count > limit * 0.9;
  const platformMeta = SOCIAL_PLATFORMS.find((p) => p.id === platform);
  const PlatformIcon = platformMeta?.Icon;

  return (
    <SectionCard>
      <h3 className="text-base font-semibold text-foreground">Review caption</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Final check before validate and publish. This is the exact text sent to{" "}
        {platformMeta?.label ?? platform}.
      </p>

      <div className="mt-4 rounded-xl border-2 border-primary/20 bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          {PlatformIcon ? (
            <PlatformIcon className={cn("size-4", platformMeta?.brandColorClass)} />
          ) : null}
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {platformMeta?.label ?? platform}
          </span>
          <Badge className="ml-auto bg-primary/10 text-primary hover:bg-primary/10">
            Publishes this text
          </Badge>
          {selectedMediaCount > 0 ? (
            <Badge variant="secondary">{selectedMediaCount} media</Badge>
          ) : null}
        </div>
        <textarea
          className="min-h-[180px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Caption is required…"
        />
        {linkUrl ? (
          <p className="mt-2 truncate text-xs text-primary">{linkUrl}</p>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span
          className={cn(
            nearLimit && !overLimit && "text-amber-600",
            overLimit && "text-destructive"
          )}
        >
          {count} / {limit} characters
        </span>
      </div>

      {resolvedKeys.length ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">Merged prompt layers</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {resolvedKeys.map((key) => (
              <Badge key={key} variant="outline" className="text-[10px]">
                {key}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}
