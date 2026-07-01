"use client";

import { Badge } from "@/components/ui/badge";
import { SecondaryButton } from "@/components/ui-kit/buttons";
import type { SocialRenderTemplateDetail } from "@/lib/api";
import { ROLE_BADGE_VARIANT } from "./prompt-script-meta";

type PromptsScriptDetailSheetProps = {
  detail: SocialRenderTemplateDetail | null;
  loading: boolean;
  onClose: () => void;
};

export function PromptsScriptDetailSheet({
  detail,
  loading,
  onClose,
}: PromptsScriptDetailSheetProps) {
  if (!detail && !loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {detail?.display_name ?? "Loading…"}
            </h3>
            <p className="font-mono text-xs text-muted-foreground">{detail?.template_key}</p>
          </div>
          <SecondaryButton type="button" onClick={onClose}>
            Close
          </SecondaryButton>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading bundle…</p>
          ) : detail ? (
            <div className="space-y-4">
              {detail.description ? (
                <p className="text-sm text-muted-foreground">{detail.description}</p>
              ) : null}
              <div>
                <h4 className="text-sm font-medium text-foreground">Resolved prompts</h4>
                <ul className="mt-2 space-y-3">
                  {(detail.resolved_prompts ?? []).map((p) => (
                    <li key={p.template_key} className="rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs">{p.template_key}</span>
                        <Badge variant={ROLE_BADGE_VARIANT[p.prompt_role] ?? "outline"}>
                          {p.prompt_role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{p.channel}</span>
                      </div>
                      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                        {p.template_text.slice(0, 400)}
                        {p.template_text.length > 400 ? "…" : ""}
                      </pre>
                    </li>
                  ))}
                </ul>
              </div>
              {detail.slot_links?.length ? (
                <div>
                  <h4 className="text-sm font-medium text-foreground">Slots</h4>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {detail.slot_links.map((link) => (
                      <li key={`${link.slot}-${link.sort_order}`}>
                        {link.sort_order}. {link.slot} →{" "}
                        {link.social_prompt_templates?.template_key ?? "—"}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
