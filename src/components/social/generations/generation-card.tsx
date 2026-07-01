"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  ImageIcon,
  Link2,
  MessageSquare,
  MoreHorizontal,
  PenLine,
  Sparkles,
  Video,
} from "lucide-react";
import type { SocialPromptGenerationRow, WoopMediaItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GhostButton, PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { formatSocialAbsolute, formatSocialRelative, SOCIAL_PLATFORMS } from "../social-platform-ui";
import { cn } from "@/lib/utils";
import { KIND_META, STATUS_META } from "./generation-utils";

const WOOP_DASHBOARD_URL = "https://app.woopsocial.com";

const KIND_ICONS = {
  caption: MessageSquare,
  image_prompt: ImageIcon,
  video_script: Video,
} as const;

type GenerationCardProps = {
  row: SocialPromptGenerationRow;
  linkedMedia: WoopMediaItem | null;
  composeUrl: string;
  generating: boolean;
  onCopy: (text: string) => void;
  onView: (row: SocialPromptGenerationRow) => void;
  onGenerateImage: (row: SocialPromptGenerationRow) => void;
  onLinkMedia: (id: string) => void;
};

export function GenerationCard({
  row,
  linkedMedia,
  composeUrl,
  generating,
  onCopy,
  onView,
  onGenerateImage,
  onLinkMedia,
}: GenerationCardProps) {
  const KindIcon = KIND_ICONS[row.generation_kind];
  const kindMeta = KIND_META[row.generation_kind];
  const statusMeta = STATUS_META[row.status];
  const platform = SOCIAL_PLATFORMS.find((p) => p.id === row.platform);
  const PlatformIcon = platform?.Icon;
  const relative = formatSocialRelative(row.created_at);
  const thumb = linkedMedia?.thumbnailUrl ?? linkedMedia?.url;

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/25">
      <div className="flex gap-4">
        {thumb ? (
          <button
            type="button"
            onClick={() => onView(row)}
            className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
          >
            <Image
              src={thumb}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </button>
        ) : row.generation_kind === "image_prompt" ? (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-muted/50">
            <ImageIcon className="size-6 text-muted-foreground/60" />
          </div>
        ) : null}

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <KindIcon className="size-3" />
                {kindMeta.label}
              </Badge>
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                  statusMeta.className
                )}
              >
                {statusMeta.label}
              </span>
              {row.provider === "gemini" ? (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="size-3" />
                  Gemini
                </Badge>
              ) : null}
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <time dateTime={row.created_at} title={formatSocialAbsolute(row.created_at)}>
                {relative ?? formatSocialAbsolute(row.created_at)}
              </time>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {platform && PlatformIcon ? (
              <span className={cn("inline-flex items-center gap-1", platform.brandColorClass)}>
                <PlatformIcon className="size-3.5" />
                {platform.label}
              </span>
            ) : row.platform ? (
              <span>{row.platform}</span>
            ) : null}
            {row.render_template_key ? (
              <span className="font-mono">{row.render_template_key}</span>
            ) : null}
            {row.woop_media_id ? (
              <span className="font-mono text-[10px]">media:{row.woop_media_id.slice(-8)}</span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onView(row)}
            className="block w-full text-left"
          >
            <p className="line-clamp-3 text-sm leading-relaxed text-foreground/90">
              {row.output_text}
            </p>
            <span className="mt-1 inline-block text-xs font-medium text-primary">
              View full text
            </span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <SecondaryButton type="button" size="sm" onClick={() => onCopy(row.output_text)}>
              <Copy className="size-3.5" />
              Copy
            </SecondaryButton>
            <Link href={composeUrl}>
              <SecondaryButton type="button" size="sm">
                <PenLine className="size-3.5" />
                Compose
              </SecondaryButton>
            </Link>

            {row.generation_kind === "image_prompt" ? (
              <>
                <PrimaryButton
                  type="button"
                  size="sm"
                  disabled={generating}
                  onClick={() => onGenerateImage(row)}
                >
                  <Sparkles className="size-3.5" />
                  {generating ? "Generating…" : "Gemini image"}
                </PrimaryButton>
                <GhostButton type="button" size="sm" onClick={() => onLinkMedia(row.id)}>
                  <Link2 className="size-3.5" />
                  Link media
                </GhostButton>
              </>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <GhostButton type="button" size="sm" aria-label="More actions">
                  <MoreHorizontal className="size-4" />
                </GhostButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(row)}>View details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy(row.output_text)}>Copy text</DropdownMenuItem>
                {row.generation_kind === "image_prompt" ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onLinkMedia(row.id)}>
                      Link Woop media
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={WOOP_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3.5" />
                        Woop dashboard
                      </a>
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </article>
  );
}
