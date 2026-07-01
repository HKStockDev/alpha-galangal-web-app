"use client";

import Link from "next/link";
import { GhostButton, PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { SectionCard } from "@/components/ui-kit/cards";
import { ADMIN_SOCIAL_POSTS } from "@/lib/social-routes";
import type { SocialPublishMode } from "@/lib/api";

type ComposeActionsBarProps = {
  publishMode: SocialPublishMode;
  validating: boolean;
  submitting: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  onValidate: () => void;
  onSubmit: () => void;
  successMessage: string | null;
  onReset: () => void;
};

export function ComposeActionsBar({
  publishMode,
  validating,
  submitting,
  validationErrors,
  validationWarnings,
  onValidate,
  onSubmit,
  successMessage,
  onReset,
}: ComposeActionsBarProps) {
  const actionLabel =
    publishMode === "draft"
      ? "Save draft"
      : publishMode === "schedule"
        ? "Schedule post"
        : "Publish now";

  return (
    <SectionCard>
      <h3 className="text-base font-semibold text-foreground">Review & send</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Validate against Woop rules, then publish or schedule.
      </p>

      {validationErrors.length ? (
        <ul className="mt-3 space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {validationErrors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      ) : null}

      {validationWarnings.length ? (
        <ul className="mt-3 space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
          {validationWarnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {successMessage ? (
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
          <p>{successMessage}</p>
          <div className="mt-2 flex gap-2">
            <Link href={ADMIN_SOCIAL_POSTS} className="text-primary underline text-xs">
              View post history
            </Link>
            <GhostButton type="button" className="text-xs" onClick={onReset}>
              Compose another
            </GhostButton>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <SecondaryButton type="button" disabled={validating || submitting} onClick={onValidate}>
          {validating ? "Validating…" : "Validate"}
        </SecondaryButton>
        <PrimaryButton
          type="button"
          disabled={submitting || validationErrors.length > 0}
          onClick={onSubmit}
        >
          {submitting ? "Submitting…" : actionLabel}
        </PrimaryButton>
      </div>
    </SectionCard>
  );
}
