"use client";

import { useState } from "react";
import { useToast } from "@/context/toast-context";
import {
  createOrganizationInvitation,
  type OrgRole,
} from "@/lib/api";
import { SecondaryButton } from "@/components/ui-kit/buttons";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";

export const INVITE_ROLE_OPTIONS: { value: OrgRole; label: string }[] = [
  { value: "org_member", label: "Organization member" },
  { value: "org_admin", label: "Organization admin" },
];

interface InviteTeammateFormProps {
  accessToken: string | null;
  organizationId: string | null;
  onInvitationSent?: () => void;
  submitLabel?: string;
  /** Use plain onboarding styles (rounded zinc inputs) instead of default card inputs */
  variant?: "default" | "onboarding";
  /** Team (per-seat) org: show when billing increases on accept, not on send */
  perSeatBilling?: boolean;
}

export function InviteTeammateForm({
  accessToken,
  organizationId,
  onInvitationSent,
  submitLabel = "Send invitation",
  variant = "default",
  perSeatBilling = false,
}: InviteTeammateFormProps) {
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("org_member");
  const [submitting, setSubmitting] = useState(false);

  const onboardingInputClass =
    "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !organizationId) return;
    setSubmitting(true);
    try {
      await createOrganizationInvitation(
        accessToken,
        organizationId,
        email.trim(),
        role
      );
      showSuccess("Invitation sent");
      setEmail("");
      onInvitationSent?.();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Invitation failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
      {perSeatBilling ? (
        <p className="text-sm text-muted-foreground">
          Invitations are free to send. Your Team subscription is charged for an
          additional seat only after the invitee accepts and joins.
        </p>
      ) : null}
      <div>
        <FormLabel
          htmlFor="invite-email"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Email
        </FormLabel>
        {variant === "onboarding" ? (
          <input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={onboardingInputClass}
          />
        ) : (
          <FormInput
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        )}
      </div>
      <div>
        <FormLabel
          htmlFor="invite-role"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Role
        </FormLabel>
        {variant === "onboarding" ? (
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as OrgRole)}
            className={onboardingInputClass}
          >
            {INVITE_ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        ) : (
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as OrgRole)}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {INVITE_ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        )}
      </div>
      {variant === "onboarding" ? (
        <button
          type="submit"
          disabled={submitting}
          className="flex h-11 w-full items-center justify-center rounded-lg border border-input font-medium text-foreground"
        >
          {submitting ? "Sending…" : submitLabel}
        </button>
      ) : (
        <SecondaryButton type="submit" disabled={submitting}>
          {submitting ? "Sending…" : submitLabel}
        </SecondaryButton>
      )}
    </form>
  );
}
