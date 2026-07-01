"use client";

import { MetricCard } from "@/components/ui-kit/cards";

type GenerationSummaryStats = {
  total: number;
  captions: number;
  imagePrompts: number;
  withMedia: number;
};

type GenerationSummaryProps = {
  stats: GenerationSummaryStats;
};

export function GenerationSummary({ stats }: GenerationSummaryProps) {
  const items = [
    { label: "Total", value: stats.total },
    { label: "Captions", value: stats.captions },
    { label: "Image prompts", value: stats.imagePrompts },
    { label: "With media", value: stats.withMedia },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <MetricCard key={item.label} className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{item.value}</p>
        </MetricCard>
      ))}
    </div>
  );
}
