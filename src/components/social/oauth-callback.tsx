"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  exchangeSocialOAuthCode,
  socialPlatformLabel,
  type ConfigurableSocialPlatform,
} from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";

import { adminSocialAccountsUrl } from "@/lib/social-routes";

const SOCIAL_TAB_DESTINATION = adminSocialAccountsUrl();

export function sessionStorageKeyForPlatform(platform: ConfigurableSocialPlatform): {
  redirectUri: string;
  state: string;
} {
  return {
    redirectUri: `${platform}_oauth_redirect_uri`,
    state: `${platform}_oauth_state`,
  };
}

type Props = {
  platform: ConfigurableSocialPlatform;
};

/**
 * Generic completion page LinkedIn / Facebook redirect back to. The mounted path of
 * each per-platform page MUST match the `redirect_uri` returned by the backend's
 * `authorize-url` endpoint for that platform.
 *
 * `useSearchParams()` requires a Suspense boundary above it during static generation,
 * so the actual logic lives in `OAuthCallbackInner` and this outer wrapper provides
 * the boundary plus a matching loading state.
 */
export function OAuthCallback({ platform }: Props) {
  const label = socialPlatformLabel(platform);
  return (
    <Suspense fallback={<OAuthCallbackPending label={label} />}>
      <OAuthCallbackInner platform={platform} />
    </Suspense>
  );
}

function exchangeDedupKey(platform: ConfigurableSocialPlatform, code: string): string {
  return `${platform}_oauth_exchange_${code}`;
}

function woopCallbackPlatform(raw: string | null, fallback: ConfigurableSocialPlatform): ConfigurableSocialPlatform {
  if (!raw?.trim()) return fallback;
  const upper = raw.toUpperCase();
  if (upper === "LINKEDIN" || upper === "LINKEDIN_PAGES") return "linkedin";
  if (upper === "X") return "x";
  const lower = upper.toLowerCase();
  const allowed: ConfigurableSocialPlatform[] = [
    "linkedin",
    "facebook",
    "instagram",
    "x",
    "tiktok",
  ];
  return (allowed as readonly string[]).includes(lower)
    ? (lower as ConfigurableSocialPlatform)
    : fallback;
}

function OAuthCallbackInner({ platform }: Props) {
  const { accessToken, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"auth" | "exchange">("auth");
  const ranRef = useRef(false);
  const label = socialPlatformLabel(platform);

  useEffect(() => {
    if (ranRef.current) return;

    const woopStatus = searchParams.get("status");
    if (woopStatus === "success") {
      ranRef.current = true;
      const connectedPlatform = woopCallbackPlatform(searchParams.get("platform"), platform);
      router.replace(adminSocialAccountsUrl({ social_connected: connectedPlatform }));
      return;
    }
    if (woopStatus === "error") {
      ranRef.current = true;
      const msg = searchParams.get("error") ?? "OAuth connection failed.";
      router.replace(adminSocialAccountsUrl({ social_error: msg }));
      return;
    }

    if (authLoading) return;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");
    const oauthErrorDescription =
      searchParams.get("error_description") ?? searchParams.get("errorDescription");

    if (oauthError) {
      ranRef.current = true;
      const msg = oauthErrorDescription || oauthError;
      router.replace(adminSocialAccountsUrl({ social_error: msg }));
      return;
    }

    if (!code || !state) {
      setError(`Missing OAuth parameters from ${label} (code/state).`);
      return;
    }

    if (!accessToken) {
      setError(
        "You must be signed in on this same site URL to complete the OAuth flow. " +
          "Open the admin from the same origin you used to click Connect (e.g. the ngrok URL for Facebook), then try again.",
      );
      return;
    }

    const dedupKey = exchangeDedupKey(platform, code);
    try {
      if (sessionStorage.getItem(dedupKey) === "done") {
        router.replace(adminSocialAccountsUrl({ social_connected: platform }));
        return;
      }
      if (sessionStorage.getItem(dedupKey) === "pending") {
        return;
      }
      sessionStorage.setItem(dedupKey, "pending");
    } catch {
      // sessionStorage unavailable; continue best-effort.
    }

    const storageKeys = sessionStorageKeyForPlatform(platform);
    let storedRedirectUri: string | null = null;
    try {
      storedRedirectUri = sessionStorage.getItem(storageKeys.redirectUri);
    } catch {
      // sessionStorage unavailable; fall back to current URL origin+path.
    }
    const redirectUri =
      storedRedirectUri ?? `${window.location.origin}${window.location.pathname}`;

    ranRef.current = true;
    setPhase("exchange");

    (async () => {
      try {
        await Promise.race([
          exchangeSocialOAuthCode(accessToken, platform, {
            code,
            state,
            redirect_uri: redirectUri,
          }),
          new Promise<never>((_, reject) => {
            window.setTimeout(
              () =>
                reject(
                  new Error(
                    "The API did not respond in time. Check that the REST API is running and retry Connect.",
                  ),
                ),
              60_000,
            );
          }),
        ]);
        try {
          sessionStorage.setItem(dedupKey, "done");
          sessionStorage.removeItem(storageKeys.redirectUri);
          sessionStorage.removeItem(storageKeys.state);
        } catch {
          // best-effort cleanup
        }
        router.replace(adminSocialAccountsUrl({ social_connected: platform }));
      } catch (err) {
        try {
          sessionStorage.removeItem(dedupKey);
        } catch {
          // ignore
        }
        const msg = err instanceof Error ? err.message : "OAuth exchange failed.";
        setError(msg);
      }
    })();
  }, [authLoading, accessToken, router, searchParams, platform, label]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {error ? (
          <>
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <h1 className="text-lg font-semibold text-foreground">Could not connect {label}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <SecondaryButton type="button" onClick={() => router.replace(SOCIAL_TAB_DESTINATION)}>
                Back to social accounts
              </SecondaryButton>
              <PrimaryButton type="button" onClick={() => router.replace(SOCIAL_TAB_DESTINATION)}>
                Try again
              </PrimaryButton>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center">
              <Spinner />
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              Finishing {label} connection…
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {authLoading || phase === "auth"
                ? "Checking your admin session…"
                : "Exchanging the authorization code with the API."}
            </p>
            <CheckCircle2 className="sr-only" />
          </>
        )}
      </div>
    </div>
  );
}

function OAuthCallbackPending({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center">
          <Spinner />
        </div>
        <h1 className="text-lg font-semibold text-foreground">
          Finishing {label} connection…
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Preparing the authorization response.
        </p>
      </div>
    </div>
  );
}
