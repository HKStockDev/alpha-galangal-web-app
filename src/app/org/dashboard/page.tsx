"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SecondaryButton } from "@/components/ui-kit/buttons";
import { SectionCard } from "@/components/ui-kit/cards";

export default function DashboardPage() {
  const { logout } = useAuth();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 bg-muted/30 p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Organization Dashboard</h1>
        <p className="text-sm text-muted-foreground">Choose a section to continue.</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Event sentiment scores</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View positive/negative event counts, pressure, trend, and sentiment scores by ticker.
        </p>
        <Button asChild className="mt-4">
          <Link href="/org/dashboard/event-sentiment">Open event sentiment scores</Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Jobs formulas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View jobs-derived factor values, including 30d/90d jobs growth, workforce growth, and hiring spike.
        </p>
        <Button asChild className="mt-4">
          <Link href="/org/dashboard/jobs-formulas">Open jobs formulas</Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Jons formulas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View values for Jon-related investor formulas across supported models.
        </p>
        <Button asChild className="mt-4">
          <Link href="/org/dashboard/jons-formulas">Open Jons formulas</Link>
        </Button>
      </div>

      <div>
        <Button type="button" variant="outline" onClick={() => logout()}>
          Log out
        </Button>
      </div>
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Organization Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organization-level workspace and research tools.
          </p>
        </header>
        <SectionCard className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Manage your organization workspace from the navigation on the left.
          </p>
          <SecondaryButton type="button" onClick={() => logout()}>
            Log out
          </SecondaryButton>
        </SectionCard>
      </div>
    </div>
    </div>
  );
}
