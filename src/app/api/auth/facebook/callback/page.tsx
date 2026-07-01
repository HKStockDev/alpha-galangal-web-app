import { OAuthCallback } from "@/components/social/oauth-callback";

/**
 * OAuth completion page Meta/Facebook redirects to. Must match the `redirect_uri`
 * registered in the Meta app AND the one returned by the backend's `authorize-url`
 * endpoint (currently `/api/auth/facebook/callback`).
 */
export default function FacebookOAuthCallbackPage() {
  return <OAuthCallback platform="facebook" />;
}
