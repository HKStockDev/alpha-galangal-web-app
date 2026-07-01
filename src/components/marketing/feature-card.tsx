import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  eyebrow?: string;
  className?: string;
}

function deriveEyebrow(title: string): string {
  const first = title.split(/\s+/)[0] ?? "";
  return first.replace(/[^a-zA-Z]/g, "").toUpperCase() || "FEATURE";
}

export function FeatureCard({
  title,
  description,
  eyebrow,
  className,
}: FeatureCardProps) {
  const label = eyebrow ?? deriveEyebrow(title);
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-md border border-border/60 bg-card p-6 transition-colors hover:border-foreground/30",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute left-6 top-0 h-px w-8 -translate-y-px bg-accent"
      />
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
