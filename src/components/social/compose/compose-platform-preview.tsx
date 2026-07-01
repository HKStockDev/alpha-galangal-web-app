"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui-kit/cards";
import { cn } from "@/lib/utils";
import { SOCIAL_PLATFORMS } from "../social-platform-ui";

type ComposePlatformPreviewProps = {
  platform: string;
  caption: string;
  linkUrl: string;
  selectedMediaCount: number;
  mediaThumbUrl?: string | null;
};

export function ComposePlatformPreview({
  platform,
  caption,
  linkUrl,
  selectedMediaCount,
  mediaThumbUrl,
}: ComposePlatformPreviewProps) {
  const platformMeta = SOCIAL_PLATFORMS.find((p) => p.id === platform);
  const PlatformIcon = platformMeta?.Icon;
  const hasCaption = Boolean(caption.trim());

  return (
    <SectionCard>
      <h3 className="text-base font-semibold text-foreground">Live preview</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Read-only snapshot of how the post may appear. Edit the caption in{" "}
        <span className="font-medium text-foreground">Caption to publish</span> on the left.
      </p>

      <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
        <div className="mb-3 flex items-center gap-2">
          {PlatformIcon ? (
            <PlatformIcon className={cn("size-4", platformMeta?.brandColorClass)} />
          ) : null}
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {platformMeta?.label ?? platform}
          </span>
          {selectedMediaCount > 0 ? (
            <Badge variant="secondary" className="ml-auto">
              {selectedMediaCount} media
            </Badge>
          ) : null}
        </div>

        {mediaThumbUrl ? (
          <div className="relative mb-3 aspect-video overflow-hidden rounded-lg border border-border bg-muted">
            <Image src={mediaThumbUrl} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : null}

        {hasCaption ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{caption}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            Your caption will appear here after you generate or write it.
          </p>
        )}

        {linkUrl ? (
          <p className="mt-3 truncate text-xs text-primary">{linkUrl}</p>
        ) : null}
      </div>
    </SectionCard>
  );
}
