"use client";

import { SectionCard } from "@/components/ui-kit/cards";
import { cn } from "@/lib/utils";
import { POST_KINDS, type PostKind } from "./compose-types";

const LABELS: Record<PostKind, string> = {
  link_share: "Link share",
  single_image: "Single image",
  text: "Text only",
  video: "Video",
};

type ComposePostTypeSectionProps = {
  postKind: PostKind;
  onChange: (kind: PostKind) => void;
};

export function ComposePostTypeSection({ postKind, onChange }: ComposePostTypeSectionProps) {
  return (
    <SectionCard>
      <h3 className="text-base font-semibold text-foreground">Post type</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Shape of the delivery. Auto-adjusts when you attach media.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {POST_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => onChange(kind)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition",
              postKind === kind
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-foreground hover:border-primary/50"
            )}
          >
            {LABELS[kind]}
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
