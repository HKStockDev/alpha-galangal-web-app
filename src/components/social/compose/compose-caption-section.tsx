"use client";

import Link from "next/link";
import { ArrowDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SecondaryButton } from "@/components/ui-kit/buttons";
import { SectionCard } from "@/components/ui-kit/cards";
import { ADMIN_SOCIAL_PROMPTS } from "@/lib/social-routes";
import { cn } from "@/lib/utils";
import { PLATFORM_CHAR_LIMITS, type SignalContext } from "./compose-types";
import { SOCIAL_PLATFORMS } from "../social-platform-ui";

type ComposeCaptionSectionProps = {
  platform: string;
  context: SignalContext;
  caption: string;
  resolvedKeys: string[];
  onContextChange: (context: SignalContext) => void;
  onCaptionChange: (caption: string) => void;
  onGenerate: () => void;
  generating: boolean;
};

export function ComposeCaptionSection({
  platform,
  context,
  caption,
  resolvedKeys,
  onContextChange,
  onCaptionChange,
  onGenerate,
  generating,
}: ComposeCaptionSectionProps) {
  const update = (patch: Partial<SignalContext>) =>
    onContextChange({ ...context, ...patch });

  const limit = PLATFORM_CHAR_LIMITS[platform] ?? 5000;
  const count = caption.length;
  const overLimit = count > limit;
  const nearLimit = count > limit * 0.9;
  const platformMeta = SOCIAL_PLATFORMS.find((p) => p.id === platform);
  const PlatformIcon = platformMeta?.Icon;

  return (
    <SectionCard className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">Post caption</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Signal inputs feed your{" "}
          <Link href={ADMIN_SOCIAL_PROMPTS} className="text-primary underline">
            prompt templates
          </Link>
          . Only the <strong className="font-medium text-foreground">caption below</strong> is sent
          when you publish.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StepBadge n={1} />
          <h4 className="text-sm font-semibold text-foreground">Signal inputs</h4>
          <Badge variant="secondary">Prompt variables only</Badge>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Ticker, summary, and URL are merged into prompts — they are not posted directly to{" "}
          {platformMeta?.label ?? platform}.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-muted-foreground">Ticker</span>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              value={context.ticker}
              onChange={(e) => update({ ticker: e.target.value.toUpperCase() })}
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Signal name</span>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              value={context.signal_name}
              onChange={(e) => update({ signal_name: e.target.value })}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-muted-foreground">Page URL</span>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
              value={context.page_url}
              onChange={(e) => update({ page_url: e.target.value })}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-muted-foreground">Summary</span>
            <textarea
              className="mt-1 min-h-[72px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={context.summary}
              onChange={(e) => update({ summary: e.target.value })}
            />
          </label>
        </div>

        <SecondaryButton
          type="button"
          className="mt-4"
          disabled={generating}
          onClick={onGenerate}
        >
          <Sparkles className="size-4" />
          {generating ? "Generating…" : "Generate caption from prompts"}
        </SecondaryButton>
      </div>

      <div className="flex justify-center text-muted-foreground" aria-hidden>
        <ArrowDown className="size-5" />
      </div>

      <div className="rounded-xl border-2 border-primary/25 bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StepBadge n={2} primary />
          <h4 className="text-sm font-semibold text-foreground">Caption to publish</h4>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            Sent to {platformMeta?.label ?? platform}
          </Badge>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Edit this text before publishing. This is the post body Woop delivers to the network.
        </p>

        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
          <div className="mb-2 flex items-center gap-2">
            {PlatformIcon ? (
              <PlatformIcon className={cn("size-4", platformMeta?.brandColorClass)} />
            ) : null}
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {platformMeta?.label ?? platform}
            </span>
          </div>
          <textarea
            className="min-h-[160px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed"
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Generate a caption above, or write your own post text here…"
          />
          {context.page_url ? (
            <p className="mt-2 truncate text-xs text-primary">{context.page_url}</p>
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
          {!caption.trim() ? (
            <span className="text-muted-foreground">Required before publish</span>
          ) : null}
        </div>

        {resolvedKeys.length ? (
          <div className="mt-4 border-t border-border pt-4">
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
      </div>
    </SectionCard>
  );
}

function StepBadge({ n, primary }: { n: number; primary?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
        primary ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      {n}
    </span>
  );
}
