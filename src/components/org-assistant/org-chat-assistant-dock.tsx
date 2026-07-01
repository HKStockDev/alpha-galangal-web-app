"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { GhostButton, PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { cn } from "@/lib/utils";
import { ORG_DASHBOARD } from "@/lib/auth-routing";
import { OrgAssistantClientSelect } from "./org-assistant-client-select";
import { OrgAssistantCreditsBadge } from "./org-assistant-credits-badge";
import { OrgAssistantInlineAlert } from "./org-assistant-inline-alert";
import { OrgAssistantMessageBubble } from "./org-assistant-message-bubble";
import { OrgAssistantPendingActionCard } from "./org-assistant-pending-action-card";
import { scopeLabel, useOrgChatAssistant } from "./org-chat-assistant-provider";

function MessageList({ className }: { className?: string }) {
  const {
    activeThread,
    typingThreadId,
    isLoadingMessages,
    pendingAction,
    confirmPendingAction,
    rejectPendingAction,
    isResolvingPendingAction,
  } = useOrgChatAssistant();

  if (isLoadingMessages && activeThread && !activeThread.messagesLoaded) {
    return (
      <div className={cn("flex min-h-48 items-center justify-center text-sm text-muted-foreground", className)}>
        Loading messages…
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 overflow-y-auto", className)}>
      {activeThread?.messages.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Send a message to start.</p>
      ) : null}
      {activeThread?.messages.map((msg) => (
        <OrgAssistantMessageBubble key={msg.id} message={msg} />
      ))}
      {typingThreadId && typingThreadId === activeThread?.id ? (
        <div className="mr-auto inline-flex items-center gap-1 rounded-2xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/70" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:240ms]" />
        </div>
      ) : null}
      {pendingAction ? (
        <OrgAssistantPendingActionCard
          pendingAction={pendingAction}
          disabled={isResolvingPendingAction || !!typingThreadId}
          onConfirm={() => void confirmPendingAction()}
          onReject={() => void rejectPendingAction()}
        />
      ) : null}
    </div>
  );
}

function Composer() {
  const { draft, setDraft, sendMessage, activeThread, typingThreadId, composerDisabled, assistantUnavailable } =
    useOrgChatAssistant();

  const disabled =
    composerDisabled || !!typingThreadId || !draft.trim() || assistantUnavailable;

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        void sendMessage(draft);
      }}
    >
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={composerDisabled || assistantUnavailable}
        className={cn(
          "min-h-16 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm",
          "outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
        placeholder={
          assistantUnavailable
            ? "Assistant unavailable"
            : activeThread?.scope === "client"
              ? "Message in client context..."
              : "Ask the assistant..."
        }
      />
      <div className="flex items-center justify-end gap-2">
        <SecondaryButton
          type="button"
          size="sm"
          onClick={() => setDraft("")}
          disabled={!draft.trim() || composerDisabled}
        >
          Clear
        </SecondaryButton>
        <PrimaryButton type="submit" size="sm" disabled={disabled}>
          Send
        </PrimaryButton>
      </div>
    </form>
  );
}

export function OrgChatAssistantDock() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    threads,
    activeThread,
    activeThreadId,
    isDockOpen,
    setIsDockOpen,
    setActiveThreadId,
    createThread,
    isAssistantPage,
    sendError,
    sendErrorKind,
    loadError,
    loadErrorKind,
    isLoadingThreads,
    creditsRemaining,
    organizationClients,
    assistantUnavailable,
    isDemoMode,
  } = useOrgChatAssistant();
  const [showNewThread, setShowNewThread] = useState(false);
  const [newScope, setNewScope] = useState<"general" | "client">("general");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [threadTitle, setThreadTitle] = useState("");

  const availableThreads = useMemo(
    () => threads.filter((thread) => !thread.archived),
    [threads]
  );

  if (!pathname?.startsWith(ORG_DASHBOARD) || isAssistantPage) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          type="button"
          onClick={() => setIsDockOpen(!isDockOpen)}
          className={cn(
            "h-12 rounded-full pl-2.5 pr-4 text-sm font-semibold shadow-lg",
            isDockOpen ? "bg-foreground text-background hover:bg-foreground/85" : "bg-primary hover:bg-primary/90"
          )}
        >
          <span
            className={cn(
              "mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full border",
              isDockOpen
                ? "border-background/20 bg-background/10"
                : "border-primary-foreground/25 bg-primary-foreground/10"
            )}
            aria-hidden
          >
            <Sparkles className="h-4 w-4" />
          </span>
          {isDockOpen ? "Close assistant" : "AI assistant"}
        </Button>
      </div>

      {isDockOpen ? (
        <div className="fixed bottom-22 right-6 z-50 w-[min(92vw,420px)] rounded-2xl border border-border/90 bg-background shadow-2xl">
          <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {activeThread?.title ?? "Assistant"}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <Badge variant="secondary" className="rounded-md">
                  {scopeLabel(activeThread)}
                </Badge>
                <OrgAssistantCreditsBadge
                  creditsRemaining={creditsRemaining}
                  loading={isLoadingThreads}
                />
                {isDemoMode ? (
                  <Badge variant="outline" className="rounded-md">
                    Demo
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <GhostButton
                type="button"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => router.push(`${ORG_DASHBOARD}/assistant`)}
              >
                Expand
              </GhostButton>
              <GhostButton
                type="button"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setIsDockOpen(false)}
              >
                Close
              </GhostButton>
            </div>
          </div>

          <div className="space-y-3 p-4">
            {assistantUnavailable ? (
              <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
                The AI assistant is temporarily unavailable. You can still browse past conversations.
              </p>
            ) : null}
            <OrgAssistantInlineAlert kind={loadErrorKind} message={loadError} />

            <div className="flex items-center gap-2">
              <select
                value={activeThreadId ?? ""}
                onChange={(e) => setActiveThreadId(e.target.value)}
                disabled={isLoadingThreads || availableThreads.length === 0}
                className="h-9 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring disabled:opacity-60"
              >
                {availableThreads.length === 0 ? (
                  <option value="">No conversations yet</option>
                ) : null}
                {availableThreads.map((thread) => (
                  <option key={thread.id} value={thread.id}>
                    {thread.title}
                  </option>
                ))}
              </select>
              <SecondaryButton
                type="button"
                size="sm"
                className="h-9 px-3"
                onClick={() => setShowNewThread((v) => !v)}
              >
                New
              </SecondaryButton>
            </div>

            {showNewThread ? (
              <form
                className="space-y-2 rounded-xl border border-border bg-muted/25 p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void (async () => {
                    const createdId = await createThread({
                      scope: newScope,
                      organizationClientId:
                        newScope === "client" ? selectedClientId : null,
                      title: threadTitle,
                    });
                    setActiveThreadId(createdId);
                    setShowNewThread(false);
                    setThreadTitle("");
                    setSelectedClientId("");
                  })();
                }}
              >
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewScope("general")}
                    className={cn(
                      "h-8 rounded-lg border text-xs",
                      newScope === "general"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    General
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScope("client")}
                    className={cn(
                      "h-8 rounded-lg border text-xs",
                      newScope === "client"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    Client
                  </button>
                </div>
                {newScope === "client" ? (
                  <OrgAssistantClientSelect
                    clients={organizationClients}
                    value={selectedClientId}
                    onChange={setSelectedClientId}
                  />
                ) : null}
                <div className="space-y-1">
                  <FormLabel className="text-xs">Thread title (optional)</FormLabel>
                  <FormInput
                    value={threadTitle}
                    onChange={(e) => setThreadTitle(e.target.value)}
                    placeholder="Optional title"
                    className="h-9"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <GhostButton
                    type="button"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => setShowNewThread(false)}
                  >
                    Cancel
                  </GhostButton>
                  <PrimaryButton
                    type="submit"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    disabled={newScope === "client" && !selectedClientId}
                  >
                    Create thread
                  </PrimaryButton>
                </div>
              </form>
            ) : null}

            <MessageList className="max-h-72 min-h-48 pr-1" />
            <OrgAssistantInlineAlert kind={sendErrorKind} message={sendError} />
            <Composer />
          </div>
        </div>
      ) : null}
    </>
  );
}
