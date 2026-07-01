"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/auth-context";
import {
  createOrgLlmConversation,
  deleteOrgLlmConversation,
  fetchMyOrganizations,
  fetchOrganizationCreditWallet,
  getOrgLlmConversation,
  listOrgLlmConversations,
  listOrgLlmMessages,
  listOrganizationClients,
  postOrgAssistantTurn,
  updateOrgLlmConversation,
  type AssistantPendingAction,
  type AssistantTurnResponse,
  type OrganizationClient,
  type OrganizationLlmConversation,
  type OrganizationLlmMessage,
} from "@/lib/api";
import {
  isAssistantDemoMode,
  pickDemoAssistantReply,
} from "./org-assistant-demo";
import {
  parseAssistantApiError,
  type AssistantSendErrorKind,
  type ParsedAssistantError,
} from "./org-assistant-api-errors";
import {
  mergeThreadMetadata,
  readThreadMetadata,
} from "./org-assistant-metadata";

export type OrgChatScope = "general" | "client";
export type OrgChatRole = "user" | "assistant";

export type OrgChatMessage = {
  id: string;
  role: OrgChatRole;
  content: string;
  createdAt: string;
  toolsUsed?: string[];
};

export type OrgChatThread = {
  id: string;
  title: string;
  scope: OrgChatScope;
  clientName: string | null;
  organizationClientId: string | null;
  metadataJson: Record<string, unknown>;
  messages: OrgChatMessage[];
  messagesLoaded: boolean;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  archived: boolean;
};

type CreateThreadInput = {
  scope: OrgChatScope;
  title?: string;
  organizationClientId?: string | null;
};

type OrgChatAssistantContextValue = {
  threads: OrgChatThread[];
  activeThreadId: string | null;
  activeThread: OrgChatThread | null;
  organizationClients: OrganizationClient[];
  isDockOpen: boolean;
  isAssistantPage: boolean;
  isDemoMode: boolean;
  typingThreadId: string | null;
  draft: string;
  sendError: string | null;
  sendErrorKind: AssistantSendErrorKind | null;
  loadError: string | null;
  loadErrorKind: AssistantSendErrorKind | null;
  assistantUnavailable: boolean;
  isLoadingThreads: boolean;
  isLoadingMessages: boolean;
  creditsRemaining: number | null;
  organizationId: string | null;
  composerDisabled: boolean;
  setDraft: (value: string) => void;
  setActiveThreadId: (threadId: string) => void;
  setIsDockOpen: (open: boolean) => void;
  setIsAssistantPage: (isPage: boolean) => void;
  createThread: (input: CreateThreadInput) => Promise<string>;
  archiveThread: (threadId: string) => Promise<void>;
  unarchiveThread: (threadId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  pinThread: (threadId: string, pinned: boolean) => Promise<void>;
  renameThread: (threadId: string, title: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  pendingAction: AssistantPendingAction | null;
  confirmPendingAction: () => Promise<void>;
  rejectPendingAction: () => Promise<void>;
  isResolvingPendingAction: boolean;
  refreshThreads: () => Promise<void>;
  refreshCreditsWallet: () => Promise<void>;
  openThreadById: (threadId: string) => Promise<void>;
};

function nowIso() {
  return new Date().toISOString();
}

function defaultTitle(scope: OrgChatScope, clientName: string | null) {
  if (scope === "client") {
    return clientName?.trim() ? `Client: ${clientName.trim()}` : "Client chat";
  }
  return "General chat";
}

function mapMessage(
  m: OrganizationLlmMessage,
  toolsUsed?: string[]
): OrgChatMessage {
  return {
    id: m.id,
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
    createdAt: m.created_at,
    toolsUsed,
  };
}

function mapConversation(
  c: OrganizationLlmConversation,
  clientName: string | null,
  messages: OrgChatMessage[] = [],
  messagesLoaded = false
): OrgChatThread {
  const meta = readThreadMetadata(c.metadata_json);
  return {
    id: c.id,
    title:
      c.title?.trim() ||
      defaultTitle(c.organization_client_id ? "client" : "general", clientName),
    scope: c.organization_client_id ? "client" : "general",
    clientName,
    organizationClientId: c.organization_client_id,
    metadataJson: c.metadata_json ?? {},
    messages,
    messagesLoaded,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    pinned: meta.pinned === true,
    archived: meta.archived === true,
  };
}

function clientNameFor(
  clients: OrganizationClient[],
  organizationClientId: string | null
): string | null {
  if (!organizationClientId) return null;
  return clients.find((c) => c.id === organizationClientId)?.name ?? null;
}

function applyUnavailableFromError(
  parsed: ParsedAssistantError,
  setAssistantUnavailable: (value: boolean) => void
) {
  if (parsed.kind === "unavailable") {
    setAssistantUnavailable(true);
  }
}

const OrgChatAssistantContext = createContext<OrgChatAssistantContextValue | null>(null);

export function OrgChatAssistantProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const isDemoMode = isAssistantDemoMode();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationClients, setOrganizationClients] = useState<OrganizationClient[]>([]);
  const [threads, setThreads] = useState<OrgChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [isAssistantPage, setIsAssistantPage] = useState(false);
  const [typingThreadId, setTypingThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendErrorKind, setSendErrorKind] = useState<AssistantSendErrorKind | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadErrorKind, setLoadErrorKind] = useState<AssistantSendErrorKind | null>(null);
  const [assistantUnavailable, setAssistantUnavailable] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [pendingActionByThread, setPendingActionByThread] = useState<
    Record<string, AssistantPendingAction | null>
  >({});
  const [isResolvingPendingAction, setIsResolvingPendingAction] = useState(false);
  const messagesLoadRef = useRef<string | null>(null);
  const activeThreadIdRef = useRef<string | null>(null);
  activeThreadIdRef.current = activeThreadId;

  const refreshCreditsWallet = useCallback(async () => {
    if (!accessToken || !organizationId) return;
    const wallet = await fetchOrganizationCreditWallet(accessToken, organizationId).catch(
      () => null
    );
    if (wallet) {
      setCreditsRemaining(wallet.total_credits_remaining);
    }
  }, [accessToken, organizationId]);

  useEffect(() => {
    if (!accessToken) {
      setOrganizationId(null);
      setOrganizationClients([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const orgs = await fetchMyOrganizations(accessToken);
        if (cancelled) return;
        const orgId = orgs[0]?.id ?? null;
        setOrganizationId(orgId);
        if (!orgId) return;
        const [clients, wallet] = await Promise.all([
          listOrganizationClients(accessToken, orgId),
          fetchOrganizationCreditWallet(accessToken, orgId).catch(() => null),
        ]);
        if (cancelled) return;
        setOrganizationClients(clients);
        if (wallet) {
          setCreditsRemaining(wallet.total_credits_remaining);
        }
      } catch {
        if (!cancelled) {
          setOrganizationId(null);
          setOrganizationClients([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshCreditsWallet();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refreshCreditsWallet]);

  const loadThreadMessages = useCallback(
    async (orgId: string, conversationId: string) => {
      if (!accessToken) return [];
      const rows = await listOrgLlmMessages(accessToken, orgId, conversationId, {
        limit: 200,
      });
      return rows
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => mapMessage(m));
    },
    [accessToken]
  );

  const refreshThreads = useCallback(async () => {
    if (!accessToken || !organizationId) return;
    if (isDemoMode) {
      setIsLoadingThreads(false);
      return;
    }
    setIsLoadingThreads(true);
    setLoadError(null);
    setLoadErrorKind(null);
    try {
      const convos = await listOrgLlmConversations(accessToken, organizationId);
      let merged: OrgChatThread[] = [];
      setThreads((prev) => {
        const prevById = new Map(prev.map((t) => [t.id, t]));
        const serverIds = new Set(convos.map((c) => c.id));
        const fromServer = convos.map((c) => {
          const name = clientNameFor(organizationClients, c.organization_client_id);
          const existing = prevById.get(c.id);
          if (existing?.messagesLoaded) {
            return mapConversation(c, name, existing.messages, true);
          }
          return mapConversation(c, name, [], false);
        });
        const localOnly = prev.filter((t) => !serverIds.has(t.id));
        merged = [...localOnly, ...fromServer];
        return merged;
      });
      setActiveThreadId((current) => {
        if (current && merged.some((t) => t.id === current)) return current;
        const firstActive = merged.find((t) => !t.archived);
        return firstActive?.id ?? merged[0]?.id ?? null;
      });
    } catch (e) {
      const parsed = parseAssistantApiError(e, "Failed to load assistant threads");
      setLoadError(parsed.message);
      setLoadErrorKind(parsed.kind);
      applyUnavailableFromError(parsed, setAssistantUnavailable);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [accessToken, organizationId, organizationClients, isDemoMode]);

  useEffect(() => {
    if (organizationId && accessToken && organizationClients.length >= 0) {
      void refreshThreads();
    }
  }, [organizationId, accessToken, organizationClients.length, refreshThreads]);

  useEffect(() => {
    setLoadError(null);
    setLoadErrorKind(null);
    setSendError(null);
    setSendErrorKind(null);
  }, [activeThreadId]);

  useEffect(() => {
    if (!accessToken || !organizationId || !activeThreadId || isDemoMode) return;
    const thread = threads.find((t) => t.id === activeThreadId);
    if (!thread || thread.messagesLoaded) return;
    if (messagesLoadRef.current === activeThreadId) return;

    const conversationId = activeThreadId;
    let cancelled = false;
    messagesLoadRef.current = conversationId;
    setIsLoadingMessages(true);

    (async () => {
      try {
        const messages = await loadThreadMessages(organizationId, conversationId);
        if (cancelled) return;
        setThreads((prev) =>
          prev.map((t) =>
            t.id !== conversationId ? t : { ...t, messages, messagesLoaded: true }
          )
        );
      } catch (e) {
        if (!cancelled && activeThreadIdRef.current === conversationId) {
          const parsed = parseAssistantApiError(e, "Failed to load messages");
          setLoadError(parsed.message);
          setLoadErrorKind(parsed.kind);
          applyUnavailableFromError(parsed, setAssistantUnavailable);
          setThreads((prev) =>
            prev.map((t) =>
              t.id !== conversationId ? t : { ...t, messagesLoaded: true }
            )
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMessages(false);
          if (messagesLoadRef.current === conversationId) {
            messagesLoadRef.current = null;
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      if (messagesLoadRef.current === conversationId) {
        messagesLoadRef.current = null;
        setIsLoadingMessages(false);
      }
    };
  }, [
    accessToken,
    organizationId,
    activeThreadId,
    threads,
    loadThreadMessages,
    isDemoMode,
  ]);

  const openThreadById = useCallback(
    async (threadId: string) => {
      if (!threadId) return;
      const existing = threads.find((t) => t.id === threadId);
      if (existing) {
        setActiveThreadId(threadId);
        return;
      }
      if (!accessToken || !organizationId || isDemoMode) return;

      setLoadError(null);
      setLoadErrorKind(null);
      try {
        const conversation = await getOrgLlmConversation(
          accessToken,
          organizationId,
          threadId
        );
        const name = clientNameFor(organizationClients, conversation.organization_client_id);
        const thread = mapConversation(conversation, name, [], false);
        setThreads((prev) => {
          if (prev.some((t) => t.id === threadId)) return prev;
          return [thread, ...prev];
        });
        setActiveThreadId(threadId);
      } catch (e) {
        const current = activeThreadIdRef.current;
        if (current != null && current !== threadId) return;
        const parsed = parseAssistantApiError(e, "Failed to open conversation");
        setLoadError(parsed.message);
        setLoadErrorKind(parsed.kind);
        applyUnavailableFromError(parsed, setAssistantUnavailable);
      }
    },
    [threads, accessToken, organizationId, organizationClients, isDemoMode]
  );

  const patchThreadMetadata = useCallback(
    async (threadId: string, patch: { pinned?: boolean; archived?: boolean }) => {
      if (!accessToken || !organizationId) return;
      const thread = threads.find((t) => t.id === threadId);
      if (!thread) return;
      const metadata_json = mergeThreadMetadata(thread.metadataJson, patch);
      const updated = await updateOrgLlmConversation(
        accessToken,
        organizationId,
        threadId,
        { metadata_json }
      );
      const name = clientNameFor(organizationClients, updated.organization_client_id);
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t;
          const next = mapConversation(updated, name, t.messages, t.messagesLoaded);
          return next;
        })
      );
    },
    [accessToken, organizationId, threads, organizationClients]
  );

  const createThread = useCallback(
    async (input: CreateThreadInput) => {
      if (!accessToken || !organizationId) {
        throw new Error("Organization not ready");
      }
      const clientId =
        input.scope === "client" ? input.organizationClientId ?? null : null;
      if (input.scope === "client" && !clientId) {
        throw new Error("Select a client for client-scoped chat");
      }
      const clientName = clientNameFor(organizationClients, clientId);

      if (isDemoMode) {
        const id = `demo-${Date.now()}`;
        const thread = mapConversation(
          {
            id,
            organization_id: organizationId,
            user_id: "demo",
            organization_client_id: clientId,
            title: input.title?.trim() || defaultTitle(input.scope, clientName),
            model_key: null,
            metadata_json: {},
            created_at: nowIso(),
            updated_at: nowIso(),
          },
          clientName,
          [],
          true
        );
        setThreads((prev) => [thread, ...prev]);
        setActiveThreadId(id);
        return id;
      }

      const created = await createOrgLlmConversation(accessToken, organizationId, {
        title: input.title?.trim() || defaultTitle(input.scope, clientName),
        organization_client_id: clientId,
      });
      const thread = mapConversation(created, clientName, [], false);
      setThreads((prev) => [thread, ...prev]);
      setActiveThreadId(created.id);
      return created.id;
    },
    [accessToken, organizationId, organizationClients, isDemoMode]
  );

  const applyTurnResult = useCallback(
    (threadId: string, result: AssistantTurnResponse) => {
      if (result.creditsRemaining != null) {
        setCreditsRemaining(result.creditsRemaining);
      } else {
        void refreshCreditsWallet();
      }
      setPendingActionByThread((prev) => ({
        ...prev,
        [threadId]: result.pendingAction ?? null,
      }));
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== threadId) return thread;
          const withoutPending = thread.messages.filter((m) => !m.id.startsWith("pending-"));
          return {
            ...thread,
            messages: [
              ...withoutPending,
              mapMessage(result.userMessage),
              mapMessage(result.assistantMessage, result.toolsUsed),
            ],
            messagesLoaded: true,
            updatedAt: result.assistantMessage.created_at,
          };
        })
      );
    },
    [refreshCreditsWallet]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text || !accessToken || !organizationId || assistantUnavailable) return;

      let targetId = activeThreadId;
      const targetThread = threads.find((t) => t.id === targetId) ?? null;
      if (!targetId) {
        targetId = await createThread({ scope: "general" });
      }

      setSendError(null);
      setSendErrorKind(null);
      setTypingThreadId(targetId);
      setDraft("");

      const optimisticUser: OrgChatMessage = {
        id: `pending-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: nowIso(),
      };
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id !== targetId
            ? thread
            : {
                ...thread,
                messages: [...thread.messages, optimisticUser],
                messagesLoaded: true,
                updatedAt: optimisticUser.createdAt,
              }
        )
      );

      try {
        if (isDemoMode) {
          await new Promise((resolve) => setTimeout(resolve, 450));
          const scope =
            targetThread?.scope ??
            threads.find((t) => t.id === targetId)?.scope ??
            "general";
          const assistantContent = pickDemoAssistantReply(text, scope);
          const assistantMessage: OrgChatMessage = {
            id: `demo-assistant-${Date.now()}`,
            role: "assistant",
            content: assistantContent,
            createdAt: nowIso(),
          };
          const userMessage: OrgChatMessage = {
            id: `demo-user-${Date.now()}`,
            role: "user",
            content: text,
            createdAt: optimisticUser.createdAt,
          };
          setThreads((prev) =>
            prev.map((thread) => {
              if (thread.id !== targetId) return thread;
              const withoutPending = thread.messages.filter(
                (m) => !m.id.startsWith("pending-")
              );
              return {
                ...thread,
                messages: [...withoutPending, userMessage, assistantMessage],
                messagesLoaded: true,
                updatedAt: assistantMessage.createdAt,
              };
            })
          );
          return;
        }

        const result = await postOrgAssistantTurn(accessToken, organizationId, targetId, {
          content: text,
        });
        applyTurnResult(targetId, result);
      } catch (e) {
        const parsed = parseAssistantApiError(e);
        setSendError(parsed.message);
        setSendErrorKind(parsed.kind);
        applyUnavailableFromError(parsed, setAssistantUnavailable);
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id !== targetId
              ? thread
              : {
                  ...thread,
                  messages: thread.messages.filter((m) => !m.id.startsWith("pending-")),
                }
          )
        );
      } finally {
        setTypingThreadId((current) => (current === targetId ? null : current));
      }
    },
    [
      activeThreadId,
      accessToken,
      organizationId,
      createThread,
      assistantUnavailable,
      threads,
      isDemoMode,
      applyTurnResult,
      refreshCreditsWallet,
    ]
  );

  const confirmPendingAction = useCallback(async () => {
    if (!accessToken || !organizationId || !activeThreadId) return;
    const pending = pendingActionByThread[activeThreadId];
    if (!pending) return;

    setIsResolvingPendingAction(true);
    setSendError(null);
    setSendErrorKind(null);
    try {
      const result = await postOrgAssistantTurn(accessToken, organizationId, activeThreadId, {
        confirm_action_id: pending.id,
      });
      applyTurnResult(activeThreadId, result);
    } catch (e) {
      const parsed = parseAssistantApiError(e);
      setSendError(parsed.message);
      setSendErrorKind(parsed.kind);
      applyUnavailableFromError(parsed, setAssistantUnavailable);
    } finally {
      setIsResolvingPendingAction(false);
    }
  }, [
    accessToken,
    organizationId,
    activeThreadId,
    pendingActionByThread,
    applyTurnResult,
  ]);

  const rejectPendingAction = useCallback(async () => {
    if (!accessToken || !organizationId || !activeThreadId) return;
    const pending = pendingActionByThread[activeThreadId];
    if (!pending) return;

    setIsResolvingPendingAction(true);
    setSendError(null);
    setSendErrorKind(null);
    try {
      const result = await postOrgAssistantTurn(accessToken, organizationId, activeThreadId, {
        reject_action_id: pending.id,
      });
      applyTurnResult(activeThreadId, result);
    } catch (e) {
      const parsed = parseAssistantApiError(e);
      setSendError(parsed.message);
      setSendErrorKind(parsed.kind);
      applyUnavailableFromError(parsed, setAssistantUnavailable);
    } finally {
      setIsResolvingPendingAction(false);
    }
  }, [
    accessToken,
    organizationId,
    activeThreadId,
    pendingActionByThread,
    applyTurnResult,
  ]);

  const renameThread = useCallback(
    async (threadId: string, title: string) => {
      const next = title.trim();
      if (!next || !accessToken || !organizationId) return;

      if (isDemoMode) {
        setThreads((prev) =>
          prev.map((t) => (t.id !== threadId ? t : { ...t, title: next }))
        );
        return;
      }

      const updated = await updateOrgLlmConversation(
        accessToken,
        organizationId,
        threadId,
        { title: next }
      );
      const name = clientNameFor(organizationClients, updated.organization_client_id);
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t;
          return { ...mapConversation(updated, name, t.messages, t.messagesLoaded), title: next };
        })
      );
    },
    [accessToken, organizationId, organizationClients, isDemoMode]
  );

  const pinThread = useCallback(
    async (threadId: string, pinned: boolean) => {
      if (isDemoMode) {
        setThreads((prev) =>
          prev.map((t) => (t.id !== threadId ? t : { ...t, pinned }))
        );
        return;
      }
      await patchThreadMetadata(threadId, { pinned });
    },
    [patchThreadMetadata, isDemoMode]
  );

  const archiveThread = useCallback(
    async (threadId: string) => {
      if (isDemoMode) {
        setThreads((prev) =>
          prev.map((t) => (t.id !== threadId ? t : { ...t, archived: true }))
        );
        setActiveThreadId((current) => (current === threadId ? null : current));
        return;
      }
      await patchThreadMetadata(threadId, { archived: true });
      setActiveThreadId((current) => (current === threadId ? null : current));
    },
    [patchThreadMetadata, isDemoMode]
  );

  const unarchiveThread = useCallback(
    async (threadId: string) => {
      if (isDemoMode) {
        setThreads((prev) =>
          prev.map((t) => (t.id !== threadId ? t : { ...t, archived: false }))
        );
        return;
      }
      await patchThreadMetadata(threadId, { archived: false });
    },
    [patchThreadMetadata, isDemoMode]
  );

  const deleteThread = useCallback(
    async (threadId: string) => {
      if (!accessToken || !organizationId) return;

      if (isDemoMode) {
        setLoadError(null);
        setLoadErrorKind(null);
        setSendError(null);
        setSendErrorKind(null);
        setThreads((prev) => {
          const next = prev.filter((t) => t.id !== threadId);
          setActiveThreadId((current) => {
            if (current !== threadId) return current;
            return next.find((t) => !t.archived)?.id ?? next[0]?.id ?? null;
          });
          return next;
        });
        return;
      }

      await deleteOrgLlmConversation(accessToken, organizationId, threadId);
      setLoadError(null);
      setLoadErrorKind(null);
      setSendError(null);
      setSendErrorKind(null);
      setThreads((prev) => {
        const next = prev.filter((t) => t.id !== threadId);
        setActiveThreadId((current) => {
          if (current !== threadId) return current;
          return next.find((t) => !t.archived)?.id ?? next[0]?.id ?? null;
        });
        return next;
      });
    },
    [accessToken, organizationId, isDemoMode]
  );

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

  useEffect(() => {
    if (activeThreadId) return;
    const next = threads.find((thread) => !thread.archived) ?? threads[0] ?? null;
    if (next) setActiveThreadId(next.id);
  }, [activeThreadId, threads]);

  const composerDisabled =
    assistantUnavailable ||
    isLoadingThreads ||
    (isLoadingMessages && !(activeThread?.messagesLoaded ?? false));

  const pendingAction =
    activeThreadId != null ? (pendingActionByThread[activeThreadId] ?? null) : null;

  const value: OrgChatAssistantContextValue = {
    threads,
    activeThreadId,
    activeThread,
    organizationClients,
    isDockOpen,
    isAssistantPage,
    isDemoMode,
    typingThreadId,
    draft,
    sendError,
    sendErrorKind,
    loadError,
    loadErrorKind,
    assistantUnavailable,
    isLoadingThreads,
    isLoadingMessages,
    creditsRemaining,
    organizationId,
    composerDisabled,
    setDraft,
    setActiveThreadId,
    setIsDockOpen,
    setIsAssistantPage,
    createThread,
    archiveThread,
    unarchiveThread,
    deleteThread,
    pinThread,
    renameThread,
    sendMessage,
    pendingAction,
    confirmPendingAction,
    rejectPendingAction,
    isResolvingPendingAction,
    refreshThreads,
    refreshCreditsWallet,
    openThreadById,
  };

  return (
    <OrgChatAssistantContext.Provider value={value}>{children}</OrgChatAssistantContext.Provider>
  );
}

export function useOrgChatAssistant() {
  const ctx = useContext(OrgChatAssistantContext);
  if (!ctx) {
    throw new Error("useOrgChatAssistant must be used inside OrgChatAssistantProvider");
  }
  return ctx;
}

export function scopeKindLabel(thread: OrgChatThread | null): string {
  if (!thread || thread.scope === "general") return "General";
  return "Client";
}

export function scopeLabel(thread: OrgChatThread | null): string {
  if (!thread) return "General";
  if (thread.scope === "client") {
    return thread.clientName?.trim() ? `Client: ${thread.clientName.trim()}` : "Client";
  }
  return "General";
}
