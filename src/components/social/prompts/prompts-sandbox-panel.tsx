"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { SectionCard } from "@/components/ui-kit/cards";
import { previewSocialPromptCaption } from "@/lib/api";
import { ADMIN_SOCIAL_COMPOSE } from "@/lib/social-routes";
import { cn } from "@/lib/utils";
import {
  PLATFORM_CHAR_LIMITS,
  SAMPLE_CONTEXT,
} from "./prompt-script-meta";

type SandboxResult = {
  platform: string;
  caption: string;
  resolvedKeys: string[];
};

type PromptsSandboxPanelProps = {
  accessToken: string | null;
  selectedRenderKey: string;
  selectedScriptName: string;
  onError: (msg: string) => void;
};

export function PromptsSandboxPanel({
  accessToken,
  selectedRenderKey,
  selectedScriptName,
  onError,
}: PromptsSandboxPanelProps) {
  const [context, setContext] = useState(SAMPLE_CONTEXT);
  const [postKind, setPostKind] = useState("link_share");
  const [platformA, setPlatformA] = useState("linkedin");
  const [platformB, setPlatformB] = useState("x");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SandboxResult[]>([]);

  const updateContext = (patch: Partial<typeof SAMPLE_CONTEXT>) =>
    setContext((c) => ({ ...c, ...patch }));

  const runCompare = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const platforms = [...new Set([platformA, platformB])];
      const previews = await Promise.all(
        platforms.map(async (platform) => {
          const result = await previewSocialPromptCaption(accessToken, {
            platform,
            post_kind: postKind,
            render_template_key: selectedRenderKey,
            context,
          });
          return {
            platform,
            caption: result.caption,
            resolvedKeys: result.resolved_prompt_keys,
          };
        })
      );
      setResults(previews);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard>
        <h3 className="text-base font-semibold text-foreground">Preview sandbox</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Script: <strong>{selectedScriptName}</strong> ({selectedRenderKey}). Compare captions
          across platforms with editable signal context.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-muted-foreground">Ticker</span>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={context.ticker}
              onChange={(e) => updateContext({ ticker: e.target.value.toUpperCase() })}
            />
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground">Signal name</span>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={context.signal_name}
              onChange={(e) => updateContext({ signal_name: e.target.value })}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-muted-foreground">Page URL</span>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={context.page_url}
              onChange={(e) => updateContext({ page_url: e.target.value })}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-muted-foreground">Summary</span>
            <textarea
              className="mt-1 min-h-[72px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={context.summary}
              onChange={(e) => updateContext({ summary: e.target.value })}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Post kind</span>
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={postKind}
              onChange={(e) => setPostKind(e.target.value)}
            >
              {["link_share", "single_image", "text", "video", "reel"].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Platform A</span>
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={platformA}
              onChange={(e) => setPlatformA(e.target.value)}
            >
              {["linkedin", "facebook", "x", "instagram", "tiktok", "stocktwits"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Platform B</span>
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={platformB}
              onChange={(e) => setPlatformB(e.target.value)}
            >
              {["linkedin", "facebook", "x", "instagram", "tiktok", "stocktwits"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <PrimaryButton type="button" disabled={loading} onClick={() => void runCompare()}>
            {loading ? "Generating…" : "Compare platforms"}
          </PrimaryButton>
          <Link href={ADMIN_SOCIAL_COMPOSE}>
            <SecondaryButton type="button">Open in Compose</SecondaryButton>
          </Link>
        </div>
      </SectionCard>

      {results.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((r) => {
            const limit = PLATFORM_CHAR_LIMITS[r.platform] ?? 5000;
            const over = r.caption.length > limit;
            return (
              <SectionCard key={r.platform}>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium capitalize text-foreground">{r.platform}</h4>
                  <span
                    className={cn(
                      "text-xs",
                      over ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {r.caption.length} / {limit}
                  </span>
                </div>
                <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">
                  {r.caption}
                </pre>
                {r.resolvedKeys.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.resolvedKeys.map((k) => (
                      <Badge key={k} variant="secondary" className="text-[10px]">
                        {k}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </SectionCard>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
