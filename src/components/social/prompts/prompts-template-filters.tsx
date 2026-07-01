"use client";

import { ROLE_ORDER } from "./prompt-script-meta";

type PromptsTemplateFiltersProps = {
  search: string;
  onSearchChange: (v: string) => void;
  role: string;
  onRoleChange: (v: string) => void;
  channel: string;
  onChannelChange: (v: string) => void;
  activeOnly: boolean;
  onActiveOnlyChange: (v: boolean) => void;
};

export function PromptsTemplateFilters({
  search,
  onSearchChange,
  role,
  onRoleChange,
  channel,
  onChannelChange,
  activeOnly,
  onActiveOnlyChange,
}: PromptsTemplateFiltersProps) {
  return (
    <div className="sticky top-0 z-10 rounded-xl border border-border bg-background/95 p-4 backdrop-blur">
      <div className="flex flex-wrap gap-3">
        <input
          className="min-w-[200px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Search by key or text…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
        >
          <option value="">All roles</option>
          {ROLE_ORDER.map((r) => (
            <option key={r} value={r}>
              {r.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={channel}
          onChange={(e) => onChannelChange(e.target.value)}
        >
          <option value="">All channels</option>
          {["all", "facebook", "instagram", "tiktok", "stocktwits", "x", "linkedin"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => onActiveOnlyChange(e.target.checked)}
          />
          Active only
        </label>
      </div>
    </div>
  );
}
