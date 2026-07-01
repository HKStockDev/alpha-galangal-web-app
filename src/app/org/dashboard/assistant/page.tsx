"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { OrgChatAssistantFullPage } from "@/components/org-assistant/org-chat-assistant-full-page";
import { useOrgChatAssistant } from "@/components/org-assistant/org-chat-assistant-provider";

export default function OrgDashboardAssistantPage() {
  const searchParams = useSearchParams();
  const { setIsAssistantPage, setIsDockOpen, openThreadById, threads, isLoadingThreads } =
    useOrgChatAssistant();
  const deepLinkAppliedRef = useRef(false);

  useEffect(() => {
    setIsAssistantPage(true);
    setIsDockOpen(false);
    return () => {
      setIsAssistantPage(false);
    };
  }, [setIsAssistantPage, setIsDockOpen]);

  // Apply ?thread= from the URL once on load. Do not re-run when threads change
  // (e.g. after create/delete) or the stale URL will fight in-app thread selection.
  useEffect(() => {
    if (deepLinkAppliedRef.current || isLoadingThreads) return;
    deepLinkAppliedRef.current = true;

    const threadId = searchParams.get("thread");
    if (!threadId) return;
    if (threads.length > 0 && !threads.some((t) => t.id === threadId)) return;

    void openThreadById(threadId);
  }, [isLoadingThreads, threads, searchParams, openThreadById]);

  return <OrgChatAssistantFullPage />;
}
