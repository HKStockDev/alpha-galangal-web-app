"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { dashboardBaseFromPathname } from "@/lib/auth-routing";
import { useToast } from "@/context/toast-context";
import {
  runAlphaGalangalCommittee,
  type AlphaGalangalCommitteeRunResult,
} from "@/lib/api";
import { SecondaryButton } from "@/components/ui-kit/buttons";
import { MetricCard, SectionCard } from "@/components/ui-kit/cards";
import { Spinner } from "@/components/ui/spinner";

const MEMBER_LABELS: Record<keyof AlphaGalangalCommitteeRunResult["member_scores"], string> = {
  buffett: "Buffett",
  burry: "Burry",
  druckenmiller: "Druckenmiller",
  wood: "Wood",
  graham: "Graham",
  lynch: "Lynch",
};

function RunPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const basePath = dashboardBaseFromPathname(pathname);
  const { accessToken } = useAuth();
  const { showError } = useToast();
  const [result, setResult] = useState<AlphaGalangalCommitteeRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const ticker = searchParams.get("ticker");

  useEffect(() => {
    if (!ticker || !accessToken) {
      if (!ticker) {
        router.replace(basePath);
      }
      setIsLoading(false);
      return;
    }

    setError(null);
    runAlphaGalangalCommittee(ticker, accessToken)
      .then(setResult)
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Run failed";
        setError(msg);
        showError(msg);
      })
      .finally(() => setIsLoading(false));
  }, [ticker, accessToken, router, showError, basePath]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="text-center">
          <Spinner className="mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">
            Running committee analysis for {ticker ?? "…"}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Run Failed: {ticker}
          </h1>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {error}
            </p>
            <p className="mt-3 text-xs text-red-700 dark:text-red-300">
              For 500 errors: ensure GEMINI_API_KEY is set in the API environment
              and the active committee prompt exists in the database.
              Check backend logs for details.
            </p>
          </div>
          <SecondaryButton type="button" onClick={() => router.push(basePath)}>
            Back to Dashboard
          </SecondaryButton>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Committee Results: {result.ticker}
        </h1>

        <div className="grid gap-6 sm:grid-cols-2">
          <MetricCard>
            <h2 className="text-sm font-medium text-foreground">
              Weighted Score
            </h2>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {result.weighted_score.toFixed(1)}
            </p>
          </MetricCard>
          <MetricCard>
            <h2 className="text-sm font-medium text-foreground">
              Confidence
            </h2>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {result.confidence}%
            </p>
          </MetricCard>
        </div>

        <SectionCard>
          <h2 className="text-sm font-medium text-foreground">
            Member Scores
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(result.member_scores) as (keyof typeof result.member_scores)[]).map(
              (key) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <span className="text-sm font-medium text-foreground">
                    {MEMBER_LABELS[key]}
                  </span>
                  <span className="font-mono text-lg font-semibold text-foreground">
                    {result.member_scores[key]}
                  </span>
                </div>
              )
            )}
          </div>
        </SectionCard>

        <SectionCard className="mt-8">
          <h2 className="text-sm font-medium text-foreground">
            Summary
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            {result.summary}
          </p>
        </SectionCard>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <SectionCard>
            <h2 className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Key Strengths
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-foreground">
              {result.key_strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard>
            <h2 className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Key Risks
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-foreground">
              {result.key_risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="mt-8">
          <SecondaryButton type="button" onClick={() => router.push(basePath)}>
            Back to Dashboard
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

export default function RunPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center p-8">
          <Spinner />
        </div>
      }
    >
      <RunPageContent />
    </Suspense>
  );
}
