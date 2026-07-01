"use client";

import { GhostButton, PrimaryButton } from "@/components/ui-kit/buttons";
import type { AssistantPendingAction } from "@/lib/api";

type Props = {
  pendingAction: AssistantPendingAction;
  disabled?: boolean;
  onConfirm: () => void;
  onReject: () => void;
};

export function OrgAssistantPendingActionCard({
  pendingAction,
  disabled,
  onConfirm,
  onReject,
}: Props) {
  return (
    <div className="mr-auto max-w-md rounded-2xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">Confirm action</p>
      <p className="mt-1 text-muted-foreground">{pendingAction.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <PrimaryButton type="button" disabled={disabled} onClick={onConfirm}>
          Confirm
        </PrimaryButton>
        <GhostButton type="button" disabled={disabled} onClick={onReject}>
          Reject
        </GhostButton>
      </div>
    </div>
  );
}
