import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  title,
  description,
  eyebrow,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mx-auto max-w-3xl",
        align === "center" && "text-center",
        className,
      )}
    >
      {eyebrow && (
        <div
          className={cn(
            "mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground",
            align === "center" && "justify-center",
          )}
        >
          <span className="h-px w-6 bg-border" aria-hidden />
          <span>{eyebrow}</span>
          <span className="h-px w-6 bg-border" aria-hidden />
        </div>
      )}
      <h2 className="font-display text-balance text-4xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
