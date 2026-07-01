"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Archive, ArchiveRestore, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { DangerButton, GhostButton, PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { cn } from "@/lib/utils";
import { ORG_DASHBOARD } from "@/lib/auth-routing";
import { OrgAssistantClientSelect } from "./org-assistant-client-select";
import { OrgAssistantInlineAlert } from "./org-assistant-inline-alert";
import { OrgAssistantMessageBubble } from "./org-assistant-message-bubble";
import { OrgAssistantPendingActionCard } from "./org-assistant-pending-action-card";
import {
  scopeKindLabel,
  scopeLabel,
  useOrgChatAssistant,
  type OrgChatThread,
} from "./org-chat-assistant-provider";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ConversationDetailsPanel({
  activeThread,
  renameValue,
  setRenameValue,
  isRenaming,
  setIsRenaming,
  onDeleteRequest,
}: {
  activeThread: OrgChatThread | null;
  renameValue: string;
  setRenameValue: (value: string) => void;
  isRenaming: boolean;
  setIsRenaming: (value: boolean) => void;
  onDeleteRequest: (threadId: string) => void;
}) {
  const { pinThread, archiveThread, unarchiveThread, renameThread } = useOrgChatAssistant();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-card px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Conversation details</p>
        <p className="text-xs text-muted-foreground">Settings and metadata for this chat.</p>
      </div>

      {!activeThread ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-4">
          <EmptyState compact description="Select a conversation to view details." />
        </div>
      ) : (
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Overview
          </p>
          <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
            <DetailRow
              label="Scope"
              value={
                <Badge variant="secondary" className="rounded-sm">
                  {scopeKindLabel(activeThread)}
                </Badge>
              }
            />
            {activeThread.scope === "client" ? (
              <DetailRow
                label="Client"
                value={
                  activeThread.organizationClientId ? (
                    <Link
                      href={`${ORG_DASHBOARD}/clients/${activeThread.organizationClientId}`}
                      className="text-primary underline underline-offset-2"
                    >
                      {activeThread.clientName ?? "View client"}
                    </Link>
                  ) : (
                    (activeThread.clientName ?? "—")
                  )
                }
              />
            ) : null}
            <DetailRow label="Messages" value={String(activeThread.messages.length)} />
            <DetailRow
              label="Status"
              value={
                <span className="inline-flex flex-wrap justify-end gap-1">
                  {activeThread.pinned ? (
                    <Badge variant="outline" className="rounded-sm">
                      Pinned
                    </Badge>
                  ) : null}
                  {activeThread.archived ? (
                    <Badge variant="outline" className="rounded-sm">
                      Archived
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-sm">
                      Active
                    </Badge>
                  )}
                </span>
              }
            />
            <DetailRow label="Created" value={formatDateTime(activeThread.createdAt)} />
            <DetailRow label="Last updated" value={formatDateTime(activeThread.updatedAt)} />
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Title
          </p>
          {isRenaming ? (
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                void renameThread(activeThread.id, renameValue).then(() => {
                  setIsRenaming(false);
                });
              }}
            >
              <FormInput
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Conversation name"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <GhostButton
                  type="button"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => {
                    setRenameValue(activeThread.title);
                    setIsRenaming(false);
                  }}
                >
                  Cancel
                </GhostButton>
                <PrimaryButton
                  type="submit"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={!renameValue.trim()}
                >
                  Save
                </PrimaryButton>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/20 p-3">
              <p className="min-w-0 truncate text-sm font-medium text-foreground">
                {activeThread.title}
              </p>
              <GhostButton
                type="button"
                size="sm"
                className="h-7 w-7 shrink-0 p-0"
                aria-label="Rename conversation"
                onClick={() => setIsRenaming(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </GhostButton>
            </div>
          )}
        </section>

        <Separator />

        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Actions
          </p>
          <div className="space-y-2">
            <SecondaryButton
              type="button"
              className="w-full justify-start"
              onClick={() => void pinThread(activeThread.id, !activeThread.pinned)}
            >
              {activeThread.pinned ? (
                <PinOff className="mr-2 size-4" aria-hidden />
              ) : (
                <Pin className="mr-2 size-4" aria-hidden />
              )}
              {activeThread.pinned ? "Unpin conversation" : "Pin conversation"}
            </SecondaryButton>
            <SecondaryButton
              type="button"
              className="w-full justify-start"
              onClick={() =>
                void (activeThread.archived
                  ? unarchiveThread(activeThread.id)
                  : archiveThread(activeThread.id))
              }
            >
              {activeThread.archived ? (
                <ArchiveRestore className="mr-2 size-4" aria-hidden />
              ) : (
                <Archive className="mr-2 size-4" aria-hidden />
              )}
              {activeThread.archived ? "Unarchive conversation" : "Archive conversation"}
            </SecondaryButton>
            <DangerButton
              type="button"
              className="w-full justify-start"
              onClick={() => onDeleteRequest(activeThread.id)}
            >
              <Trash2 className="mr-2 size-4" aria-hidden />
              Delete conversation
            </DangerButton>
          </div>
        </section>
      </div>
      )}
    </div>
  );
}

function ChatMessagesPane() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    activeThread,
    typingThreadId,
    isLoadingMessages,
    loadError,
    loadErrorKind,
    assistantUnavailable,
  } = useOrgChatAssistant();

  useEffect(() => {
    if (!activeThread?.id) return;
    if (isLoadingMessages && !activeThread.messagesLoaded) return;

    const scrollToBottom = () => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    };

    scrollToBottom();
    const frame = requestAnimationFrame(() => {
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
    });
    return () => cancelAnimationFrame(frame);
  }, [
    activeThread?.id,
    activeThread?.messages.length,
    activeThread?.messagesLoaded,
    isLoadingMessages,
    typingThreadId,
  ]);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
      {assistantUnavailable ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
          The AI assistant is temporarily unavailable. Past messages are still visible.
        </p>
      ) : null}
      <OrgAssistantInlineAlert kind={loadErrorKind} message={loadError} />
      <FullMessageList />
    </div>
  );
}

function FullMessageList() {
  const {
    activeThread,
    typingThreadId,
    isLoadingMessages,
    pendingAction,
    confirmPendingAction,
    rejectPendingAction,
    isResolvingPendingAction,
  } = useOrgChatAssistant();

  if (!activeThread) {
    return <EmptyState compact description="Select a conversation to start chatting." />;
  }

  if (isLoadingMessages && !activeThread.messagesLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading messages…
      </div>
    );
  }

  return (
    <div className="space-y-3 pr-1">
      {activeThread.messages.map((msg) => (
        <OrgAssistantMessageBubble
          key={msg.id}
          message={msg}
          showTimestamp
          className="max-w-[80%]"
        />
      ))}
      {typingThreadId === activeThread.id ? (
        <div className="mr-auto inline-flex items-center gap-1 rounded-2xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/70" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:240ms]" />
        </div>
      ) : null}
      {pendingAction ? (
        <OrgAssistantPendingActionCard
          pendingAction={pendingAction}
          disabled={isResolvingPendingAction || typingThreadId === activeThread.id}
          onConfirm={() => void confirmPendingAction()}
          onReject={() => void rejectPendingAction()}
        />
      ) : null}
    </div>
  );
}

function FullComposer() {
  const {
    activeThread,
    draft,
    setDraft,
    sendMessage,
    typingThreadId,
    composerDisabled,
    assistantUnavailable,
  } = useOrgChatAssistant();

  const disabled =
    composerDisabled || !!typingThreadId || !draft.trim() || assistantUnavailable;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    if (disabled) return;
    void sendMessage(draft);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return;
        void sendMessage(draft);
      }}
    >
      <div
        className={cn(
          "flex items-end gap-2 rounded-xl border border-input bg-background px-3 py-2",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40"
        )}
      >
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={composerDisabled || assistantUnavailable}
          className={cn(
            "max-h-32 min-h-9 w-full flex-1 resize-none bg-transparent py-1.5 text-sm leading-5",
            "outline-none placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
          placeholder={
            assistantUnavailable
              ? "Assistant unavailable"
              : activeThread?.scope === "client"
                ? "Continue this client conversation..."
                : "Ask the assistant..."
          }
        />
        <div className="flex shrink-0 items-center gap-2">
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
      </div>
    </form>
  );
}

export function OrgChatAssistantFullPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    threads,
    activeThread,
    activeThreadId,
    setActiveThreadId,
    createThread,
    deleteThread,
    organizationClients,
    sendError,
    sendErrorKind,
  } = useOrgChatAssistant();
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newScope, setNewScope] = useState<"general" | "client">("general");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [deleteConfirmThreadId, setDeleteConfirmThreadId] = useState<string | null>(null);

  useEffect(() => {
    setRenameValue(activeThread?.title ?? "");
    setIsRenaming(false);
  }, [activeThread?.id, activeThread?.title]);

  useEffect(() => {
    const urlThreadId = searchParams.get("thread");
    if (activeThreadId === urlThreadId) return;
    if (!activeThreadId && !urlThreadId) return;

    const params = new URLSearchParams(searchParams.toString());
    if (activeThreadId) {
      params.set("thread", activeThreadId);
    } else {
      params.delete("thread");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [activeThreadId, pathname, router, searchParams]);

  function resetNewChatForm() {
    setNewScope("general");
    setSelectedClientId("");
    setNewTitle("");
  }

  function openNewChatModal() {
    resetNewChatForm();
    setNewChatModalOpen(true);
  }

  async function handleCreateChat() {
    await createThread({
      scope: newScope,
      organizationClientId: newScope === "client" ? selectedClientId : null,
      title: newTitle,
    });
    setNewChatModalOpen(false);
    resetNewChatForm();
  }

  const visibleThreads = useMemo(
    () =>
      threads
        .filter((thread) => (showArchived ? thread.archived : !thread.archived))
        .filter((thread) => {
          if (!search.trim()) return true;
          return (
            thread.title.toLowerCase().includes(search.toLowerCase()) ||
            (thread.clientName ?? "").toLowerCase().includes(search.toLowerCase())
          );
        })
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return b.updatedAt.localeCompare(a.updatedAt);
        }),
    [threads, showArchived, search]
  );

  return (
    <div className="box-border flex h-[calc(100vh-4rem)] min-h-0 flex-col overflow-hidden p-4">
      <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[320px_minmax(0,1fr)_280px]">
        <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
          <div className="shrink-0 space-y-3 border-b border-border p-4">
            <div className="grid grid-cols-[32%_minmax(0,1fr)] items-center gap-2">
              <PrimaryButton
                type="button"
                size="sm"
                className="h-9 w-full px-2 text-xs"
                onClick={openNewChatModal}
              >
                <Plus className="mr-1 size-3.5" aria-hidden />
                New chat
              </PrimaryButton>
              <FormInput
                id="assistant-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Conversations..."
                className="min-w-0"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {showArchived ? "Archived" : "Conversations"}
              </p>
              <GhostButton
                type="button"
                size="sm"
                className="h-7 px-2 text-xs"
                aria-label={
                  showArchived
                    ? "Switch to active conversations"
                    : "Switch to archived conversations"
                }
                onClick={() => setShowArchived((v) => !v)}
              >
                {showArchived ? "Back to active" : "View archived"}
              </GhostButton>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 pt-3">
            {visibleThreads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={cn(
                  "relative w-full rounded-xl border px-3 py-2 pr-8 text-left",
                  thread.id === activeThreadId
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:bg-muted/40"
                )}
                onClick={() => setActiveThreadId(thread.id)}
              >
                <p className="truncate text-sm font-medium text-foreground">{thread.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="rounded-sm">
                    {scopeLabel(thread)}
                  </Badge>
                  <span>{new Date(thread.updatedAt).toLocaleDateString()}</span>
                </p>
                {thread.pinned ? (
                  <Image
                    src="/pin.png"
                    alt="Pinned"
                    width={16}
                    height={16}
                    className="absolute bottom-2 right-2 size-4 object-contain"
                  />
                ) : null}
              </button>
            ))}
            {visibleThreads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {showArchived
                  ? "No archived conversations."
                  : search.trim()
                    ? "No conversations found."
                    : "No conversations yet."}
              </p>
            ) : null}
          </div>
        </aside>

        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
          <div className="shrink-0 border-b border-border bg-card px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              {activeThread?.title ?? "Conversation"}
            </p>
          </div>

          <ChatMessagesPane />

          <div className="shrink-0 space-y-2 border-t border-border bg-card p-4">
            <OrgAssistantInlineAlert kind={sendErrorKind} message={sendError} />
            <FullComposer />
          </div>
        </section>

        <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
          <ConversationDetailsPanel
            activeThread={activeThread}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            isRenaming={isRenaming}
            setIsRenaming={setIsRenaming}
            onDeleteRequest={setDeleteConfirmThreadId}
          />
        </aside>
      </div>
      <Dialog
        open={newChatModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setNewChatModalOpen(false);
            resetNewChatForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New chat</DialogTitle>
            <DialogDescription>
              Start a general conversation or open a client-scoped chat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={cn(
                  "h-8 rounded-lg border text-xs",
                  newScope === "general"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground"
                )}
                onClick={() => setNewScope("general")}
              >
                General
              </button>
              <button
                type="button"
                className={cn(
                  "h-8 rounded-lg border text-xs",
                  newScope === "client"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground"
                )}
                onClick={() => setNewScope("client")}
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
              <FormLabel className="text-xs">Title (optional)</FormLabel>
              <FormInput
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Optional title"
              />
            </div>
          </div>
          <DialogFooter>
            <SecondaryButton
              type="button"
              onClick={() => {
                setNewChatModalOpen(false);
                resetNewChatForm();
              }}
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton
              type="button"
              disabled={newScope === "client" && !selectedClientId}
              onClick={() => void handleCreateChat()}
            >
              Create chat
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteConfirmThreadId != null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmThreadId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the conversation and all messages on the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmThreadId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteConfirmThreadId) return;
                void deleteThread(deleteConfirmThreadId).then(() => {
                  setDeleteConfirmThreadId(null);
                });
              }}
            >
              Delete conversation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
