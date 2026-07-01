"use client";

import Link from "next/link";
import { History, PenLine } from "lucide-react";
import { ADMIN_SOCIAL_COMPOSE, ADMIN_SOCIAL_PROMPTS } from "@/lib/social-routes";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { SectionCard } from "@/components/ui-kit/cards";

export function GenerationEmptyState() {
  return (
    <SectionCard className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <History className="size-7 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">No generations yet</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Captions, image prompts, and video scripts appear here after you generate them in Compose or
        the Prompt Library sandbox.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={ADMIN_SOCIAL_COMPOSE}>
          <PrimaryButton type="button">
            <PenLine className="size-4" />
            Open Compose
          </PrimaryButton>
        </Link>
        <Link href={ADMIN_SOCIAL_PROMPTS}>
          <SecondaryButton type="button">Prompt Library</SecondaryButton>
        </Link>
      </div>
    </SectionCard>
  );
}
