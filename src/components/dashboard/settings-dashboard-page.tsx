"use client";

import { Suspense, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { changeMyPassword } from "@/lib/api";
import { PrimaryButton } from "@/components/ui-kit/buttons";
import { FormLabel, FormHelperText } from "@/components/ui-kit/forms";
import { SectionCard } from "@/components/ui-kit/cards";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { PasswordInput } from "@/components/ui-kit/password-input";
import { OrgBillingSettings } from "@/components/dashboard/org-billing-settings";
import { OrgCreditsSettings } from "@/components/dashboard/org-credits-settings";

const MIN_PASSWORD_LENGTH = 8;

export function DashboardSettingsPage() {
  const { user, accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showError("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      showError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("New password and confirmation do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      showError("New password must be different from current password.");
      return;
    }

    setSaving(true);
    try {
      const res = await changeMyPassword(accessToken, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showSuccess(res.message || "Password updated successfully.");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const isPlatformAdmin = user.is_platform_admin;

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPlatformAdmin
              ? "Manage account security. Platform admins are not billed through organization subscriptions."
              : "Manage billing, subscriptions, and account security."}
          </p>
        </header>

        <Suspense
          fallback={
            <SectionCard id="billing">
              <LoadingSkeleton variant="card" lines={4} />
            </SectionCard>
          }
        >
          <OrgBillingSettings />
        </Suspense>

        {!isPlatformAdmin ? (
          <Suspense
            fallback={
              <SectionCard id="credits">
                <LoadingSkeleton variant="card" lines={3} />
              </SectionCard>
            }
          >
            <OrgCreditsSettings />
          </Suspense>
        ) : null}

        <SectionCard>
          <h2 className="text-base font-semibold text-foreground">Change password</h2>
          <FormHelperText className="mt-1">
            Use your current password to set a new one for your account.
          </FormHelperText>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <FormLabel htmlFor="current-password">Current password</FormLabel>
              <PasswordInput
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="new-password">New password</FormLabel>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <FormHelperText>At least 8 characters.</FormHelperText>
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="confirm-password">Confirm new password</FormLabel>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <PrimaryButton type="submit" disabled={saving || !accessToken}>
              {saving ? "Updating…" : "Update password"}
            </PrimaryButton>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
