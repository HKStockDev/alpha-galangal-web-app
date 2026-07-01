import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

interface PricingCardProps {
  name: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  className?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function PricingCard({
  name,
  description,
  features,
  highlighted = false,
  className,
  ctaLabel = "Request Demo",
  ctaHref = "/demo",
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border p-8",
        highlighted
          ? "border-primary bg-primary/[0.02] shadow-sm"
          : "border-border/60 bg-card",
        className
      )}
    >
      <h3 className="text-xl font-semibold text-foreground">{name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <ul className="mt-8 flex flex-1 flex-col gap-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm text-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        variant={highlighted ? "default" : "outline"}
        className="mt-8 w-full"
      >
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
