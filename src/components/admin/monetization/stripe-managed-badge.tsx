import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StripeManagedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="secondary" className={cn("font-normal", className)}>
      Managed in Stripe
    </Badge>
  );
}
