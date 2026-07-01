"use client";

import { SectionCard } from "@/components/ui-kit/cards";
import type { SocialPublishMode } from "@/lib/api";
import { cn } from "@/lib/utils";

type ComposeScheduleSectionProps = {
  mode: SocialPublishMode;
  onModeChange: (mode: SocialPublishMode) => void;
  scheduleLocal: string;
  onScheduleLocalChange: (value: string) => void;
};

const OPTIONS: Array<{ mode: SocialPublishMode; label: string; description: string }> = [
  { mode: "now", label: "Publish now", description: "Send immediately via Woop." },
  { mode: "schedule", label: "Schedule", description: "Pick a future date and time (UTC)." },
  { mode: "draft", label: "Save draft", description: "Store locally without publishing." },
];

export function ComposeScheduleSection({
  mode,
  onModeChange,
  scheduleLocal,
  onScheduleLocalChange,
}: ComposeScheduleSectionProps) {
  return (
    <SectionCard>
      <h3 className="text-base font-semibold text-foreground">When to publish</h3>
      <div className="mt-4 space-y-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.mode}
            type="button"
            onClick={() => onModeChange(opt.mode)}
            className={cn(
              "w-full rounded-xl border p-3 text-left transition",
              mode === opt.mode
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            )}
          >
            <p className="text-sm font-medium text-foreground">{opt.label}</p>
            <p className="text-xs text-muted-foreground">{opt.description}</p>
          </button>
        ))}
      </div>

      {mode === "schedule" ? (
        <label className="mt-4 block text-sm">
          <span className="text-muted-foreground">Scheduled for (your local time → stored as UTC)</span>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            value={scheduleLocal}
            onChange={(e) => onScheduleLocalChange(e.target.value)}
            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
          />
        </label>
      ) : null}
    </SectionCard>
  );
}
