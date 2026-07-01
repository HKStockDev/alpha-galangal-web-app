import type { User } from "@/lib/api";

export const ADMIN_DASHBOARD = "/admin/dashboard" as const;
export const ORG_DASHBOARD = "/org/dashboard" as const;
export const ONBOARDING_PATH = "/onboarding" as const;

export type DashboardBasePath = typeof ADMIN_DASHBOARD | typeof ORG_DASHBOARD;

/** Default post-auth destination: super admin → admin dashboard; org user with orgs → org dashboard; else onboarding. */
export function defaultDashboardPath(
  user: User,
  hasOrganizations: boolean
): string {
  if (user.is_platform_admin) return ADMIN_DASHBOARD;
  if (hasOrganizations) return ORG_DASHBOARD;
  return ONBOARDING_PATH;
}

/** Infer `/org/dashboard` vs `/admin/dashboard` from the current pathname (for shared pages under both trees). */
export function dashboardBaseFromPathname(pathname: string | null): DashboardBasePath {
  if (pathname?.startsWith("/admin/dashboard")) return ADMIN_DASHBOARD;
  return ORG_DASHBOARD;
}
