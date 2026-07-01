"use client";

import type { OrganizationClient } from "@/lib/api";
import { FormLabel } from "@/components/ui-kit/forms";
import { cn } from "@/lib/utils";

type Props = {
  clients: OrganizationClient[];
  value: string;
  onChange: (clientId: string) => void;
  loading?: boolean;
  className?: string;
};

export function OrgAssistantClientSelect({
  clients,
  value,
  onChange,
  loading,
  className,
}: Props) {
  return (
    <div className={cn("space-y-1", className)}>
      <FormLabel className="text-xs">Client</FormLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || clients.length === 0}
        className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
      >
        <option value="">
          {loading
            ? "Loading clients…"
            : clients.length === 0
              ? "No clients — add one in Clients"
              : "Select a client"}
        </option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
    </div>
  );
}
