import { cn } from "@/lib/utils";

interface PersonaCardProps {
  index: number;
  title: string;
  description: string;
  eyebrow?: string;
  className?: string;
}

export function PersonaCard({
  index,
  title,
  description,
  eyebrow,
  className,
}: PersonaCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-md border border-border/60 bg-card p-8",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow ?? `Client ${index.toString().padStart(2, "0")}`}
        </span>
        <span
          className="font-display text-3xl italic text-muted-foreground/60"
          aria-hidden
        >
          {index.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="mt-4 h-px w-12 bg-accent" aria-hidden />
      <h3 className="mt-5 text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
