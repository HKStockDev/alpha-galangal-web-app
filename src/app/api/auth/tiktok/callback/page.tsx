import { OAuthCallback } from "@/components/social/oauth-callback";

/** TikTok OAuth 2.0 PKCE callback — must match TIKTOK_CALLBACK_URL. */
export default function TikTokOAuthCallbackPage() {
  return <OAuthCallback platform="tiktok" />;
}
