import { OAuthCallback } from "@/components/social/oauth-callback";

/**
 * Instagram (Meta Graph) OAuth callback — redirect URI must match the backend
 * `authorize-url` endpoint (META_INSTAGRAM_CALLBACK_URL_* or META_CALLBACK_URL_*).
 */
export default function InstagramOAuthCallbackPage() {
  return <OAuthCallback platform="instagram" />;
}
