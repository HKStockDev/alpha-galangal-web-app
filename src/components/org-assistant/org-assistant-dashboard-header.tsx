"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { SecondaryButton } from "@/components/ui-kit/buttons";
import { ORG_DASHBOARD } from "@/lib/auth-routing";
import { OrgAssistantCreditsBadge } from "./org-assistant-credits-badge";
import { useOrgChatAssistant } from "./org-chat-assistant-provider";

export function OrgAssistantDashboardHeader() {
  const router = useRouter();
  const { creditsRemaining, isLoadingThreads, isDemoMode } = useOrgChatAssistant();

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
          Assistant
        </h1>
        <p className="truncate text-xs text-muted-foreground sm:text-sm">
          Organization AI chat with client context, credits, and saved history.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {isDemoMode ? (
          <Badge variant="outline" className="rounded-md">
            Demo mode
          </Badge>
        ) : null}
        <OrgAssistantCreditsBadge
          creditsRemaining={creditsRemaining}
          loading={isLoadingThreads}
        />
        <SecondaryButton type="button" onClick={() => router.push(ORG_DASHBOARD)}>
          Back to dashboard
        </SecondaryButton>
      </div>
    </div>
  );
}
