"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  fetchMyOrganizations,
  fetchOrganizationBillingStatus,
  type OrganizationBillingStatus,
} from "@/lib/api";
import { ORG_DASHBOARD } from "@/lib/auth-routing";
import { BillingReturnShell } from "@/components/billing/billing-return-shell";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { Spinner } from "@/components/ui/spinner";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15;

type Phase = "loading" | "polling" | "confirmed" | "pending" | "timeout" | "auth_required" | "error";

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

function formatPeriodEnd(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export function BillingSuccessContent() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [status, setStatus] = useState<OrganizationBillingStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pollAttempt, setPollAttempt] = useState(0);
  const organizationIdRef = useRef<string | null>(null);

  const pollOnce = useCallback(async (): Promise<boolean> => {
    const token = accessToken;
    const orgId = organizationIdRef.current;
    if (!token || !orgId) return false;

    const next = await fetchOrganizationBillingStatus(token, orgId);
    setStatus(next);
    return next.is_entitled;
  }, [accessToken]);

  const runPollCycle = useCallback(async () => {
    setPhase("polling");
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      setPollAttempt(attempt + 1);
      try {
        const entitled = await pollOnce();
        if (entitled) {
          setPhase("confirmed");
          return;
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Could not verify subscription");
        setPhase("error");
        return;
      }
      if (attempt < MAX_POLL_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
    }
    setPhase("timeout");
  }, [pollOnce]);

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      setPhase("auth_required");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const orgs = await fetchMyOrganizations(accessToken);
        if (cancelled) return;
        if (orgs.length === 0) {
          setPhase("pending");
          return;
        }
        organizationIdRef.current = orgs[0].id;
        const entitled = await pollOnce();
        if (cancelled) return;
        if (entitled) {
          setPhase("confirmed");
          return;
        }
        await runPollCycle();
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Could not load billing status");
          setPhase("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, pollOnce, runPollCycle]);

  async function onRefresh() {
    if (!accessToken || !organizationIdRef.current) return;
    setPhase("polling");
    setErrorMessage(null);
    try {
      const entitled = await pollOnce();
      if (entitled) {
        setPhase("confirmed");
        return;
      }
      await runPollCycle();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not verify subscription");
      setPhase("error");
    }
  }

  const settingsHref = `${ORG_DASHBOARD}/settings#billing`;

  return (
    <BillingReturnShell title="Checkout complete">
      <div className="space-y-4 text-sm text-muted-foreground">
        {phase === "loading" || phase === "polling" ? (
          <>
            <div className="flex items-center gap-3 text-foreground">
              <Spinner className="size-5" />
              <span>Confirming your subscription…</span>
            </div>
            <p>
              Stripe has accepted your payment. We are waiting for our servers to sync your
              subscription from Stripe (usually a few seconds).
            </p>
            {phase === "polling" && pollAttempt > 0 ? (
              <p className="text-xs">Checking status ({pollAttempt}/{MAX_POLL_ATTEMPTS})…</p>
            ) : null}
          </>
        ) : null}

        {phase === "confirmed" && status?.subscription ? (
          <>
            <p className="text-foreground font-medium">Your subscription is active.</p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                Plan:{" "}
                <span className="text-foreground">
                  {status.subscription.plan_display_name ?? status.subscription.plan_key}
                </span>
              </li>
              <li>
                Status:{" "}
                <span className="capitalize text-foreground">
                  {formatStatus(status.subscription.status)}
                </span>
              </li>
              {status.subscription.seat_quantity > 1 ? (
                <li>
                  Seats:{" "}
                  <span className="text-foreground">{status.subscription.seat_quantity}</span>
                </li>
              ) : null}
              {status.subscription.status === "trialing" &&
              formatPeriodEnd(status.subscription.trial_end ?? null) ? (
                <li>
                  Trial ends:{" "}
                  <span className="text-foreground">
                    {formatPeriodEnd(status.subscription.trial_end ?? null)}
                  </span>
                </li>
              ) : null}
              {formatPeriodEnd(status.subscription.current_period_end) ? (
                <li>
                  Current period ends:{" "}
                  <span className="text-foreground">
                    {formatPeriodEnd(status.subscription.current_period_end)}
                  </span>
                </li>
              ) : null}
            </ul>
            <p>This information comes from our database after Stripe webhooks—not from the checkout page alone.</p>
          </>
        ) : null}

        {phase === "pending" ? (
          <>
            <p className="text-foreground font-medium">Payment received</p>
            <p>
              We could not find an organization for your account yet. If you just completed
              onboarding, open billing settings once your workspace is ready.
            </p>
          </>
        ) : null}

        {phase === "timeout" ? (
          <>
            <p className="text-foreground font-medium">Still processing</p>
            <p>
              Your payment may have succeeded, but we have not recorded an active subscription
              yet. Webhooks can take a little longer in local development (use Stripe CLI{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">stripe listen</code>).
            </p>
            <p>
              Check <Link href={settingsHref} className="text-primary underline">billing settings</Link>{" "}
              in a minute or refresh below.
            </p>
          </>
        ) : null}

        {phase === "auth_required" ? (
          <>
            <p>
              Sign in to see subscription status for your organization. Your payment on Stripe
              is still processed; access is activated after webhooks sync.
            </p>
            <Link href="/login">
              <PrimaryButton type="button">Sign in</PrimaryButton>
            </Link>
          </>
        ) : null}

        {phase === "error" ? (
          <>
            <p className="text-destructive">{errorMessage ?? "Something went wrong."}</p>
            <p>You can retry or open billing settings to confirm manually.</p>
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        {(phase === "timeout" || phase === "error") && accessToken ? (
          <SecondaryButton type="button" onClick={() => void onRefresh()}>
            Check again
          </SecondaryButton>
        ) : null}
        {phase !== "auth_required" ? (
          <Link href={settingsHref}>
            <PrimaryButton type="button">Billing settings</PrimaryButton>
          </Link>
        ) : null}
        <Link href={ORG_DASHBOARD}>
          <SecondaryButton type="button">Dashboard</SecondaryButton>
        </Link>
      </div>
    </BillingReturnShell>
  );
}
