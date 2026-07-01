import { ADMIN_DASHBOARD } from "@/lib/auth-routing";

export const ADMIN_SOCIAL_BASE = `${ADMIN_DASHBOARD}/social`;
export const ADMIN_SOCIAL_ACCOUNTS = `${ADMIN_SOCIAL_BASE}/accounts`;
export const ADMIN_SOCIAL_POSTS = `${ADMIN_SOCIAL_BASE}/posts`;
export const ADMIN_SOCIAL_PROMPTS = `${ADMIN_SOCIAL_BASE}/prompts`;
export const ADMIN_SOCIAL_COMPOSE = `${ADMIN_SOCIAL_BASE}/compose`;
export const ADMIN_SOCIAL_GENERATIONS = `${ADMIN_SOCIAL_BASE}/generations`;
export const ADMIN_SOCIAL_MEDIA = `${ADMIN_SOCIAL_BASE}/media`;
export const ADMIN_SOCIAL_WEBHOOKS = `${ADMIN_SOCIAL_BASE}/webhooks`;

/** OAuth callback completion redirect (query flags appended by oauth-callback). */
export const ADMIN_SOCIAL_OAUTH_DESTINATION = ADMIN_SOCIAL_ACCOUNTS;

export function adminSocialAccountsUrl(params?: Record<string, string>): string {
  if (!params || !Object.keys(params).length) return ADMIN_SOCIAL_ACCOUNTS;
  const qs = new URLSearchParams(params);
  return `${ADMIN_SOCIAL_ACCOUNTS}?${qs.toString()}`;
}
