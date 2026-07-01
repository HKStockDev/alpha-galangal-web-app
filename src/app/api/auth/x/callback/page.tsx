import { OAuthCallback } from "@/components/social/oauth-callback";

/** X (Twitter) OAuth 2.0 PKCE callback — must match X_CALLBACK_URL. */
export default function XOAuthCallbackPage() {
  return <OAuthCallback platform="x" />;
}
