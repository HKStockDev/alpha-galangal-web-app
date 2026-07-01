"use client";

import { cn } from "@/lib/utils";

const STEPS = ["Setup", "Content", "Review"] as const;

type ComposeStepHeaderProps = {
  activeStep: number;
  onStepClick?: (step: number) => void;
};

export function ComposeStepHeader({ activeStep, onStepClick }: ComposeStepHeaderProps) {
  return (
    <ol className="flex items-center gap-2 text-sm">
      {STEPS.map((label, index) => (
        <li key={label} className="flex items-center gap-2">
          <button
            type="button"
            disabled={!onStepClick}
            onClick={() => onStepClick?.(index)}
            className={cn(
              "flex items-center gap-2 rounded-md transition",
              onStepClick ? "cursor-pointer hover:opacity-80" : "cursor-default"
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                index <= activeStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "hidden sm:inline",
                index <= activeStep ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </button>
          {index < STEPS.length - 1 ? (
            <span className="mx-1 hidden h-px w-8 bg-border sm:block" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
