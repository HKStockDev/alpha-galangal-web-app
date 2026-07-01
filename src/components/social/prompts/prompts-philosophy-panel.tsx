"use client";

import Link from "next/link";
import { SectionCard } from "@/components/ui-kit/cards";
import { PrimaryButton } from "@/components/ui-kit/buttons";
import { ADMIN_SOCIAL_COMPOSE } from "@/lib/social-routes";
import { ROLE_ORDER } from "./prompt-script-meta";

type PromptsPhilosophyPanelProps = {
  scriptCount: number;
  activePromptCount: number;
  defaultScriptName: string;
  onGoToScripts: () => void;
};

export function PromptsPhilosophyPanel({
  scriptCount,
  activePromptCount,
  defaultScriptName,
  onGoToScripts,
}: PromptsPhilosophyPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <SectionCard className="text-center">
          <p className="text-2xl font-semibold text-foreground">{scriptCount}</p>
          <p className="text-sm text-muted-foreground">Render scripts</p>
        </SectionCard>
        <SectionCard className="text-center">
          <p className="text-2xl font-semibold text-foreground">{activePromptCount}</p>
          <p className="text-sm text-muted-foreground">Active prompts</p>
        </SectionCard>
        <SectionCard className="text-center">
          <p className="truncate text-sm font-medium text-foreground">{defaultScriptName}</p>
          <p className="text-sm text-muted-foreground">Default script</p>
        </SectionCard>
      </div>

      <SectionCard>
        <h3 className="text-base font-semibold text-foreground">Hybrid prompt model</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Conviction composes captions at runtime from layered prompts — not one mega-prompt.
          Each render script bundles slots that merge in order:
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {ROLE_ORDER.filter((r) => r !== "normalizer").map((role, i) => (
            <div key={role} className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium capitalize">
                {role.replace(/_/g, " ")}
              </span>
              {i < 3 ? <span className="hidden text-muted-foreground sm:inline">→</span> : null}
            </div>
          ))}
        </div>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Base</strong> — shared signal context and tone
          </li>
          <li>
            <strong className="text-foreground">Platform overlay</strong> — length, hashtags, voice per channel
          </li>
          <li>
            <strong className="text-foreground">Post-kind overlay</strong> — link share, image, video rules
          </li>
          <li>
            <strong className="text-foreground">Guardrail</strong> — compliance disclaimer always applied
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <PrimaryButton type="button" onClick={onGoToScripts}>
            Choose default script
          </PrimaryButton>
          <Link
            href={ADMIN_SOCIAL_COMPOSE}
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Open Compose
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
