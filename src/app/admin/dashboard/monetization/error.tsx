"use client";

import { SecondaryButton } from "@/components/ui-kit/buttons";

export default function MonetizationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred while loading AI Monetization."}
      </p>
      <SecondaryButton type="button" className="mt-4" onClick={() => reset()}>
        Try again
      </SecondaryButton>
    </div>
  );
}
