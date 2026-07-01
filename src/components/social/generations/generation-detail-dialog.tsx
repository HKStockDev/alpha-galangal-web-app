"use client";

import Link from "next/link";
import { Copy, ExternalLink, Link2, PenLine, Sparkles } from "lucide-react";
import type { SocialPromptGenerationRow } from "@/lib/api";
import { ADMIN_SOCIAL_COMPOSE } from "@/lib/social-routes";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GhostButton, PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { formatSocialAbsolute } from "../social-platform-ui";
import { KIND_META, STATUS_META } from "./generation-utils";

const WOOP_DASHBOARD_URL = "https://app.woopsocial.com";

type GenerationDetailDialogProps = {
  row: SocialPromptGenerationRow | null;
  open: boolean;
  generating: boolean;
  onOpenChange: (open: boolean) => void;
  onCopy: (text: string) => void;
  onGenerateImage: (row: SocialPromptGenerationRow) => void;
  onLinkMedia: (id: string) => void;
};

export function GenerationDetailDialog({
  row,
  open,
  generating,
  onOpenChange,
  onCopy,
  onGenerateImage,
  onLinkMedia,
}: GenerationDetailDialogProps) {
  if (!row) return null;

  const kindMeta = KIND_META[row.generation_kind];
  const statusMeta = STATUS_META[row.status];
  const composeUrl = `${ADMIN_SOCIAL_COMPOSE}?generationId=${encodeURIComponent(row.id)}`;
  const contextEntries = Object.entries(row.context ?? {}).filter(
    ([, v]) => v != null && String(v).trim() !== ""
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {kindMeta.label}
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusMeta.className}`}
            >
              {statusMeta.label}
            </span>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1 text-left text-xs">
              <div>{formatSocialAbsolute(row.created_at)}</div>
              {row.render_template_key ? (
                <div className="font-mono">{row.render_template_key}</div>
              ) : null}
              {row.platform ? <div className="capitalize">{row.platform}</div> : null}
              {row.woop_media_id ? (
                <div className="font-mono">Woop media: {row.woop_media_id}</div>
              ) : null}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium text-foreground">Generated text</h4>
            <pre className="max-h-64 overflow-auto rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {row.output_text}
            </pre>
          </div>

          {contextEntries.length ? (
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">Context</h4>
              <dl className="grid gap-2 rounded-xl border border-border p-3 text-sm">
                {contextEntries.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[minmax(0,8rem)_1fr] gap-2">
                    <dt className="font-mono text-xs text-muted-foreground">{key}</dt>
                    <dd className="text-foreground">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {row.resolved_prompt_keys.length ? (
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">Prompt keys</h4>
              <div className="flex flex-wrap gap-1.5">
                {row.resolved_prompt_keys.map((key) => (
                  <Badge key={key} variant="outline" className="font-mono text-[10px]">
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-start">
          <SecondaryButton type="button" size="sm" onClick={() => onCopy(row.output_text)}>
            <Copy className="size-3.5" />
            Copy text
          </SecondaryButton>
          <Link href={composeUrl}>
            <SecondaryButton type="button" size="sm">
              <PenLine className="size-3.5" />
              Open in Compose
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
                {generating ? "Generating…" : "Generate with Gemini"}
              </PrimaryButton>
              <GhostButton type="button" size="sm" onClick={() => onLinkMedia(row.id)}>
                <Link2 className="size-3.5" />
                Link Woop media
              </GhostButton>
              <GhostButton type="button" size="sm" asChild>
                <a href={WOOP_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                  Woop dashboard
                </a>
              </GhostButton>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
