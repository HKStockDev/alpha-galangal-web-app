"use client";

import { cn } from "@/lib/utils";
import type { PromptsTab } from "./prompt-script-meta";

const TABS: Array<{ id: PromptsTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "scripts", label: "Render scripts" },
  { id: "templates", label: "Templates" },
  { id: "sandbox", label: "Sandbox" },
];

type PromptsTabNavProps = {
  active: PromptsTab;
  onChange: (tab: PromptsTab) => void;
};

export function PromptsTabNav({ active, onChange }: PromptsTabNavProps) {
  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition",
            active === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
