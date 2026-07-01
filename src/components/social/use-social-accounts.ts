"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  getSocialAuthorizeUrl,
  listPrecisionSocialAccounts,
  refreshSocialAccountToken,
  socialPlatformLabel,
  type ConfigurableSocialPlatform,
  type SocialAccountRow,
} from "@/lib/api";
import { sessionStorageKeyForPlatform } from "@/components/social/oauth-callback";
import { isConfigurableSocialPlatform } from "@/components/social/social-platform-ui";
import { ADMIN_SOCIAL_ACCOUNTS } from "@/lib/social-routes";

export const QS_FLAG_CONNECTED = "social_connected";
export const QS_FLAG_ERROR = "social_error";

export function useSocialAccounts() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<SocialAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] =
    useState<ConfigurableSocialPlatform | null>(null);

  const loadRows = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await listPrecisionSocialAccounts(accessToken);
      setRows(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load social accounts");
    } finally {
      setLoading(false);
    }
  }, [accessToken, showError]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  // After OAuth in a new tab, refresh when the user returns to this page.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadRows();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadRows]);

  useEffect(() => {
    const connected = searchParams.get(QS_FLAG_CONNECTED);
    const error = searchParams.get(QS_FLAG_ERROR);
    if (!connected && !error) return;
    if (connected) {
      const label = isConfigurableSocialPlatform(connected)
        ? socialPlatformLabel(connected)
        : connected;
      showSuccess(`${label} account connected.`);
    }
    if (error) showError(decodeURIComponent(error));
    const next = new URLSearchParams(searchParams.toString());
    next.delete(QS_FLAG_CONNECTED);
    next.delete(QS_FLAG_ERROR);
    const qs = next.toString();
    router.replace(qs ? `${ADMIN_SOCIAL_ACCOUNTS}?${qs}` : ADMIN_SOCIAL_ACCOUNTS, {
      scroll: false,
    });
    if (connected) void loadRows();
  }, [searchParams, showSuccess, showError, router, loadRows]);

  const handleConnect = useCallback(
    async (platform: ConfigurableSocialPlatform) => {
      if (!accessToken || connectingPlatform) return;
      setConnectingPlatform(platform);
      try {
        const redirectUri = `${window.location.origin}/api/auth/${platform}/callback`;
        const { authorization_url, state, redirect_uri: resolvedRedirectUri } =
          await getSocialAuthorizeUrl(accessToken, platform, { redirectUri });
        try {
          const keys = sessionStorageKeyForPlatform(platform);
          sessionStorage.setItem(keys.redirectUri, resolvedRedirectUri);
          if (state) {
            sessionStorage.setItem(keys.state, state);
          }
        } catch {
          // sessionStorage may be unavailable; not fatal.
        }
        const oauthTab = window.open(authorization_url, "_blank", "noopener,noreferrer");
        if (!oauthTab) {
          showError("Popup blocked. Allow popups for this site and try again.");
        }
        setConnectingPlatform(null);
      } catch (err) {
        showError(
          err instanceof Error
            ? err.message
            : `Could not start ${socialPlatformLabel(platform)} OAuth`
        );
        setConnectingPlatform(null);
      }
    },
    [accessToken, connectingPlatform, showError]
  );

  const handleRefresh = useCallback(
    async (account: SocialAccountRow) => {
      if (!accessToken || refreshingId) return;
      if (!isConfigurableSocialPlatform(account.platform)) {
        showError(`Token refresh not supported for ${account.platform} yet.`);
        return;
      }
      setRefreshingId(account.id);
      try {
        const updated = await refreshSocialAccountToken(
          accessToken,
          account.platform,
          account.id
        );
        if (updated) {
          setRows((prev) => prev.map((r) => (r.id === account.id ? { ...r, ...updated } : r)));
        } else {
          await loadRows();
        }
        showSuccess("Token refreshed.");
      } catch (err) {
        showError(err instanceof Error ? err.message : "Refresh failed. Try reconnecting.");
      } finally {
        setRefreshingId(null);
      }
    },
    [accessToken, refreshingId, loadRows, showError, showSuccess]
  );

  return {
    rows,
    loading,
    refreshingId,
    connectingPlatform,
    loadRows,
    handleConnect,
    handleRefresh,
  };
}
