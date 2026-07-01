"use client";

import { Badge } from "@/components/ui/badge";

type Props = {
  creditsRemaining: number | null;
  loading?: boolean;
};

export function OrgAssistantCreditsBadge({ creditsRemaining, loading }: Props) {
  if (loading) {
    return (
      <Badge variant="outline" className="rounded-md font-normal">
        Credits…
      </Badge>
    );
  }
  if (creditsRemaining == null) {
    return null;
  }
  return (
    <Badge variant="outline" className="rounded-md font-normal" title="Credits remaining">
      {creditsRemaining} credit{creditsRemaining === 1 ? "" : "s"} left
    </Badge>
  );
}
