"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { ADMIN_SOCIAL_COMPOSE } from "@/lib/social-routes";
import { PrimaryButton } from "@/components/ui-kit/buttons";
import { SectionCard } from "@/components/ui-kit/cards";

export function GenerationNewCta() {
  return (
    <SectionCard className="flex flex-col gap-4 border-primary/20 bg-primary/5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-base font-semibold text-foreground">New generation</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Open Compose to run the full workflow, including caption, image prompt, signal card image, and
          video script.
        </p>
      </div>
      <Link href={ADMIN_SOCIAL_COMPOSE} className="shrink-0">
        <PrimaryButton type="button">
          <Plus className="size-4" />
          New generation
        </PrimaryButton>
      </Link>
    </SectionCard>
  );
}
