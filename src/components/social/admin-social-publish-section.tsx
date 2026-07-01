"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  listConvictionSocialAccounts,
  previewSocialPostCaption,
  publishSocialPost,
  socialPlatformLabel,
  SOCIAL_PUBLISH_PLATFORMS,
  type SocialAccountRow,
  type SocialPublishPlatform,
} from "@/lib/api";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  shareTitle: string;
  /** Optional public page URL; defaults to current browser URL. */
  linkUrl?: string;
  ticker?: string;
  shareSummary?: string;
  className?: string;
};

export function AdminSocialPublishSection({
  shareTitle,
  linkUrl: linkUrlProp,
  ticker,
  shareSummary,
  className,
}: Props) {
  const pathname = usePathname() ?? "/";
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();

  const [pageUrl, setPageUrl] = useState(linkUrlProp ?? "");
  const [accounts, setAccounts] = useState<SocialAccountRow[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [platform, setPlatform] = useState<SocialPublishPlatform>("linkedin");
  const [accountId, setAccountId] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (linkUrlProp) {
      setPageUrl(linkUrlProp);
      return;
    }
    if (typeof window === "undefined") return;
    setPageUrl(window.location.origin + pathname);
  }, [linkUrlProp, pathname]);

  useEffect(() => {
    if (!accessToken) return;
    setLoadingAccounts(true);
    listConvictionSocialAccounts(accessToken)
      .then(setAccounts)
      .catch((err) =>
        showError(err instanceof Error ? err.message : "Failed to load social accounts")
      )
      .finally(() => setLoadingAccounts(false));
  }, [accessToken, showError]);

  const publishAccounts = useMemo(
    () =>
      accounts.filter(
        (a) =>
          a.status === "active" &&
          (SOCIAL_PUBLISH_PLATFORMS as readonly string[]).includes(a.platform)
      ),
    [accounts]
  );

  const platformAccounts = useMemo(
    () => publishAccounts.filter((a) => a.platform === platform),
    [publishAccounts, platform]
  );

  useEffect(() => {
    if (platformAccounts.some((a) => a.id === accountId)) return;
    setAccountId(platformAccounts[0]?.id ?? "");
  }, [platformAccounts, accountId]);

  const handlePreview = useCallback(async () => {
    if (!accessToken || !pageUrl) return;
    setPreviewing(true);
    setPublishedUrl(null);
    try {
      const result = await previewSocialPostCaption(accessToken, {
        platform,
        link_url: pageUrl,
        share_title: shareTitle,
        share_summary: shareSummary,
        ticker,
        organization_name: "Conviction",
      });
      setCaption(result.caption);
      if (result.suggested_social_account_id) {
        setAccountId(result.suggested_social_account_id);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewing(false);
    }
  }, [accessToken, pageUrl, platform, shareTitle, shareSummary, ticker, showError]);

  const handlePublish = useCallback(async () => {
    if (!accessToken || !accountId || !caption.trim()) return;
    setPublishing(true);
    setPublishedUrl(null);
    try {
      const result = await publishSocialPost(accessToken, {
        social_account_id: accountId,
        caption: caption.trim(),
        link_url: pageUrl || undefined,
        publish: true,
      });
      showSuccess(`Published to ${socialPlatformLabel(platform)}.`);
      if (result.external_post_url) {
        setPublishedUrl(result.external_post_url);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }, [accessToken, accountId, caption, pageUrl, platform, showError, showSuccess]);

  if (loadingAccounts) {
    return (
      <div className={cn("rounded-2xl border border-border/80 bg-muted/20 px-4 py-4", className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading connected social accounts…
        </div>
      </div>
    );
  }

  if (!publishAccounts.length) {
    return (
      <div className={cn("rounded-2xl border border-border/80 bg-muted/20 px-4 py-4", className)}>
        <p className="text-sm font-semibold text-foreground">Publish to social (connected accounts)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Connect Facebook, LinkedIn, or X under{" "}
          <Link
            href="/admin/dashboard/social/accounts"
            className="underline hover:text-foreground"
          >
            Social media → Connected accounts
          </Link>{" "}
          to publish directly from here.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border/80 bg-muted/20 px-4 py-4 sm:px-5", className)}>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Send className="h-4 w-4 text-muted-foreground" aria-hidden />
        Publish to connected account
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Generate an AI caption, review it, then publish via your connected OAuth accounts (max 3 posts
        per platform per day).
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="social-publish-platform">Platform</Label>
          <Select
            value={platform}
            onValueChange={(v) => setPlatform(v as SocialPublishPlatform)}
          >
            <SelectTrigger id="social-publish-platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOCIAL_PUBLISH_PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {socialPlatformLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="social-publish-account">Account</Label>
          <Select value={accountId} onValueChange={setAccountId} disabled={!platformAccounts.length}>
            <SelectTrigger id="social-publish-account">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {platformAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.account_label ?? a.external_account_name ?? a.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <Label htmlFor="social-publish-caption">Caption</Label>
        <Textarea
          id="social-publish-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={5}
          placeholder="Generate a caption or write your own…"
        />
      </div>

      {pageUrl ? (
        <p className="mt-2 truncate text-xs text-muted-foreground" title={pageUrl}>
          Link: {pageUrl}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <SecondaryButton type="button" disabled={previewing || !pageUrl} onClick={() => void handlePreview()}>
          {previewing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate caption
            </>
          )}
        </SecondaryButton>
        <PrimaryButton
          type="button"
          disabled={publishing || !accountId || !caption.trim()}
          onClick={() => void handlePublish()}
        >
          {publishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing…
            </>
          ) : (
            "Approve & publish"
          )}
        </PrimaryButton>
      </div>

      {publishedUrl ? (
        <p className="mt-3 text-xs text-emerald-600">
          Live post:{" "}
          <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="underline">
            {publishedUrl}
          </a>
        </p>
      ) : null}
    </div>
  );
}
