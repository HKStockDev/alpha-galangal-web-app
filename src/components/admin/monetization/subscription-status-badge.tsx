import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trialing: "default",
  past_due: "destructive",
  canceled: "secondary",
  incomplete: "outline",
  incomplete_expired: "secondary",
  unpaid: "destructive",
  paused: "outline",
};

export function SubscriptionStatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANT[status] ?? "outline";
  return (
    <Badge variant={variant} className={cn("capitalize")}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
