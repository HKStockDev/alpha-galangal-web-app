"use client";

import { useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import type { SocialPromptTemplateRow } from "@/lib/api";
import { ROLE_ORDER } from "./prompt-script-meta";

type PromptsTemplateEditorProps = {
  initial: SocialPromptTemplateRow;
  onCancel: () => void;
  onSave: (draft: Partial<SocialPromptTemplateRow> & { id?: string }) => void;
};

export function PromptsTemplateEditor({ initial, onCancel, onSave }: PromptsTemplateEditorProps) {
  const [draft, setDraft] = useState(initial);
  const isNew = !initial.id;
  const canSave =
    draft.template_key.trim().length > 0 && draft.template_text.trim().length >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-lg">
        <h3 className="text-lg font-semibold">
          {isNew ? "New prompt template" : "Edit prompt template"}
        </h3>
        <div className="mt-4 grid gap-3">
          <input
            className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
            placeholder="template_key"
            disabled={!isNew}
            value={draft.template_key}
            onChange={(e) => setDraft({ ...draft, template_key: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={draft.prompt_role}
              onChange={(e) => setDraft({ ...draft, prompt_role: e.target.value })}
            >
              {ROLE_ORDER.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={draft.purpose}
              onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
            >
              {[
                "caption",
                "hashtag_pack",
                "image_generation",
                "video_generation",
                "video_script",
                "thread_reply_body",
              ].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={draft.channel}
              onChange={(e) => setDraft({ ...draft, channel: e.target.value })}
            >
              {["all", "facebook", "instagram", "tiktok", "stocktwits", "x", "linkedin"].map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                )
              )}
            </select>
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={draft.post_kind}
              onChange={(e) => setDraft({ ...draft, post_kind: e.target.value })}
            >
              {[
                "all",
                "text",
                "single_image",
                "link_share",
                "video",
                "reel",
                "story",
              ].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            Variables: {"{{ticker}}"}, {"{{signal_name}}"}, {"{{summary}}"}, {"{{page_url}}"},{" "}
            {"{{organization_name}}"}
          </p>
          <textarea
            className="min-h-[200px] rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
            value={draft.template_text}
            onChange={(e) => setDraft({ ...draft, template_text: e.target.value })}
          />
          <input
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Change note (optional)"
            value={draft.change_note ?? ""}
            onChange={(e) => setDraft({ ...draft, change_note: e.target.value || null })}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <SecondaryButton type="button" onClick={onCancel}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={!canSave}
            onClick={() => onSave(isNew ? draft : { ...draft, id: draft.id })}
          >
            Save
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
