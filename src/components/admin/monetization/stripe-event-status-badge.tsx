import { Badge } from "@/components/ui/badge";
import type { StripeEventLogStatus } from "@/lib/api";

const VARIANT: Record<
  StripeEventLogStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  processed: "default",
  failed: "destructive",
};

export function StripeEventStatusBadge({ status }: { status: StripeEventLogStatus }) {
  return (
    <Badge variant={VARIANT[status]} className="capitalize">
      {status}
    </Badge>
  );
}
