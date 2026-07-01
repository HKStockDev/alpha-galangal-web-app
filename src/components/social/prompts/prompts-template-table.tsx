"use client";

import { Fragment, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { GhostButton } from "@/components/ui-kit/buttons";
import { SectionCard } from "@/components/ui-kit/cards";
import { DataTable } from "@/components/ui-kit/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SocialPromptTemplateRow } from "@/lib/api";
import { ROLE_BADGE_VARIANT, ROLE_ORDER } from "./prompt-script-meta";
import { cn } from "@/lib/utils";

type PromptsTemplateTableProps = {
  templates: SocialPromptTemplateRow[];
  onEdit: (row: SocialPromptTemplateRow) => void;
  onDeactivate: (id: string) => void;
};

export function PromptsTemplateTable({
  templates,
  onEdit,
  onDeactivate,
}: PromptsTemplateTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [collapsedRoles, setCollapsedRoles] = useState<Set<string>>(new Set());

  const grouped = ROLE_ORDER.map((role) => ({
    role,
    rows: templates.filter((t) => t.prompt_role === role),
  })).filter((g) => g.rows.length > 0);

  if (!templates.length) {
    return (
      <SectionCard>
        <p className="text-sm text-muted-foreground">No templates match your filters.</p>
      </SectionCard>
    );
  }

  const toggleRole = (role: string) => {
    setCollapsedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {grouped.map(({ role, rows }) => {
        const collapsed = collapsedRoles.has(role);
        return (
          <SectionCard key={role}>
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => toggleRole(role)}
            >
              <h3 className="text-base font-semibold capitalize text-foreground">
                {role.replace(/_/g, " ")}
              </h3>
              <Badge variant="secondary">{rows.length}</Badge>
            </button>
            {!collapsed ? (
              <DataTable className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Post kind</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <Fragment key={row.id}>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">{row.template_key}</span>
                            <Badge
                              variant={ROLE_BADGE_VARIANT[row.prompt_role] ?? "outline"}
                              className="text-[10px]"
                            >
                              {row.prompt_role}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{row.channel}</TableCell>
                        <TableCell>{row.post_kind}</TableCell>
                        <TableCell>{row.purpose}</TableCell>
                        <TableCell>{row.is_active ? "Yes" : "No"}</TableCell>
                        <TableCell className="space-x-2 text-right">
                          <GhostButton
                            type="button"
                            size="sm"
                            onClick={() =>
                              setExpandedId(expandedId === row.id ? null : row.id)
                            }
                          >
                            {expandedId === row.id ? "Hide" : "Preview"}
                          </GhostButton>
                          <GhostButton type="button" size="sm" onClick={() => onEdit(row)}>
                            Edit
                          </GhostButton>
                          {row.is_active ? (
                            <GhostButton
                              type="button"
                              size="sm"
                              onClick={() => onDeactivate(row.id)}
                            >
                              Deactivate
                            </GhostButton>
                          ) : null}
                        </TableCell>
                      </TableRow>
                      {expandedId === row.id ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <pre
                              className={cn(
                                "max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs"
                              )}
                            >
                              {row.template_text}
                            </pre>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  ))}
                </TableBody>
              </DataTable>
            ) : null}
          </SectionCard>
        );
      })}
    </div>
  );
}
