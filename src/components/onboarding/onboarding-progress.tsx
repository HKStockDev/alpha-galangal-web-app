import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Account" },
  { id: 2, label: "Organization" },
  { id: 3, label: "Profile" },
  { id: 4, label: "Team" },
] as const;

export function OnboardingProgress({ currentStep }: { currentStep: number }) {
  const total = STEPS.length;
  const pct = Math.min(Math.max(currentStep / total, 0), 1) * 100;
  const currentLabel = STEPS.find((s) => s.id === currentStep)?.label ?? "";

  return (
    <div className="space-y-4">
      <div className="md:hidden">
        <p className="text-center text-sm font-medium text-foreground">
          Step {currentStep} of {total}
          {currentLabel ? (
            <span className="text-muted-foreground"> · {currentLabel}</span>
          ) : null}
        </p>
        <div className="mx-auto mt-2 h-2 max-w-md overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <nav aria-label="Onboarding steps" className="hidden md:block">
        <ol className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {STEPS.map((s) => {
            const done = currentStep > s.id;
            const active = currentStep === s.id;
            return (
              <li key={s.id}>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium shadow-sm sm:px-4 sm:text-sm",
                    active &&
                      "border-primary bg-primary/10 text-primary ring-1 ring-primary/20",
                    done && !active && "border-primary/30 bg-primary/5 text-primary",
                    !done && !active && "border-border/80 bg-card text-muted-foreground"
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                      done && "bg-primary text-primary-foreground",
                      active && !done && "bg-primary/20 text-primary",
                      !done && !active && "bg-muted text-muted-foreground"
                    )}
                  >
                    {done ? <Check className="size-4" strokeWidth={2.5} aria-hidden /> : s.id}
                  </span>
                  {s.label}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
