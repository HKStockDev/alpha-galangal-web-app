import { cn } from "@/lib/utils";

interface DotGridBackgroundProps {
  className?: string;
  size?: number;
}

/**
 * Subtle dot-grid texture for marketing section backgrounds. Renders an absolutely
 * positioned, non-interactive layer that uses the current --border token so it
 * adapts to light/dark mode automatically.
 *
 * Parent must be `relative` (and usually `overflow-hidden`).
 */
export function DotGridBackground({ className, size = 24 }: DotGridBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]",
        className,
      )}
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)",
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}
