"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/context/toast-context";
import { requestPasswordReset } from "@/lib/api";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(
    null
  );
  const { showSuccess, showError } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    setIsSubmitting(true);
    try {
      const { message } = await requestPasswordReset(email.trim());
      setBanner({ kind: "success", text: message });
      showSuccess(message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setBanner({ kind: "error", text: msg });
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Reset password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a link to choose a new password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {banner ? (
            <Alert variant={banner.kind === "error" ? "destructive" : "default"}>
              <AlertTitle>{banner.kind === "success" ? "Check your email" : "Something went wrong"}</AlertTitle>
              <AlertDescription>{banner.text}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <PrimaryButton type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send reset link"}
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
