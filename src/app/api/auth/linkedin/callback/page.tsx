import { OAuthCallback } from "@/components/social/oauth-callback";

/**
 * OAuth completion page LinkedIn redirects to. Must match the `redirect_uri`
 * registered with LinkedIn AND the one returned by the backend's `authorize-url`
 * endpoint (currently `/api/auth/linkedin/callback`).
 */
export default function LinkedInOAuthCallbackPage() {
  return <OAuthCallback platform="linkedin" />;
}
