"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  createSocialPromptTemplate,
  deleteSocialPromptTemplate,
  getSocialRenderTemplate,
  listSocialPromptTemplates,
  listSocialRenderTemplates,
  pickUpdatePromptTemplateBody,
  updateSocialPromptTemplate,
  type SocialPromptTemplateRow,
  type SocialRenderTemplateDetail,
  type SocialRenderTemplateRow,
} from "@/lib/api";
import { PrimaryButton } from "@/components/ui-kit/buttons";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { PromptsTabNav } from "./prompts/prompts-tab-nav";
import { PromptsPhilosophyPanel } from "./prompts/prompts-philosophy-panel";
import { PromptsScriptGallery } from "./prompts/prompts-script-gallery";
import { PromptsScriptDetailSheet } from "./prompts/prompts-script-detail-sheet";
import { PromptsTemplateFilters } from "./prompts/prompts-template-filters";
import { PromptsTemplateTable } from "./prompts/prompts-template-table";
import { PromptsSandboxPanel } from "./prompts/prompts-sandbox-panel";
import { PromptsTemplateEditor } from "./prompts/prompts-template-editor";
import {
  RENDER_TEMPLATE_STORAGE_KEY,
  type PromptsTab,
} from "./prompts/prompt-script-meta";

const EMPTY_TEMPLATE: SocialPromptTemplateRow = {
  id: "",
  template_key: "",
  channel: "all",
  post_kind: "all",
  purpose: "caption",
  prompt_role: "base",
  template_text: "",
  required_context_keys: [],
  is_active: true,
  version: 1,
  change_note: null,
};

export function AdminSocialPromptsPanel() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();

  const [tab, setTab] = useState<PromptsTab>("overview");
  const [templates, setTemplates] = useState<SocialPromptTemplateRow[]>([]);
  const [renderTemplates, setRenderTemplates] = useState<SocialRenderTemplateRow[]>([]);
  const [selectedRenderKey, setSelectedRenderKey] = useState("signal_card_v1");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SocialPromptTemplateRow | null>(null);

  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<SocialRenderTemplateDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [t, r] = await Promise.all([
        listSocialPromptTemplates(accessToken),
        listSocialRenderTemplates(accessToken),
      ]);
      setTemplates(t);
      setRenderTemplates(r);
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem(RENDER_TEMPLATE_STORAGE_KEY)
          : null;
      if (stored && r.some((x) => x.template_key === stored)) {
        setSelectedRenderKey(stored);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load prompts");
    } finally {
      setLoading(false);
    }
  }, [accessToken, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectRenderTemplate = (key: string) => {
    setSelectedRenderKey(key);
    try {
      localStorage.setItem(RENDER_TEMPLATE_STORAGE_KEY, key);
    } catch {
      // ignore
    }
    showSuccess("Default render script updated.");
  };

  const openDetail = async (key: string) => {
    if (!accessToken) return;
    setDetailKey(key);
    setDetailLoading(true);
    try {
      setDetail(await getSocialRenderTemplate(accessToken, key));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load bundle");
      setDetailKey(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (activeOnly && !t.is_active) return false;
      if (filterRole && t.prompt_role !== filterRole) return false;
      if (filterChannel && t.channel !== filterChannel) return false;
      if (!q) return true;
      return (
        t.template_key.toLowerCase().includes(q) ||
        t.template_text.toLowerCase().includes(q)
      );
    });
  }, [templates, search, filterRole, filterChannel, activeOnly]);

  const selectedScript = renderTemplates.find((r) => r.template_key === selectedRenderKey);
  const activeCount = templates.filter((t) => t.is_active).length;

  const saveTemplate = async (draft: Partial<SocialPromptTemplateRow> & { id?: string }) => {
    if (!accessToken) return;
    try {
      if (draft.id) {
        await updateSocialPromptTemplate(
          accessToken,
          draft.id,
          pickUpdatePromptTemplateBody(draft)
        );
        showSuccess("Prompt template updated.");
      } else {
        await createSocialPromptTemplate(accessToken, {
          template_key: draft.template_key!,
          channel: draft.channel ?? "all",
          post_kind: draft.post_kind ?? "all",
          purpose: draft.purpose!,
          prompt_role: draft.prompt_role!,
          template_text: draft.template_text!,
          required_context_keys: draft.required_context_keys ?? [],
          change_note: draft.change_note ?? undefined,
        });
        showSuccess("Prompt template created.");
      }
      setEditing(null);
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const deactivate = async (id: string) => {
    if (!accessToken) return;
    try {
      await deleteSocialPromptTemplate(accessToken, id);
      showSuccess("Template deactivated.");
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Deactivate failed");
    }
  };

  if (loading) {
    return <LoadingSkeleton variant="card" lines={6} className="mx-auto max-w-6xl py-6" />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <header>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Prompt library</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage hybrid prompt layers and render scripts for social caption composition.
        </p>
      </header>

      <PromptsTabNav active={tab} onChange={setTab} />

      {tab === "overview" ? (
        <PromptsPhilosophyPanel
          scriptCount={renderTemplates.length}
          activePromptCount={activeCount}
          defaultScriptName={selectedScript?.display_name ?? selectedRenderKey}
          onGoToScripts={() => setTab("scripts")}
        />
      ) : null}

      {tab === "scripts" ? (
        <PromptsScriptGallery
          scripts={renderTemplates}
          selectedKey={selectedRenderKey}
          onSelect={selectRenderTemplate}
          onViewDetail={(key) => void openDetail(key)}
        />
      ) : null}

      {tab === "templates" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <PrimaryButton type="button" onClick={() => setEditing({ ...EMPTY_TEMPLATE })}>
              New prompt template
            </PrimaryButton>
          </div>
          <PromptsTemplateFilters
            search={search}
            onSearchChange={setSearch}
            role={filterRole}
            onRoleChange={setFilterRole}
            channel={filterChannel}
            onChannelChange={setFilterChannel}
            activeOnly={activeOnly}
            onActiveOnlyChange={setActiveOnly}
          />
          <PromptsTemplateTable
            templates={filteredTemplates}
            onEdit={setEditing}
            onDeactivate={(id) => void deactivate(id)}
          />
        </div>
      ) : null}

      {tab === "sandbox" ? (
        <PromptsSandboxPanel
          accessToken={accessToken}
          selectedRenderKey={selectedRenderKey}
          selectedScriptName={selectedScript?.display_name ?? selectedRenderKey}
          onError={showError}
        />
      ) : null}

      <PromptsScriptDetailSheet
        detail={detailKey ? detail : null}
        loading={detailLoading}
        onClose={() => {
          setDetailKey(null);
          setDetail(null);
        }}
      />

      {editing ? (
        <PromptsTemplateEditor
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(draft) => void saveTemplate(draft)}
        />
      ) : null}
    </div>
  );
}
