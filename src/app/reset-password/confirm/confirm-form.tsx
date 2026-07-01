"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/context/toast-context";
import { confirmPasswordReset } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PrimaryButton } from "@/components/ui-kit/buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui-kit/password-input";

export function ResetPasswordConfirmForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryString = useMemo(() => searchParams.toString(), [searchParams]);

  const token = useMemo(() => {
    const query = new URLSearchParams(queryString);
    return query.get("token") ?? "";
  }, [queryString]);

  const hasToken = Boolean(token);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      showError("Passwords do not match");
      return;
    }
    if (!hasToken) {
      showError("Invalid or missing reset link. Request a new password reset email.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { message } = await confirmPasswordReset({
        new_password: password,
        token,
      });
      showSuccess(message);
      router.replace("/login");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Set new password</CardTitle>
          <CardDescription>Choose a strong password for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasToken ? (
            <Alert>
              <AlertTitle>Invalid link</AlertTitle>
              <AlertDescription>
                This page needs a valid reset link from your email. If you opened this page
                directly, go back and use the link we sent you, or request a new reset.
              </AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                disabled={!hasToken}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <PasswordInput
                id="confirm-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                disabled={!hasToken}
              />
            </div>

            <PrimaryButton
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || !hasToken}
            >
              {isSubmitting ? "Updating…" : "Update password"}
            </PrimaryButton>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            ← Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
