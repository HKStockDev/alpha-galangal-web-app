import type { BillingPortalFlow } from "@/lib/billing-plans";

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  user: { id: string; email: string; is_platform_admin: boolean };
}

export interface User {
  id: string;
  email: string;
  is_platform_admin: boolean;
  full_name: string | null;
  avatar_url: string | null;
}

function normalizeUser(data: User): User {
  return {
    ...data,
    avatar_url: data.avatar_url ?? null,
    full_name: data.full_name ?? null,
  };
}

/** Organization membership role (super admin is `User.is_platform_admin`). */
export type OrgRole = "org_admin" | "org_member";

function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  // Relative path; Next.js rewrites to the Nest API.
  if (url.startsWith("/")) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${url.replace(/\/$/, "")}`;
    }
    const port = process.env.PORT ?? "3000";
    return `http://localhost:${port}${url.replace(/\/$/, "")}`;
  }
  return url.replace(/\/$/, "");
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const baseUrl = getApiUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    const msg =
      err instanceof Error && err.message.toLowerCase().includes("fetch")
        ? "Cannot connect to API. Is the backend running on port 3001?"
        : err instanceof Error
          ? err.message
          : "Network error";
    throw new Error(msg);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const body = error as { message?: string; statusCode?: number };
    throw new Error(body.message ?? `Login failed (${response.status})`);
  }

  return response.json();
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}/auth/password-reset/request`;
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  console.info("[password-reset] POST", url, { emailLength: email.trim().length });
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch (err) {
    const elapsed =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - started;
    console.error("[password-reset] network error", { elapsedMs: Math.round(elapsed), err });
    throw err instanceof Error ? err : new Error(String(err));
  }
  const elapsed =
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - started;
  const bodyText = await response.text();
  console.info("[password-reset] response", {
    status: response.status,
    ok: response.ok,
    elapsedMs: Math.round(elapsed),
    bodyPreview: bodyText.slice(0, 500),
  });
  if (!response.ok) {
    let body: { message?: string | string[] } = {};
    try {
      body = JSON.parse(bodyText) as { message?: string | string[] };
    } catch {
      body = {};
    }
    const msg = Array.isArray(body.message)
      ? body.message.join("; ")
      : body.message;
    console.error("[password-reset] request failed", { status: response.status, msg });
    throw new Error(msg ?? `Request failed (${response.status})`);
  }
  try {
    return JSON.parse(bodyText) as { message: string };
  } catch {
    console.error("[password-reset] invalid JSON body", bodyText);
    throw new Error("Invalid response from server");
  }
}

export interface PasswordResetConfirmPayload {
  new_password: string;
  token: string;
}

export async function confirmPasswordReset(
  payload: PasswordResetConfirmPayload
): Promise<{ message: string }> {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}/auth/password-reset/confirm`;
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  const safeLog = {
    hasToken: Boolean(payload.token),
  };
  console.info("[password-reset/confirm] POST", url, safeLog);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const elapsed =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - started;
    console.error("[password-reset/confirm] network error", { elapsedMs: Math.round(elapsed), err });
    throw err instanceof Error ? err : new Error(String(err));
  }
  const elapsed =
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - started;
  const bodyText = await response.text();
  console.info("[password-reset/confirm] response", {
    status: response.status,
    ok: response.ok,
    elapsedMs: Math.round(elapsed),
    bodyPreview: bodyText.slice(0, 500),
  });
  if (!response.ok) {
    let body: { message?: string | string[] } = {};
    try {
      body = JSON.parse(bodyText) as { message?: string | string[] };
    } catch {
      body = {};
    }
    const msg = Array.isArray(body.message)
      ? body.message.join("; ")
      : body.message;
    console.error("[password-reset/confirm] failed", { status: response.status, msg });
    throw new Error(msg ?? `Confirm failed (${response.status})`);
  }
  try {
    return JSON.parse(bodyText) as { message: string };
  } catch {
    console.error("[password-reset/confirm] invalid JSON body", bodyText);
    throw new Error("Invalid response from server");
  }
}

export async function fetchCurrentUser(accessToken: string): Promise<User> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/auth/me`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  const data = (await response.json()) as User;
  return normalizeUser(data);
}

export async function registerAccount(
  email: string,
  password: string,
  full_name?: string
): Promise<LoginResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name: full_name || undefined }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const body = error as { message?: string | string[] };
    const msg = Array.isArray(body.message)
      ? body.message.join("; ")
      : body.message;
    throw new Error(msg ?? `Registration failed (${response.status})`);
  }
  return response.json();
}

export async function updateMyProfile(
  accessToken: string,
  full_name: string
): Promise<User> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/auth/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ full_name }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to update profile"
    );
  }
  return normalizeUser((await response.json()) as User);
}

export async function uploadMyAvatar(
  accessToken: string,
  file: File
): Promise<User> {
  const baseUrl = getApiUrl();
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${baseUrl}/auth/me/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to upload image"
    );
  }
  return normalizeUser((await response.json()) as User);
}

export async function deleteMyAvatar(accessToken: string): Promise<User> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/auth/me/avatar`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to remove image"
    );
  }
  return normalizeUser((await response.json()) as User);
}

export async function changeMyPassword(
  accessToken: string,
  body: { current_password: string; new_password: string }
): Promise<{ message: string }> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/auth/me/password`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to update password")
    );
  }
  return response.json();
}

export interface MyOrganization {
  id: string;
  name: string;
  slug: string;
  organization_type: string;
  status: string;
  created_at: string;
  role: OrgRole;
  membership_status: string;
  logo_url?: string | null;
  domain?: string | null;
  legal_name?: string | null;
}

export async function fetchMyOrganizations(
  accessToken: string
): Promise<MyOrganization[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/organizations/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to load organizations"
    );
  }
  return response.json();
}

export type OrganizationMembershipStatus = "active" | "invited" | "disabled";

export interface OrganizationMembershipRow {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  status: OrganizationMembershipStatus;
  joined_at: string;
  email?: string;
  full_name?: string | null;
}

export async function listOrganizationMemberships(
  accessToken: string,
  organizationId: string
): Promise<OrganizationMembershipRow[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/memberships`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to load team members")
    );
  }
  return response.json();
}

export async function removeOrganizationMembership(
  accessToken: string,
  organizationId: string,
  membershipId: string
): Promise<{ success: boolean; seat_quantity_updated?: boolean }> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/memberships/${membershipId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Could not remove team member")
    );
  }
  return response.json();
}

export interface BillingCheckoutResponse {
  url: string;
  sessionId: string;
}

export interface BillingPortalResponse {
  url: string;
}

export interface OrganizationBillingStatus {
  organization_id: string;
  has_stripe_customer: boolean;
  subscription: {
    status: string;
    plan_key: string;
    plan_display_name: string | null;
    seat_quantity: number;
    current_period_end: string | null;
    trial_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
  is_entitled: boolean;
  can_manage_in_stripe: boolean;
  free_trial_available: boolean;
}

export interface BillingSetupStatus {
  stripe_secret_key_configured: boolean;
  stripe_webhook_secret_configured: boolean;
  checkout_urls_configured: boolean;
  active_plan_count: number;
  plans_with_placeholder_stripe_ids: string[];
  checkout_ready: boolean;
  webhook_ready: boolean;
  portal_configuration_id: string | null;
  portal_subscription_update_enabled: boolean;
  portal_product_count: number;
  portal_price_count: number;
  portal_switch_ready: boolean;
  blockers: string[];
}

export interface PortalPlanProductCorrection {
  plan_key: string;
  stripe_price_id: string;
  db_stripe_product_id: string;
  stripe_actual_product_id: string;
  corrected_in_db: boolean;
}

export interface PortalConfigurationSyncResult {
  configuration_id: string;
  product_count: number;
  price_count: number;
  products: Array<{ product_id: string; price_ids: string[]; per_seat: boolean }>;
  product_id_corrections: PortalPlanProductCorrection[];
}

export interface BillingPlanCatalogItem {
  plan_key: string;
  display_name: string | null;
  billing_interval: string | null;
  currency: string | null;
  amount_cents: number | null;
  unit_amount_cents: number | null;
  pricing_model: "flat" | "per_seat";
  seat_based_enabled: boolean;
  tier: "professional" | "team" | "enterprise";
}

export async function fetchOrganizationBillingPlans(
  accessToken: string,
  organizationId: string
): Promise<BillingPlanCatalogItem[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/billing/plans`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to load subscription plans"
    );
  }
  return response.json();
}

export async function endOrganizationTrialEarly(
  accessToken: string,
  organizationId: string
): Promise<{ updated: true }> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/billing/end-trial`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to end trial"
    );
  }
  return response.json();
}

export async function changeOrganizationSubscriptionPlan(
  accessToken: string,
  organizationId: string,
  body: { plan_key: string; seat_quantity?: number }
): Promise<{ updated: true }> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/billing/change-plan`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to change subscription plan"
    );
  }
  return response.json();
}

export async function fetchOrganizationBillingStatus(
  accessToken: string,
  organizationId: string
): Promise<OrganizationBillingStatus> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/billing/status`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to load subscription status"
    );
  }
  return response.json();
}

export async function createOrganizationBillingCheckout(
  accessToken: string,
  organizationId: string,
  body: { plan_key: string; seat_quantity?: number; start_trial?: boolean }
): Promise<BillingCheckoutResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/billing/checkout`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to start checkout"
    );
  }
  return response.json();
}

export async function createOrganizationBillingPortal(
  accessToken: string,
  organizationId: string,
  body?: { flow?: BillingPortalFlow }
): Promise<BillingPortalResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/billing/portal`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to open billing portal"
    );
  }
  return response.json();
}

/** CON-98: sync Stripe Portal switch-plan catalog from subscription_plans. */
export async function syncBillingPortalConfiguration(
  accessToken: string
): Promise<PortalConfigurationSyncResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/billing/setup/sync-portal`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to sync Stripe portal configuration"
    );
  }
  return response.json();
}

/** CON-98 S1: platform-admin readiness for Stripe + catalog (GET /billing/setup). */
export async function fetchBillingSetupStatus(
  accessToken: string
): Promise<BillingSetupStatus> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/billing/setup`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to load billing setup status"
    );
  }
  return response.json();
}

/** Tags an org may choose for equity display filter (SKE-78). */
export interface OrgEquityTagOption {
  tag_id: string;
  name: string;
  slug: string;
  group: string;
}

export interface OrgEquityRow {
  id: string;
  ticker: string;
  name: string;
  market_cap: number | null;
  primary_exchange: string | null;
  /** CON-50: sentiment/event metrics derived from CON-51 factors. */
  positive_event_count_30d?: number | null;
  negative_event_count_30d?: number | null;
  positive_event_count_90d?: number | null;
  negative_event_count_90d?: number | null;
  event_pressure_30d?: number | null;
  event_pressure_90d?: number | null;
  event_pressure_trend?: number | null;
  sentiment_score?: number | null;
  /** CON-90: jobs derived formula values from entity_factor_values (period_key = 'na'). */
  /** open_jobs_count / employee_count_estimate * 100; null if headcount missing or zero. */
  jobs_per_100_employees?: number | null;
  jobs_growth_rate_30d?: number | null;
  jobs_growth_rate_90d?: number | null;
  workforce_growth_rate_90d?: number | null;
  hiring_spike_indicator?: number | null;
  /** From list_organization_equities_v2 after migration 20260421130000 */
  sector_title?: string | null;
  industry_title?: string | null;
  sub_industry_title?: string | null;
  sector_cycle?: number | null;
  industry_cycle?: number | null;
  sub_industry_cycle?: number | null;
}

export interface OrgEquitiesListResult {
  items: OrgEquityRow[];
  has_more: boolean;
  offset: number;
  limit: number;
  total_count: number;
}

/**
 * Path segment for `GET /organizations/:organizationId/equities` when the user is a platform admin.
 * `OrgMemberGuard` skips membership checks; `from_securities=true` listing ignores organization scope.
 */
export const PLATFORM_ADMIN_ORG_ROUTE_PLACEHOLDER =
  "00000000-0000-0000-0000-000000000000" as const;

export interface OrgEquityTagFilterResponse {
  tag_ids: string[];
  tags: OrgEquityTagOption[];
}

export interface OrgEquityDetailTag {
  tag_id: string;
  name: string;
  slug: string;
  group: string;
  source: string;
  confidence: number;
  as_of_date: string;
}

export interface OrgEquityDetailExposure {
  exposure_id: string;
  name: string;
  slug: string;
  category: string;
  polarity: number | null;
  direction: string;
  strength: number;
  confidence: number;
  source: string;
  as_of_date: string;
}

/** CON-120: verifiable evidence behind formula scores. */
export interface OrgEquityAnchorItem {
  id: string;
  kind: "insider" | "hedge_fund" | "earnings" | "macro";
  label: string;
  value: string;
  detail: string | null;
  as_of: string | null;
  source: string;
}

export interface OrgEquityAnchors {
  insider: OrgEquityAnchorItem[];
  hedge_fund: OrgEquityAnchorItem[];
  earnings: OrgEquityAnchorItem[];
  macro: OrgEquityAnchorItem[];
}

export interface OrgEquityDetails {
  security: {
    id: string;
    ticker: string;
    name: string;
    market: string;
    locale: string;
    primary_exchange: string | null;
    market_cap: number | null;
    description: string | null;
    homepage_url: string | null;
    total_employees: number | null;
    list_date: string | null;
    type_description: string | null;
  };
  taxonomy: {
    sector_title: string | null;
    industry_title: string | null;
    sub_industry_title: string | null;
    sector_cycle: number | null;
    industry_cycle: number | null;
    sub_industry_cycle: number | null;
  };
  scores: {
    fundamental_constriction_score: number | null;
    net_exposure_score: number | null;
    insider_precision_score: number | null;
    political_score: number | null;
  };
  score_breakdowns: {
    fundamental_constriction_score: Record<string, unknown> | null;
    net_exposure_score: Record<string, unknown> | null;
    insider_precision_score: Record<string, unknown> | null;
    political_score: Record<string, unknown> | null;
  };
  sentiment: {
    positive_event_count_30d: number | null;
    negative_event_count_30d: number | null;
    positive_event_count_90d: number | null;
    negative_event_count_90d: number | null;
    event_pressure_30d: number | null;
    event_pressure_90d: number | null;
    event_pressure_trend: number | null;
  };
  jobs: {
    jobs_per_100_employees: number | null;
    jobs_growth_rate_30d: number | null;
    jobs_growth_rate_90d: number | null;
    workforce_growth_rate_90d: number | null;
    hiring_spike_indicator: number | null;
  };
  tags: OrgEquityDetailTag[];
  exposures: OrgEquityDetailExposure[];
  anchors: OrgEquityAnchors;
}

export async function listOrganizationEquityTagOptions(
  accessToken: string,
  organizationId: string
): Promise<OrgEquityTagOption[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/equity-tags`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to load equity tags"
    );
  }
  return response.json();
}

export type OrgEquityCycleHorizon = "6m" | "12m" | "24m";

export async function listOrganizationEquities(
  accessToken: string,
  organizationId: string,
  params?: {
    q?: string;
    only_with_entity?: boolean;
    from_securities?: boolean;
    limit?: number;
    offset?: number;
    /** SKE-43: default 24m on API when omitted */
    cycle_horizon?: OrgEquityCycleHorizon;
    sector_cycles?: number[];
    industry_cycles?: number[];
    sub_industry_cycles?: number[];
  }
): Promise<OrgEquitiesListResult> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.only_with_entity) sp.set("only_with_entity", "true");
  if (params?.from_securities) sp.set("from_securities", "true");
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.cycle_horizon) sp.set("cycle_horizon", params.cycle_horizon);
  if (params?.sector_cycles?.length)
    sp.set("sector_cycles", params.sector_cycles.join(","));
  if (params?.industry_cycles?.length)
    sp.set("industry_cycles", params.industry_cycles.join(","));
  if (params?.sub_industry_cycles?.length)
    sp.set("sub_industry_cycles", params.sub_industry_cycles.join(","));
  const qs = sp.toString();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/equities${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to load equities"
    );
  }
  return response.json();
}

export async function getOrganizationEquityTagFilter(
  accessToken: string,
  organizationId: string
): Promise<OrgEquityTagFilterResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/equity-tag-filter`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to load equity tag filter"
    );
  }
  return response.json();
}

export async function patchOrganizationEquityTagFilter(
  accessToken: string,
  organizationId: string,
  tag_ids: string[]
): Promise<OrgEquityTagFilterResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/equity-tag-filter`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tag_ids }),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to update equity tag filter"
    );
  }
  return response.json();
}

export async function getOrganizationEquityDetails(
  accessToken: string,
  organizationId: string,
  securityId: string
): Promise<OrgEquityDetails> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/equities/${encodeURIComponent(securityId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Failed to load equity details");
  }
  return response.json();
}

export interface SlugAvailability {
  available: boolean;
  valid_format: boolean;
}

export async function checkOrganizationSlug(
  accessToken: string,
  slug: string
): Promise<SlugAvailability> {
  const baseUrl = getApiUrl();
  const enc = encodeURIComponent(slug);
  const response = await fetch(`${baseUrl}/organizations/slug-available/${enc}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error("Slug check failed");
  }
  return response.json();
}

export type OrganizationType =
  | "ria"
  | "research_firm"
  | "hedge_fund"
  | "family_office"
  | "asset_manager";

export interface CreateOrganizationBody {
  name: string;
  slug: string;
  organization_type: OrganizationType;
  enrichment_domain?: string;
}

export interface OrganizationDetail {
  id: string;
  name: string;
  slug: string;
  organization_type: string;
  status: string;
  legal_name?: string | null;
  domain?: string | null;
  website_url?: string | null;
  linkedin_url?: string | null;
  logo_url?: string | null;
  phone?: string | null;
  description?: string | null;
  industry?: string | null;
  estimated_num_employees?: number | null;
  founded_year?: number | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  address_line1?: string | null;
  postal_code?: string | null;
  raw_address?: string | null;
  enriched_at?: string | null;
  enrichment_source?: string | null;
}

export async function createOrganization(
  accessToken: string,
  body: CreateOrganizationBody
): Promise<OrganizationDetail> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/organizations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    const text = Array.isArray(msg) ? msg.join("; ") : msg;
    throw new Error(text ?? "Failed to create organization");
  }
  return response.json();
}

export async function enrichOrganizationFromApollo(
  accessToken: string,
  organizationId: string,
  body: { domain?: string } = {}
): Promise<OrganizationDetail> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/enrich`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Enrichment failed"
    );
  }
  return response.json();
}

export async function patchOrganization(
  accessToken: string,
  organizationId: string,
  patch: Partial<{
    name: string;
    slug: string;
    domain: string;
    organization_type: OrganizationType;
  }>
): Promise<OrganizationDetail> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/organizations/${organizationId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to update organization"
    );
  }
  return response.json();
}

/** Matches `organization_invitations.status` and list query filter. */
export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export interface InvitationRow {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  status: InvitationStatus | string;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at?: string;
  inviter_name?: string;
  organization_name?: string;
  invite_url?: string;
}

export const CLIENT_TYPES = ["family_individual", "business"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

/** Display labels for UI (API values remain snake_case). */
export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  family_individual: "Family or individual",
  business: "Business",
};

export const RELATIONSHIP_ROLES = [
  "primary_client",
  "spouse_partner",
  "dependent_child",
  "trust_entity",
  "business_plan",
  "other",
] as const;
export type RelationshipRole = (typeof RELATIONSHIP_ROLES)[number];

/** Display labels for UI (API values remain snake_case). */
export const RELATIONSHIP_ROLE_LABELS: Record<RelationshipRole, string> = {
  primary_client: "Primary client",
  spouse_partner: "Spouse or partner",
  dependent_child: "Dependent child",
  trust_entity: "Trust entity",
  business_plan: "Business plan",
  other: "Other",
};

export const TIME_HORIZONS = ["short_term", "medium_term", "long_term"] as const;
export type TimeHorizon = (typeof TIME_HORIZONS)[number];

export const TIME_HORIZON_LABELS: Record<TimeHorizon, string> = {
  short_term: "Short term",
  medium_term: "Medium term",
  long_term: "Long term",
};

export const LIQUIDITY_NEEDS = ["none_low", "moderate", "high"] as const;
export type LiquidityNeeds = (typeof LIQUIDITY_NEEDS)[number];

export const LIQUIDITY_NEEDS_LABELS: Record<LiquidityNeeds, string> = {
  none_low: "None / low",
  moderate: "Moderate",
  high: "High",
};

export const INVESTMENT_OBJECTIVES = [
  "growth_capital_appreciation",
  "income_yield_generation",
  "preservation_of_capital",
  "retirement_income",
  "education_funding",
  "legacy_estate_planning",
  "business_succession_corporate_reserves",
] as const;
export type InvestmentObjective = (typeof INVESTMENT_OBJECTIVES)[number];

export const INVESTMENT_OBJECTIVE_LABELS: Record<InvestmentObjective, string> = {
  growth_capital_appreciation: "Growth / capital appreciation",
  income_yield_generation: "Income / yield generation",
  preservation_of_capital: "Preservation of capital",
  retirement_income: "Retirement income",
  education_funding: "Education funding",
  legacy_estate_planning: "Legacy / estate planning",
  business_succession_corporate_reserves: "Business succession / corporate reserves",
};

export const TAX_ACCOUNT_TYPES = [
  "taxable_brokerage",
  "tax_deferred_ira_401k",
  "tax_free_roth",
  "trust_revocable_irrevocable",
  "business_entity_account",
  "other",
] as const;
export type TaxAccountType = (typeof TAX_ACCOUNT_TYPES)[number];

export const TAX_ACCOUNT_TYPE_LABELS: Record<TaxAccountType, string> = {
  taxable_brokerage: "Taxable brokerage",
  tax_deferred_ira_401k: "Tax-deferred (IRA / 401k)",
  tax_free_roth: "Tax-free (Roth)",
  trust_revocable_irrevocable: "Trust (revocable / irrevocable)",
  business_entity_account: "Business entity account",
  other: "Other",
};

export const SPECIAL_PREFERENCE_TAGS = [
  "esg_sustainable_impact",
  "avoid_certain_sectors",
  "dividend_focus",
  "low_volatility_low_beta",
  "high_growth_tech_heavy",
  "international_exposure_limit",
  "no_alternatives_illiquids",
] as const;
export type SpecialPreferenceTag = (typeof SPECIAL_PREFERENCE_TAGS)[number];

export const SPECIAL_PREFERENCE_TAG_LABELS: Record<SpecialPreferenceTag, string> = {
  esg_sustainable_impact: "ESG / sustainable / impact",
  avoid_certain_sectors: "Avoid certain sectors",
  dividend_focus: "Dividend focus",
  low_volatility_low_beta: "Low volatility / low beta",
  high_growth_tech_heavy: "High growth / tech-heavy",
  international_exposure_limit: "International exposure limit",
  no_alternatives_illiquids: "No alternatives / illiquids",
};

export const CLIENT_ENTITY_TYPES = ["individual", "company", "trust", "joint", "other"] as const;
export type ClientEntityType = (typeof CLIENT_ENTITY_TYPES)[number];
export const CLIENT_ENTITY_TYPE_LABELS: Record<ClientEntityType, string> = {
  individual: "Individual",
  company: "Company",
  trust: "Trust",
  joint: "Joint",
  other: "Other",
};

export const CLIENT_KYC_STATUSES = [
  "not_started",
  "pending",
  "verified",
  "rejected",
  "expired",
] as const;
export type ClientKycStatus = (typeof CLIENT_KYC_STATUSES)[number];
export const CLIENT_KYC_STATUS_LABELS: Record<ClientKycStatus, string> = {
  not_started: "Not started",
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  expired: "Expired",
};

export const CLIENT_ONBOARDING_STATUSES = [
  "draft",
  "in_progress",
  "completed",
  "blocked",
] as const;
export type ClientOnboardingStatus = (typeof CLIENT_ONBOARDING_STATUSES)[number];
export const CLIENT_ONBOARDING_STATUS_LABELS: Record<ClientOnboardingStatus, string> = {
  draft: "Draft",
  in_progress: "In progress",
  completed: "Completed",
  blocked: "Blocked",
};

export const CLIENT_STATUSES = ["active", "inactive", "suspended", "closed"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];
export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
  closed: "Closed",
};

export const CLIENT_AML_RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export type ClientAmlRiskLevel = (typeof CLIENT_AML_RISK_LEVELS)[number];
export const CLIENT_AML_RISK_LEVEL_LABELS: Record<ClientAmlRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export interface OrganizationClient {
  id: string;
  organization_id: string;
  name: string;
  client_type: ClientType;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationClientBody {
  name: string;
  client_type: ClientType;
}

export type UpdateOrganizationClientBody = Partial<CreateOrganizationClientBody>;

export interface ClientEntity {
  id: string;
  client_id: string;
  display_name: string;
  entity_type: ClientEntityType | null;
  legal_name: string | null;
  date_of_birth: string | null;
  incorporation_date: string | null;
  tax_id: string | null;
  national_id: string | null;
  passport_no: string | null;
  country_of_residence: string | null;
  country_of_incorporation: string | null;
  tax_residency: string | null;
  kyc_status: ClientKycStatus | null;
  kyc_verified_at: string | null;
  aml_risk_level: ClientAmlRiskLevel | null;
  pep_flag: boolean;
  sanctions_flag: boolean;
  parent_entity_id: string | null;
  beneficial_owner_of: string | null;
  ownership_percent: number | null;
  onboarding_status: ClientOnboardingStatus;
  client_status: ClientStatus;
  closed_at: string | null;
  closure_reason: string | null;
  source_system: string | null;
  source_system_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  version: number;
  relationship_role: RelationshipRole | null;
  relationship_role_other: string | null;
  risk_score: number | null;
  risk_notes: string | null;
  time_horizon_category: TimeHorizon | null;
  time_horizon_detail: string | null;
  investment_objectives: InvestmentObjective[];
  investment_objectives_notes: string | null;
  liquidity_needs: LiquidityNeeds | null;
  liquidity_notes: string | null;
  tax_account_types: TaxAccountType[];
  tax_account_notes: string | null;
  special_preferences_tags: SpecialPreferenceTag[];
  special_preferences_notes: string | null;
  age: number | null;
  life_stage: string | null;
  notes: string | null;
  settings_json: Record<string, unknown>;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClientEntityBody {
  display_name: string;
  entity_type?: ClientEntityType | null;
  legal_name?: string | null;
  date_of_birth?: string | null;
  incorporation_date?: string | null;
  tax_id?: string | null;
  national_id?: string | null;
  passport_no?: string | null;
  country_of_residence?: string | null;
  country_of_incorporation?: string | null;
  tax_residency?: string | null;
  kyc_status?: ClientKycStatus | null;
  kyc_verified_at?: string | null;
  aml_risk_level?: ClientAmlRiskLevel | null;
  pep_flag?: boolean;
  sanctions_flag?: boolean;
  parent_entity_id?: string | null;
  beneficial_owner_of?: string | null;
  ownership_percent?: number | null;
  onboarding_status?: ClientOnboardingStatus | null;
  client_status?: ClientStatus | null;
  closed_at?: string | null;
  closure_reason?: string | null;
  source_system?: string | null;
  source_system_id?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  version?: number | null;
  relationship_role?: RelationshipRole | null;
  relationship_role_other?: string | null;
  risk_score?: number | null;
  risk_notes?: string | null;
  time_horizon_category?: TimeHorizon | null;
  time_horizon_detail?: string | null;
  investment_objectives?: InvestmentObjective[];
  investment_objectives_notes?: string | null;
  liquidity_needs?: LiquidityNeeds | null;
  liquidity_notes?: string | null;
  tax_account_types?: TaxAccountType[];
  tax_account_notes?: string | null;
  special_preferences_tags?: SpecialPreferenceTag[];
  special_preferences_notes?: string | null;
  age?: number | null;
  life_stage?: string | null;
  notes?: string | null;
  settings_json?: Record<string, unknown>;
  display_order?: number | null;
}

export type UpdateClientEntityBody = Partial<CreateClientEntityBody>;

export async function listOrganizationClients(
  accessToken: string,
  organizationId: string
): Promise<OrganizationClient[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/organizations/${organizationId}/clients`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Failed to list clients");
  }
  return response.json();
}

export async function getOrganizationClient(
  accessToken: string,
  organizationId: string,
  clientId: string
): Promise<OrganizationClient> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/organizations/${organizationId}/clients/${clientId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Failed to load client");
  }
  return response.json();
}

export async function createOrganizationClient(
  accessToken: string,
  organizationId: string,
  body: CreateOrganizationClientBody
): Promise<OrganizationClient> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/organizations/${organizationId}/clients`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to create client"));
  }
  return response.json();
}

export async function updateOrganizationClient(
  accessToken: string,
  organizationId: string,
  clientId: string,
  body: UpdateOrganizationClientBody
): Promise<OrganizationClient> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/organizations/${organizationId}/clients/${clientId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to update client"));
  }
  return response.json();
}

export async function deleteOrganizationClient(
  accessToken: string,
  organizationId: string,
  clientId: string
): Promise<void> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/organizations/${organizationId}/clients/${clientId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Failed to delete client");
  }
}

export async function listClientEntities(
  accessToken: string,
  organizationId: string,
  clientId: string
): Promise<ClientEntity[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/clients/${clientId}/entities`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Failed to list entities");
  }
  return response.json();
}

export async function createClientEntity(
  accessToken: string,
  organizationId: string,
  clientId: string,
  body: CreateClientEntityBody
): Promise<ClientEntity> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/clients/${clientId}/entities`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to create entity"));
  }
  return response.json();
}

export async function updateClientEntity(
  accessToken: string,
  organizationId: string,
  clientId: string,
  entityId: string,
  body: UpdateClientEntityBody
): Promise<ClientEntity> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/clients/${clientId}/entities/${entityId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to update entity"));
  }
  return response.json();
}

export async function deleteClientEntity(
  accessToken: string,
  organizationId: string,
  clientId: string,
  entityId: string
): Promise<void> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/clients/${clientId}/entities/${entityId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Failed to delete entity");
  }
}

export interface OrganizationLlmConversation {
  id: string;
  organization_id: string;
  user_id: string;
  organization_client_id: string | null;
  title: string | null;
  model_key: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationLlmMessage {
  id: string;
  conversation_id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface AssistantPendingAction {
  id: string;
  toolKey: string;
  capabilityKey: string;
  summary: string;
  expiresAt: string;
}

export interface AssistantTurnResponse {
  userMessage: OrganizationLlmMessage;
  assistantMessage: OrganizationLlmMessage;
  creditsRemaining: number | null;
  toolsUsed: string[];
  toolErrors?: Array<{ toolKey: string; message: string }>;
  pendingAction?: AssistantPendingAction | null;
  error?: string;
}

function throwOrgAssistantApiError(
  response: Response,
  body: unknown,
  fallback: string
): never {
  const parsed = body as { message?: string; code?: string };
  const msg =
    (typeof parsed.message === "string" && parsed.message) ||
    (typeof parsed.code === "string" && parsed.code) ||
    fallback;
  const err = new Error(msg) as Error & { status?: number; body?: unknown };
  err.status = response.status;
  err.body = body;
  throw err;
}

export async function listOrgLlmConversations(
  accessToken: string,
  organizationId: string,
  params?: { global_only?: boolean; organization_client_id?: string }
): Promise<OrganizationLlmConversation[]> {
  const baseUrl = getApiUrl();
  const qs = new URLSearchParams();
  if (params?.global_only) qs.set("global_only", "true");
  if (params?.organization_client_id) {
    qs.set("organization_client_id", params.organization_client_id);
  }
  const suffix = qs.toString() ? `?${qs}` : "";
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/llm-chats${suffix}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throwOrgAssistantApiError(response, body, "Failed to load conversations");
  }
  return body as OrganizationLlmConversation[];
}

export async function getOrgLlmConversation(
  accessToken: string,
  organizationId: string,
  conversationId: string
): Promise<OrganizationLlmConversation> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/llm-chats/${conversationId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throwOrgAssistantApiError(response, body, "Failed to load conversation");
  }
  return body as OrganizationLlmConversation;
}

export async function createOrgLlmConversation(
  accessToken: string,
  organizationId: string,
  body: {
    title?: string | null;
    organization_client_id?: string | null;
    model_key?: string | null;
  }
): Promise<OrganizationLlmConversation> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/llm-chats`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throwOrgAssistantApiError(response, data, "Failed to create conversation");
  }
  return data as OrganizationLlmConversation;
}

export async function listOrgLlmMessages(
  accessToken: string,
  organizationId: string,
  conversationId: string,
  params?: { limit?: number; offset?: number }
): Promise<OrganizationLlmMessage[]> {
  const baseUrl = getApiUrl();
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs}` : "";
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/llm-chats/${conversationId}/messages${suffix}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throwOrgAssistantApiError(response, body, "Failed to load messages");
  }
  return body as OrganizationLlmMessage[];
}

export async function updateOrgLlmConversation(
  accessToken: string,
  organizationId: string,
  conversationId: string,
  body: {
    title?: string | null;
    metadata_json?: Record<string, unknown>;
  }
): Promise<OrganizationLlmConversation> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/llm-chats/${conversationId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throwOrgAssistantApiError(response, data, "Failed to update conversation");
  }
  return data as OrganizationLlmConversation;
}

export async function deleteOrgLlmConversation(
  accessToken: string,
  organizationId: string,
  conversationId: string
): Promise<void> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/llm-chats/${conversationId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throwOrgAssistantApiError(response, body, "Failed to delete conversation");
  }
}

export async function postOrgAssistantTurn(
  accessToken: string,
  organizationId: string,
  conversationId: string,
  payload: {
    content?: string;
    confirm_action_id?: string;
    reject_action_id?: string;
  }
): Promise<AssistantTurnResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/llm-chats/${conversationId}/assistant-turn`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throwOrgAssistantApiError(
      response,
      body,
      `Assistant request failed (${response.status})`
    );
  }
  return body as AssistantTurnResponse;
}

export interface OrganizationWatchlist {
  id: string;
  organization_id: string;
  user_id: string;
  organization_client_id: string | null;
  source_organization_llm_conversation_id: string | null;
  name: string;
  description: string | null;
  sort_order: number | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ListOrganizationWatchlistsParams {
  global_only?: boolean;
  organization_client_id?: string;
}

export interface CreateOrganizationWatchlistBody {
  name: string;
  description?: string | null;
  sort_order?: number | null;
  metadata_json?: Record<string, unknown>;
  organization_client_id?: string | null;
  source_organization_llm_conversation_id?: string | null;
}

export interface UpdateOrganizationWatchlistBody {
  name?: string;
  description?: string | null;
  sort_order?: number | null;
  metadata_json?: Record<string, unknown>;
  source_organization_llm_conversation_id?: string | null;
}

export interface DuplicateOrganizationWatchlistBody {
  name?: string;
  include_securities?: boolean;
}

export interface ConvertWatchlistScopeBody {
  organization_client_id: string | null;
}

export type MultiFormulaSortColumn =
  | "ticker"
  | "fundamental_constriction_score"
  | "net_exposure_score"
  | "insider_precision_score"
  | "political_score";

export interface MultiFormulaScreenerParams {
  q?: string;
  limit?: number;
  offset?: number;
  min_fundamental_constriction_score?: number;
  max_fundamental_constriction_score?: number;
  min_net_exposure_score?: number;
  max_net_exposure_score?: number;
  min_insider_precision_score?: number;
  max_insider_precision_score?: number;
  min_political_score?: number;
  max_political_score?: number;
  sort_by?: MultiFormulaSortColumn;
  sort_dir?: "asc" | "desc";
}

export interface MultiFormulaScreenerRow {
  security_id: string;
  ticker: string;
  name: string;
  fundamental_constriction_score: number | null;
  net_exposure_score: number | null;
  insider_precision_score: number | null;
  political_score: number | null;
}

export interface MultiFormulaScreenerListResult {
  items: MultiFormulaScreenerRow[];
  has_more: boolean;
  offset: number;
  limit: number;
  total_count: number;
  sort_by: MultiFormulaSortColumn;
  sort_dir: "asc" | "desc";
}

export interface ConvertMultiFormulaScreenerBody {
  name: string;
  description?: string | null;
  organization_client_id?: string | null;
}

export interface OrganizationWatchlistSecurityRow {
  id: string;
  watchlist_id: string;
  security_id: string;
  sort_order: number | null;
  note: string | null;
  added_at: string;
  securities?: {
    id?: string;
    ticker?: string;
    name?: string;
    market?: string;
    locale?: string;
    primary_exchange?: string | null;
  } | null;
}

export interface AddOrganizationWatchlistSecurityBody {
  security_id: string;
  sort_order?: number | null;
  note?: string | null;
}

export async function listOrganizationWatchlists(
  accessToken: string,
  organizationId: string,
  params?: ListOrganizationWatchlistsParams
): Promise<OrganizationWatchlist[]> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (params?.global_only === true) sp.set("global_only", "true");
  if (params?.organization_client_id) {
    sp.set("organization_client_id", params.organization_client_id);
  }
  const qs = sp.toString();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/watchlists${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to list watchlists"));
  }
  return response.json();
}

export async function createOrganizationWatchlist(
  accessToken: string,
  organizationId: string,
  body: CreateOrganizationWatchlistBody
): Promise<OrganizationWatchlist> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/organizations/${organizationId}/watchlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to create watchlist"));
  }
  return response.json();
}

export async function updateOrganizationWatchlist(
  accessToken: string,
  organizationId: string,
  watchlistId: string,
  body: UpdateOrganizationWatchlistBody
): Promise<OrganizationWatchlist> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/watchlists/${watchlistId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to update watchlist"));
  }
  return response.json();
}

export async function deleteOrganizationWatchlist(
  accessToken: string,
  organizationId: string,
  watchlistId: string
): Promise<void> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/watchlists/${watchlistId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Failed to delete watchlist");
  }
}

export async function duplicateOrganizationWatchlist(
  accessToken: string,
  organizationId: string,
  watchlistId: string,
  body?: DuplicateOrganizationWatchlistBody
): Promise<OrganizationWatchlist> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/watchlists/${watchlistId}/duplicate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to duplicate watchlist")
    );
  }
  return response.json();
}

export async function convertOrganizationWatchlistScope(
  accessToken: string,
  organizationId: string,
  watchlistId: string,
  body: ConvertWatchlistScopeBody
): Promise<OrganizationWatchlist> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/watchlists/${watchlistId}/convert-scope`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to convert scope"));
  }
  return response.json();
}

export async function listOrganizationWatchlistSecurities(
  accessToken: string,
  organizationId: string,
  watchlistId: string
): Promise<OrganizationWatchlistSecurityRow[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/watchlists/${watchlistId}/securities`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to list securities"));
  }
  return response.json();
}

function appendMultiFormulaParams(sp: URLSearchParams, params?: MultiFormulaScreenerParams): void {
  if (!params) return;
  const setNum = (key: string, v: number | undefined) => {
    if (typeof v === "number" && Number.isFinite(v)) sp.set(key, String(v));
  };
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (typeof params.limit === "number") sp.set("limit", String(params.limit));
  if (typeof params.offset === "number") sp.set("offset", String(params.offset));
  if (params.sort_by) sp.set("sort_by", params.sort_by);
  if (params.sort_dir) sp.set("sort_dir", params.sort_dir);
  setNum(
    "min_fundamental_constriction_score",
    params.min_fundamental_constriction_score
  );
  setNum(
    "max_fundamental_constriction_score",
    params.max_fundamental_constriction_score
  );
  setNum("min_net_exposure_score", params.min_net_exposure_score);
  setNum("max_net_exposure_score", params.max_net_exposure_score);
  setNum(
    "min_insider_precision_score",
    params.min_insider_precision_score
  );
  setNum(
    "max_insider_precision_score",
    params.max_insider_precision_score
  );
  setNum("min_political_score", params.min_political_score);
  setNum("max_political_score", params.max_political_score);
}

export async function listOrganizationMultiFormulaScreener(
  accessToken: string,
  organizationId: string,
  params?: MultiFormulaScreenerParams
): Promise<MultiFormulaScreenerListResult> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  appendMultiFormulaParams(sp, params);
  const qs = sp.toString();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/multi-formula-screener${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to load multi formula screener")
    );
  }
  return response.json();
}

export async function exportOrganizationMultiFormulaScreenerCsv(
  accessToken: string,
  organizationId: string,
  params?: MultiFormulaScreenerParams
): Promise<{ blob: Blob; filename: string }> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  appendMultiFormulaParams(sp, params);
  sp.set("format", "csv");
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/multi-formula-screener/export?${sp.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to export multi formula screener")
    );
  }
  const blob = await response.blob();
  const filename =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    `multi-formula-screener-${organizationId.slice(0, 8)}.csv`;
  return { blob, filename };
}

export async function convertOrganizationMultiFormulaScreenerToWatchlist(
  accessToken: string,
  organizationId: string,
  body: ConvertMultiFormulaScreenerBody,
  params?: MultiFormulaScreenerParams
): Promise<{ watchlist: OrganizationWatchlist; count_added: number }> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  appendMultiFormulaParams(sp, params);
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/multi-formula-screener/convert-to-watchlist${sp.toString() ? `?${sp.toString()}` : ""}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to convert to watchlist")
    );
  }
  return response.json();
}

export async function addOrganizationWatchlistSecurity(
  accessToken: string,
  organizationId: string,
  watchlistId: string,
  body: AddOrganizationWatchlistSecurityBody
): Promise<OrganizationWatchlistSecurityRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/watchlists/${watchlistId}/securities`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to add security"));
  }
  return response.json();
}

export async function removeOrganizationWatchlistSecurity(
  accessToken: string,
  organizationId: string,
  watchlistId: string,
  itemId: string
): Promise<void> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/watchlists/${watchlistId}/securities/${itemId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to remove security"));
  }
}

function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const basicMatch = header.match(/filename="?([^"]+)"?/i);
  return basicMatch?.[1] ?? null;
}

export async function exportOrganizationWatchlistCsv(
  accessToken: string,
  organizationId: string,
  watchlistId: string
): Promise<{ blob: Blob; filename: string }> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/watchlists/${watchlistId}/export?format=csv`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to export watchlist"));
  }
  const blob = await response.blob();
  const filename =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    `watchlist-${watchlistId.slice(0, 8)}.csv`;
  return { blob, filename };
}

export async function listOrganizationInvitations(
  accessToken: string,
  organizationId: string,
  options?: { status?: InvitationStatus }
): Promise<InvitationRow[]> {
  const baseUrl = getApiUrl();
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  const qs = params.toString();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/invitations${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to list invitations"
    );
  }
  return response.json();
}

export async function cancelOrganizationInvitation(
  accessToken: string,
  organizationId: string,
  invitationId: string
): Promise<void> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/invitations/${invitationId}/cancel`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Could not cancel invitation")
    );
  }
}

export async function resendOrganizationInvitation(
  accessToken: string,
  organizationId: string,
  invitationId: string,
  expiresInDays?: number
): Promise<InvitationRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/invitations/${invitationId}/resend`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        expiresInDays != null ? { expiresInDays } : {}
      ),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Could not resend invitation")
    );
  }
  return response.json();
}

export async function createOrganizationInvitation(
  accessToken: string,
  organizationId: string,
  email: string,
  role: OrgRole,
  expiresInDays?: number
): Promise<unknown> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/invitations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, role, expiresInDays }),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to send invitation"
    );
  }
  return response.json();
}

export interface HedgeFundsUploadResponse {
  processed: number;
}

export interface HedgeFundRow {
  filer_id: number;
  filer: string | null;
  hedge_fund_quality_score: number | null;
  holdings: number | null;
  f_13f_aum: number | null;
  perf_5_yr_annualized: number | null;
  alpha_3_yr: number | null;
  sortino_3_yr_equal_weight: number | null;
  pct_in_top_10: number | null;
  turnover: number | null;
  perf_3_yr_annualized: number | null;
  perf_10_yr_annualized: number | null;
  avg_time_held: number | null;
  beta_5_yr: number | null;
  stddev_3_yr: number | null;
  option_aum_pct: number | null;
  etf_aum_pct: number | null;
}

export interface HedgeFundsListResponse {
  data: HedgeFundRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const FUNDS_SORT_COLUMNS = [
  "filer",
  "hedge_fund_quality_score",
  "f_13f_aum",
  "perf_5_yr_annualized",
  "alpha_3_yr",
  "sortino_3_yr_equal_weight",
  "pct_in_top_10",
  "turnover",
  "perf_3_yr_annualized",
  "perf_10_yr_annualized",
  "avg_time_held",
  "beta_5_yr",
  "stddev_3_yr",
  "option_aum_pct",
  "etf_aum_pct",
  "holdings",
] as const;

export async function fetchHedgeFunds(
  accessToken: string,
  params: { page?: number; limit?: number; sort?: string; order?: "asc" | "desc" }
): Promise<HedgeFundsListResponse> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.sort) sp.set("sort", params.sort);
  if (params.order) sp.set("order", params.order);
  const url = `${baseUrl}/hedge-funds?${sp.toString()}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const msg = Array.isArray(err.message) ? err.message.join("; ") : err.message;
    throw new Error(msg ?? "Failed to fetch hedge funds");
  }
  return response.json();
}

export async function uploadHedgeFundsCsv(
  file: File,
  accessToken: string
): Promise<HedgeFundsUploadResponse> {
  const baseUrl = getApiUrl();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${baseUrl}/hedge-funds/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Upload failed" }));
    throw new Error((err as { message?: string }).message ?? "Upload failed");
  }

  return response.json();
}

export interface FormulaWeights {
  hedge_fund_performance: number;
  hedge_fund_risk: number;
  hedge_fund_precision: number;
  hedge_fund_institutional_strength: number;
  hedge_fund_positioning: number;
}

export interface HedgeFundQualityScoreFormula {
  id: string;
  key: string;
  name: string;
  output_type: string;
  definition: { type: "composite"; weights: FormulaWeights };
  updated_at: string;
}

export interface FormulaComponent {
  key: string;
  display_formula: string | null;
  description: string | null;
}

export interface HedgeFundQualityScoreResponse {
  formula: HedgeFundQualityScoreFormula | null;
  components: Record<string, FormulaComponent>;
}

export async function getHedgeFundQualityScoreFormula(
  accessToken: string
): Promise<HedgeFundQualityScoreResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/formulas/hedge-fund-quality-score`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) throw new Error("Failed to fetch formula");
  return response.json();
}

export async function updateHedgeFundQualityScoreWeights(
  weights: FormulaWeights,
  accessToken: string
): Promise<HedgeFundQualityScoreFormula> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/formulas/hedge-fund-quality-score`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ weights }),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Update failed" }));
    throw new Error((err as { message?: string }).message ?? "Update failed");
  }
  const { formula } = await response.json();
  return formula;
}

/** Fundamental constriction composite (DB factor keys) */
export interface FundamentalConstrictionFormulaWeights {
  fc_earnings_acceleration_pct: number;
  fc_margin_expansion_pct: number;
  fc_roic_improvement_pct: number;
  fc_valuation_compression_pct: number;
  fc_balance_sheet_strength_pct: number;
}

/** Political score trade-factor weights (DB factor keys) */
export interface PoliticalScoreFormulaWeights {
  ps_committee_relevance_pct: number;
  ps_trade_size_pct: number;
  ps_recency_pct: number;
  ps_influence_pct: number;
  ps_cluster_pct: number;
}

/** Taxonomy structural growth CAGR composite (3y / 5y / 10y bucket scores) */
export interface StructuralGrowthCagrFormulaWeights {
  sg_cagr_score_3y: number;
  sg_cagr_score_5y: number;
  sg_cagr_score_10y: number;
}

export interface CompositeScoreFormulaResponse {
  formula: {
    id: string;
    key: string;
    name: string;
    output_type: string;
    definition: {
      type: "composite";
      weights:
        | FundamentalConstrictionFormulaWeights
        | PoliticalScoreFormulaWeights
        | StructuralGrowthCagrFormulaWeights;
    };
    display_formula: string;
    description: string;
    updated_at: string;
  } | null;
  components: Record<string, FormulaComponent>;
}

export async function getFundamentalConstrictionScoreFormula(
  accessToken: string
): Promise<CompositeScoreFormulaResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/formulas/fundamental-constriction-score`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) throw new Error("Failed to fetch fundamental constriction formula");
  return response.json();
}

export async function updateFundamentalConstrictionScoreWeights(
  weights: FundamentalConstrictionFormulaWeights,
  accessToken: string
): Promise<CompositeScoreFormulaResponse["formula"]> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/formulas/fundamental-constriction-score`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ weights }),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Update failed" }));
    throw new Error((err as { message?: string }).message ?? "Update failed");
  }
  const { formula } = await response.json();
  return formula;
}

export async function getPoliticalScoreFormula(
  accessToken: string
): Promise<CompositeScoreFormulaResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/formulas/political-score`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to fetch political score formula");
  return response.json();
}

export async function updatePoliticalScoreWeights(
  weights: PoliticalScoreFormulaWeights,
  accessToken: string
): Promise<CompositeScoreFormulaResponse["formula"]> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/formulas/political-score`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ weights }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Update failed" }));
    throw new Error((err as { message?: string }).message ?? "Update failed");
  }
  const { formula } = await response.json();
  return formula;
}

/** Insider Precision Score (SKE-36) — matches `formulas.definition` when type is `insider_precision`. */
export type InsiderPrecisionCapNormMethod =
  | "market_cap"
  | "enterprise_value"
  | "revenue_ttm";

export interface InsiderPrecisionFormulaParams {
  role_weight_ceo: number;
  role_weight_cfo: number;
  role_weight_chairman: number;
  role_weight_president: number;
  role_weight_director: number;
  role_weight_ten_percent_owner: number;
  role_weight_officer: number;
  recency_weight_0_30_days: number;
  recency_weight_31_60_days: number;
  recency_weight_61_90_days: number;
  signal_lookback_days: number;
  buy_cluster_multiplier_1: number;
  buy_cluster_multiplier_2: number;
  buy_cluster_multiplier_3_plus: number;
  sell_cluster_multiplier_1: number;
  sell_cluster_multiplier_2: number;
  sell_cluster_multiplier_3_plus: number;
  score_scaling_factor: number;
  minimum_trade_value_threshold_usd: number;
  included_transaction_types: string[];
  market_cap_normalization_method: InsiderPrecisionCapNormMethod;
}

export interface InsiderPrecisionFormulaResponse {
  formula: {
    id: string;
    key: string;
    name: string;
    output_type: string;
    definition: {
      type: "insider_precision";
      params: InsiderPrecisionFormulaParams;
    };
    display_formula: string;
    description: string;
    updated_at: string;
  } | null;
  components: Record<string, FormulaComponent>;
}

export async function getInsiderPrecisionScoreFormula(
  accessToken: string
): Promise<InsiderPrecisionFormulaResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/formulas/insider-precision-score`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to fetch insider precision formula");
  return response.json();
}

export async function updateInsiderPrecisionScoreParams(
  params: InsiderPrecisionFormulaParams,
  accessToken: string
): Promise<InsiderPrecisionFormulaResponse["formula"]> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/formulas/insider-precision-score`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ params }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Update failed" }));
    throw new Error((err as { message?: string }).message ?? "Update failed");
  }
  const { formula } = await response.json();
  return formula;
}

export async function getStructuralGrowthCagrScoreFormula(
  accessToken: string
): Promise<CompositeScoreFormulaResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/formulas/structural-growth-cagr-score`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to fetch structural growth CAGR formula");
  return response.json();
}

export type TaxonomyCagrEntityTypeFilter = "sector" | "industry" | "sub_industry";

export interface TaxonomyCagrScoreRow {
  entityId: string;
  entityType: string;
  taxonomyNodeId: string;
  title: string | null;
  code: string | null;
  score3y: number | null;
  score5y: number | null;
  score10y: number | null;
  composite: number | null;
  scoresUpdatedAt: string | null;
}

export interface TaxonomyCagrScoresResponse {
  summary: {
    totalTaxonomyEntities: number;
    tableShown: number;
    withAllHorizonsInTable: number;
    withCompositeInTable: number;
    lastScoreUpdateAt: string | null;
  };
  rows: TaxonomyCagrScoreRow[];
}

export async function getTaxonomyStructuralGrowthCagrScores(
  accessToken: string,
  options?: { limit?: number; entityType?: TaxonomyCagrEntityTypeFilter | "" }
): Promise<TaxonomyCagrScoresResponse> {
  const baseUrl = getApiUrl();
  const params = new URLSearchParams();
  if (options?.limit != null && options.limit > 0) {
    params.set("limit", String(options.limit));
  }
  if (options?.entityType) {
    params.set("entityType", options.entityType);
  }
  const q = params.toString();
  const url = `${baseUrl}/formulas/taxonomy-structural-growth/cagr-scores${q ? `?${q}` : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to fetch taxonomy CAGR scores");
  return response.json();
}

export interface UpdateStructuralGrowthCagrScoreResponse {
  formula: CompositeScoreFormulaResponse["formula"];
  recalc: { entitiesUpdated: number } | null;
}

export async function updateStructuralGrowthCagrScoreWeights(
  weights: StructuralGrowthCagrFormulaWeights,
  accessToken: string
): Promise<UpdateStructuralGrowthCagrScoreResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/formulas/structural-growth-cagr-score`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ weights }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Update failed" }));
    throw new Error((err as { message?: string }).message ?? "Update failed");
  }
  return response.json() as Promise<UpdateStructuralGrowthCagrScoreResponse>;
}

export interface CalculateQualityScoresResponse {
  entitiesProcessed: number;
  top5: { filer: string; filerId: number; score: number; rank: number }[];
}

export async function calculateHedgeFundQualityScores(
  accessToken: string
): Promise<CalculateQualityScoresResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/hedge-funds/calculate-quality-scores`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const msg = Array.isArray(err.message)
      ? err.message.join("; ")
      : err.message;
    throw new Error(msg ?? "Calculation failed");
  }
  return response.json();
}

export interface AlphaGalangalCommitteeWeights {
  buffett: number;
  burry: number;
  druckenmiller: number;
  wood: number;
  graham: number;
  lynch: number;
}

export async function getAlphaGalangalCommitteeWeights(
  accessToken: string
): Promise<{ weights: AlphaGalangalCommitteeWeights }> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/formulas/alpha-galangal-committee/weights`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) throw new Error("Failed to fetch alpha galangal committee weights");
  return response.json();
}

export async function updateAlphaGalangalCommitteeWeights(
  weights: AlphaGalangalCommitteeWeights,
  accessToken: string
): Promise<void> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/formulas/alpha-galangal-committee/weights`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ weights }),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Update failed" }));
    throw new Error((err as { message?: string }).message ?? "Update failed");
  }
}

export interface AlphaGalangalCommitteeActivePrompt {
  system_prompt?: string;
  user_prompt_template?: string;
  output_schema?: string | object;
  notes?: string;
  model_name?: string;
  temperature?: number;
  top_p?: number;
  max_output_tokens?: number;
  status?: string;
}

export async function getAlphaGalangalCommitteeActivePrompt(
  accessToken: string
): Promise<AlphaGalangalCommitteeActivePrompt> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/formulas/alpha-galangal-committee/active-prompt`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) throw new Error("Failed to fetch active prompt");
  return response.json();
}

export interface FormulaPromptVersionRow {
  id: string;
  formula_id: string;
  version: number;
  status: string;
  system_prompt?: string | null;
  user_prompt_template?: string | null;
  output_schema?: string | object | null;
  notes?: string | null;
  model_name?: string | null;
  temperature?: number | null;
  top_p?: number | null;
  max_output_tokens?: number | null;
}

export async function getFormulaPromptVersions(
  accessToken: string,
  formulaKey: string
): Promise<FormulaPromptVersionRow[]> {
  const baseUrl = getApiUrl();
  const q = new URLSearchParams({ formulaKey });
  const response = await fetch(`${baseUrl}/formulas/prompt-versions?${q}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to load prompt versions"));
  }
  return response.json();
}

export async function patchFormulaPromptVersion(
  accessToken: string,
  id: string,
  body: Partial<
    Pick<
      FormulaPromptVersionRow,
      | "status"
      | "system_prompt"
      | "user_prompt_template"
      | "output_schema"
      | "notes"
      | "model_name"
      | "temperature"
      | "top_p"
      | "max_output_tokens"
    >
  >
): Promise<FormulaPromptVersionRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/formulas/prompt-versions/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Update failed"));
  }
  return response.json();
}

export async function getTaxonomyStructuralGrowthStatus(accessToken: string): Promise<{
  geminiConfigured: boolean;
}> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/formulas/taxonomy-structural-growth/status`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to load status"));
  }
  return response.json();
}

export async function testTaxonomyStructuralGrowthGemini(accessToken: string): Promise<{
  ok: boolean;
  latencyMs: number;
  model: string;
  error?: string;
}> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/formulas/taxonomy-structural-growth/test-gemini`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Test failed"));
  }
  return response.json();
}

export type MarketContentClassifierPreviewLogLevel = "info" | "warn" | "error";

export interface MarketContentClassifierPreviewLogEntry {
  ts: string;
  level: MarketContentClassifierPreviewLogLevel;
  message: string;
  detail?: Record<string, unknown>;
}

export interface MarketContentClassifierGeminiUsage {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  thoughtsTokenCount?: number;
  cachedContentTokenCount?: number;
}

export interface MarketContentClassifierClassifiedArticle {
  symbol: string | null;
  title: string | null;
  published_at: string | null;
  fmp_url: string | null;
  llm_json: Record<string, unknown> | null;
  llm_raw_text?: string;
  error?: string;
  gemini_usage?: MarketContentClassifierGeminiUsage | null;
  gemini_attempts?: number;
  persisted_market_content_id?: string | null;
  persist_error?: string | null;
  persist_replaced_existing?: boolean;
}

export interface MarketContentClassifierPreviewResult {
  steps: MarketContentClassifierPreviewLogEntry[];
  tickers_used: string[];
  fmp_articles_considered: number;
  results: MarketContentClassifierClassifiedArticle[];
}

export async function runMarketContentClassifierPreview(
  accessToken: string,
  body: {
    organization_id: string;
    ticker_symbols?: string[];
    equity_page_limit?: number;
    equity_query?: string;
    sector_cycles?: number[];
    industry_cycles?: number[];
    sub_industry_cycles?: number[];
    cycle_horizon?: "6m" | "12m" | "24m";
    from?: string;
    to?: string;
    max_news?: number;
    classify_count?: number;
    /** Default true on server: write validated rows to `market_content*`. */
    persist?: boolean;
    /** CON-51 admin side: which event windows to recompute after preview persistence. */
    con51_aggregate_windows?: "30d" | "90d" | "both";
  }
): Promise<MarketContentClassifierPreviewResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/formulas/market-content-classifier/preview`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Preview run failed"));
  }
  return response.json();
}

/** CON-86: allowed theme keys for `market_content.category` (admin catalog). */
export interface ContentCategoryRow {
  id: string;
  key: string;
  label: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function listMarketContentCategories(
  accessToken: string,
  options?: { includeInactive?: boolean }
): Promise<ContentCategoryRow[]> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (options?.includeInactive) sp.set("include_inactive", "1");
  const qs = sp.toString();
  const response = await fetch(
    `${baseUrl}/formulas/market-content-categories${qs ? `?${qs}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to load content categories")
    );
  }
  return response.json();
}

export async function createMarketContentCategory(
  accessToken: string,
  body: {
    key: string;
    label: string;
    description?: string | null;
    is_active?: boolean;
    sort_order?: number;
  }
): Promise<ContentCategoryRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/formulas/market-content-categories`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to create content category")
    );
  }
  return response.json();
}

export async function updateMarketContentCategory(
  accessToken: string,
  id: string,
  body: {
    key?: string;
    label?: string;
    description?: string | null;
    is_active?: boolean;
    sort_order?: number;
  }
): Promise<ContentCategoryRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/formulas/market-content-categories/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to update content category")
    );
  }
  return response.json();
}

export async function runTaxonomyStructuralGrowth(
  accessToken: string,
  body?: { limit?: number; delayMs?: number }
): Promise<{
  entitiesProcessed: number;
  llmCalls: number;
  errors: string[];
}> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/formulas/taxonomy-structural-growth/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Run failed"));
  }
  return response.json();
}

export interface TaxonomyStructuralGrowthCagrSyncResult {
  entitiesScanned: number;
  horizonScoresUpserted: number;
  compositesUpserted: number;
  entitiesWithAllHorizons: number;
  entitiesMissingAnyHorizon: number;
  errors: string[];
}

export async function syncTaxonomyStructuralGrowthCagrScores(
  accessToken: string,
  body?: { limit?: number }
): Promise<TaxonomyStructuralGrowthCagrSyncResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/formulas/taxonomy-structural-growth/sync-cagr-scores`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "CAGR sync failed"));
  }
  return response.json();
}

export async function updateAlphaGalangalCommitteeActivePrompt(
  body: Partial<AlphaGalangalCommitteeActivePrompt>,
  accessToken: string
): Promise<void> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/formulas/alpha-galangal-committee/active-prompt`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Update failed" }));
    throw new Error((err as { message?: string }).message ?? "Update failed");
  }
}

export interface AlphaGalangalCommitteeRunResult {
  ticker: string;
  member_scores: {
    buffett: number;
    burry: number;
    druckenmiller: number;
    wood: number;
    graham: number;
    lynch: number;
  };
  weighted_score: number;
  confidence: number;
  summary: string;
  key_strengths: string[];
  key_risks: string[];
}

export interface StockIngestFilters {
  exchanges: string[];
  security_types: string[];
  countries: string[];
  min_market_cap_millions: number | null;
  min_avg_share_volume_thousands: number | null;
  min_price_usd: number | null;
  min_avg_dollar_volume_millions: number | null;
  updated_at: string;
  updated_by: string | null;
}

export type PatchStockIngestFiltersBody = {
  exchanges?: string[];
  security_types?: string[];
  countries?: string[];
  min_market_cap_millions?: number | null;
  min_avg_share_volume_thousands?: number | null;
  min_price_usd?: number | null;
  min_avg_dollar_volume_millions?: number | null;
};

export async function fetchStockIngestFilters(
  accessToken: string
): Promise<StockIngestFilters> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/stock-ingest-filters`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to load ingest filters"));
  }
  return response.json();
}

export async function patchStockIngestFilters(
  accessToken: string,
  body: PatchStockIngestFiltersBody
): Promise<StockIngestFilters> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/stock-ingest-filters`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to save ingest filters"));
  }
  return response.json();
}

export interface FetchCompanyJobPostsBody {
  companyName: string;
  location?: string;
  country?: string;
  maxItems?: number;
  sort?: "relevance" | "date";
  fromDays?: "any" | "1" | "3" | "7" | "14";
  searchMode?: "basic" | "detailed" | "rich";
}

export interface SyncedJobPost {
  id: string | null;
  title: string | null;
  companyName: string | null;
  location: string | null;
  salaryText: string | null;
  postedAt: string | null;
  indeedUrl: string | null;
  externalUrl: string | null;
  isRemote: boolean | null;
  isExpired: boolean | null;
}

export interface SyncCompanyJobPostsResult {
  source: string;
  companyName: string;
  query: Record<string, unknown>;
  total: number;
  runId: string | null;
  persisted: number;
  skippedWithoutSourceId: number;
  posts: SyncedJobPost[];
}

export interface AdminJobPostRow {
  id: string;
  provider: string;
  source_job_id: string;
  company_name: string;
  search_company_name: string;
  title: string | null;
  location_text: string | null;
  country_code: string | null;
  salary_text: string | null;
  posted_at: string | null;
  indeed_url: string | null;
  external_url: string | null;
  is_remote: boolean | null;
  is_expired: boolean | null;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface ListAdminJobPostsResult {
  items: AdminJobPostRow[];
  total_count: number;
  offset: number;
  limit: number;
}

export async function syncIndeedCompanyJobPosts(
  accessToken: string,
  body: FetchCompanyJobPostsBody
): Promise<SyncCompanyJobPostsResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/jobs/indeed/company-posts/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to sync company job posts"));
  }
  return response.json();
}

export async function listAdminJobPosts(
  accessToken: string,
  params?: {
    q?: string;
    companyName?: string;
    location?: string;
    isRemote?: boolean;
    isExpired?: boolean;
    postedFrom?: string;
    postedTo?: string;
    offset?: number;
    limit?: number;
    sortBy?: "posted_at" | "last_seen_at" | "company_name" | "title";
    sortOrder?: "asc" | "desc";
  }
): Promise<ListAdminJobPostsResult> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.companyName?.trim()) sp.set("companyName", params.companyName.trim());
  if (params?.location?.trim()) sp.set("location", params.location.trim());
  if (params?.isRemote != null) sp.set("isRemote", String(params.isRemote));
  if (params?.isExpired != null) sp.set("isExpired", String(params.isExpired));
  if (params?.postedFrom) sp.set("postedFrom", params.postedFrom);
  if (params?.postedTo) sp.set("postedTo", params.postedTo);
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortOrder) sp.set("sortOrder", params.sortOrder);

  const qs = sp.toString();
  const response = await fetch(`${baseUrl}/jobs/posts${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to list job posts"));
  }
  return response.json();
}

export type LinkedinHeadcountCache = {
  company_finder?: {
    fetched_at: string;
    domain: string | null;
    linkedin_url: string | null;
    error?: string;
  };
  logical_scraper?: {
    fetched_at: string;
    number_of_employees: number | null;
    company_name?: string | null;
    error?: string;
  };
  riceman?: {
    fetched_at: string;
    employee_count: number | null;
    employee_range?: string | null;
    get_company_insights: boolean;
    get_total_job_openings: boolean;
    total_job_openings?: number | null;
    headcount_growth?: Record<string, string> | null;
    error?: string;
  };
};

export interface ActiveEntitySecurityEmployeeItem {
  security_id: string;
  ticker: string;
  name: string;
  entity_id: string;
  fmp_headcount: number | null;
  security_updated_at: string;
  homepage_url: string | null;
  linkedin_company_url: string | null;
  linkedin_headcount_cache: LinkedinHeadcountCache;
}

export interface ListActiveEntitySecuritiesEmployeeOverviewResult {
  items: ActiveEntitySecurityEmployeeItem[];
  total_count: number;
  offset: number;
  limit: number;
  filters: { market: string; locale: string };
}

export interface BatchLinkedinRowResult {
  success: boolean;
  security_id: string;
  ticker?: string;
  name?: string;
  fmp_headcount?: number | null;
  error?: string;
  skipped?: boolean;
  linkedin_company_url?: string | null;
  linkedin_headcount_cache?: LinkedinHeadcountCache;
}

/**
 * Per-security job-post counts for the admin "Job counts" page.
 * Indeed (kaix actor) values are aggregated from the `job_posts` table; Riceman
 * (LinkedIn) values come from the latest cache stored on each security.
 */
export interface ActiveEntityJobCountsItem {
  security_id: string;
  ticker: string;
  name: string;
  entity_id: string;
  fmp_headcount: number | null;
  /** Indeed posts (any state) matched by company name in `job_posts` (provider = 'apify_indeed'). */
  indeed_total_count: number;
  /** Subset of `indeed_total_count` where `is_expired` is not true. */
  indeed_active_count: number;
  /** Most recent `last_seen_at` across matched Indeed rows. */
  indeed_last_seen_at: string | null;
  /** Riceman cached `total_job_openings` from `linkedin_headcount_cache.riceman`. */
  riceman_total_job_openings: number | null;
  riceman_employee_count: number | null;
  riceman_fetched_at: string | null;
}

export interface ListActiveEntityJobCountsResult {
  items: ActiveEntityJobCountsItem[];
  total_count: number;
  offset: number;
  limit: number;
  filters: { market: string; locale: string };
}

export async function listActiveEntitySecuritiesJobCounts(
  accessToken: string,
  params?: {
    q?: string;
    market?: "stocks" | "crypto" | "fx" | "indices" | "options";
    locale?: "us" | "global";
    offset?: number;
    limit?: number;
  }
): Promise<ListActiveEntityJobCountsResult> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.market) sp.set("market", params.market);
  if (params?.locale) sp.set("locale", params.locale);
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  const response = await fetch(
    `${baseUrl}/jobs/active-entity-securities/job-counts${qs ? `?${qs}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to load job counts")
    );
  }
  return response.json();
}

export async function listActiveEntitySecuritiesEmployeeOverview(
  accessToken: string,
  params?: {
    q?: string;
    market?: "stocks" | "crypto" | "fx" | "indices" | "options";
    locale?: "us" | "global";
    offset?: number;
    limit?: number;
    /** Comma-separated in API: filter to these security UUIDs (active + entity, same market/locale). */
    ids?: string[];
  }
): Promise<ListActiveEntitySecuritiesEmployeeOverviewResult> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.market) sp.set("market", params.market);
  if (params?.locale) sp.set("locale", params.locale);
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.ids?.length) sp.set("ids", params.ids.join(","));
  const qs = sp.toString();
  const response = await fetch(
    `${baseUrl}/jobs/active-entity-securities/employee-overview${qs ? `?${qs}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to load employee overview")
    );
  }
  return response.json();
}

export async function patchSecurityLinkedinCompanyUrl(
  accessToken: string,
  securityId: string,
  body: { linkedinCompanyUrl: string | null }
): Promise<{ security_id: string; linkedin_company_url: string | null }> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/jobs/securities/${encodeURIComponent(securityId)}/linkedin-company-url`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ linkedinCompanyUrl: body.linkedinCompanyUrl }),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to save LinkedIn URL"));
  }
  return response.json();
}

export async function refreshSecurityLinkedinHeadcount(
  accessToken: string,
  securityId: string,
  options?: {
    getCompanyInsights?: boolean;
    getTotalJobOpenings?: boolean;
    /** When true (default) and no stored LinkedIn URL, run s-r company-finder on domain from `homepage_url` or `domainOverride`. */
    resolveLinkedInFromDomain?: boolean;
    domainOverride?: string;
  }
): Promise<{ security_id: string; linkedin_company_url: string | null; linkedin_headcount_cache: LinkedinHeadcountCache }> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/jobs/securities/${encodeURIComponent(securityId)}/linkedin-headcount/refresh`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        getCompanyInsights: options?.getCompanyInsights,
        getTotalJobOpenings: options?.getTotalJobOpenings,
        ...(typeof options?.resolveLinkedInFromDomain === "boolean"
          ? { resolveLinkedInFromDomain: options.resolveLinkedInFromDomain }
          : {}),
        ...(options?.domainOverride?.trim() ? { domainOverride: options.domainOverride.trim() } : {}),
      }),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to refresh LinkedIn headcounts")
    );
  }
  return response.json();
}

export async function batchResolveLinkedinCompanyUrls(
  accessToken: string,
  body: {
    securityIds: string[];
    domainOverrideBySecurityId?: Record<string, string>;
    market?: "stocks" | "crypto" | "fx" | "indices" | "options";
    locale?: "us" | "global";
  }
): Promise<{ results: BatchLinkedinRowResult[] }> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/jobs/securities/batch/linkedin-company-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to resolve LinkedIn company URLs")
    );
  }
  return response.json();
}

export async function batchFetchLinkedinHeadcount(
  accessToken: string,
  body: {
    securityIds: string[];
    getCompanyInsights?: boolean;
    getTotalJobOpenings?: boolean;
    market?: "stocks" | "crypto" | "fx" | "indices" | "options";
    locale?: "us" | "global";
  }
): Promise<{ results: BatchLinkedinRowResult[] }> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/jobs/securities/batch/linkedin-headcount`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join("; ") : (msg ?? "Failed to fetch LinkedIn headcounts")
    );
  }
  return response.json();
}

export async function runAlphaGalangalCommittee(
  ticker: string,
  accessToken: string
): Promise<AlphaGalangalCommitteeRunResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/formulas/alpha-galangal-committee/run`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ ticker: ticker.toUpperCase() }),
    }
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const msg = Array.isArray(data.message)
      ? data.message.join("; ")
      : data.message;
    throw new Error(msg ?? `Run failed (${response.status})`);
  }
  return response.json();
}


export interface FundamentalConstrictionScoreRow {
  ticker: string;
  security_id: string;
  score: number;
  rank: number;
  percentiles?: Record<string, number>;
  raw?: Record<string, number>;
}

export interface FundamentalConstrictionCalculateResult {
  tickersRequested: number;
  tickersWithData: number;
  scoresWritten: number;
  errors: { ticker: string; message: string }[];
  top10: FundamentalConstrictionScoreRow[];
  /** Full ranked list when returned by the API (same shape as `top10`). */
  rankings?: FundamentalConstrictionScoreRow[];
}

export interface PoliticalScoreRow {
  ticker: string;
  security_id: string;
  score: number;
  rank: number | null;
  buyPressure: number;
  sellPressure: number;
  tradesUsed: number;
}

export interface PoliticalScoreCalculateResult {
  tickersRequested: number;
  tickersWithData: number;
  scoresWritten: number;
  tradesSynced: number;
  /** FMP ingest stats (not failures). */
  syncNotes: { ticker: string; message: string }[];
  errors: { ticker: string; message: string }[];
  scores: PoliticalScoreRow[];
  /** Trades counted after the 180d recency filter. */
  tradesUsedInScoring: number;
}

export interface NetExposureScoreRow {
  ticker: string;
  security_id: string;
  score: number;
  rank: number | null;
  tailwind: number;
  headwind: number;
  rowsUsed: number;
  noPolarityRows: number;
}

export interface NetExposureScoreCalculateResult {
  tickersRequested: number;
  tickersWithData: number;
  scoresWritten: number;
  errors: { ticker: string; message: string }[];
  scores: NetExposureScoreRow[];
}

export interface InsiderPrecisionScoreRow {
  ticker: string;
  score: number;
  rank: number | null;
  buyPressure: number;
  sellPressure: number;
  netPressure: number;
  tradesUsed: number;
  uniqueBuyers: number;
  uniqueSellers: number;
}

export interface InsiderPrecisionCalculateResult {
  tickersRequested: number;
  tickersWithData: number;
  scoresWritten: number;
  tradesUsed: number;
  errors: { ticker: string; message: string }[];
  scores: InsiderPrecisionScoreRow[];
}

export interface BuffettScoreRow {
  ticker: string;
  score: number;
  label: "positive" | "neutral" | "negative";
  confidence: number;
  summary: string;
  updatedAt: string | null;
}

export interface BuffettScoreCalculateResult {
  tickersRequested: number;
  tickersWithData: number;
  scoresWritten: number;
  errors: { ticker: string; message: string }[];
  scores: BuffettScoreRow[];
}

export async function getInsiderPrecisionScores(
  accessToken: string,
  params?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<InsiderPrecisionCalculateResult> {
  const baseUrl = getApiUrl();
  const qs = new URLSearchParams();
  if (params?.tickers?.length) {
    params.tickers.forEach((t) => qs.append("tickers", t));
  }
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.minScore != null) qs.set("minScore", String(params.minScore));
  if (params?.maxScore != null) qs.set("maxScore", String(params.maxScore));
  const url = `${baseUrl}/stocks/insider-precision/scores${qs.toString() ? "?" + qs.toString() : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Failed to load insider precision scores (${response.status})`);
  }
  return response.json();
}

export async function calculateInsiderPrecisionScores(
  accessToken: string,
  body?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<InsiderPrecisionCalculateResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/stocks/insider-precision/calculate-scores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Insider precision score run failed (${response.status})`);
  }
  return response.json();
}

export async function getBuffettScores(
  accessToken: string,
  params?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<BuffettScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const qs = new URLSearchParams();
  if (params?.tickers?.length) {
    params.tickers.forEach((t) => qs.append("tickers", t));
  }
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.minScore != null) qs.set("minScore", String(params.minScore));
  if (params?.maxScore != null) qs.set("maxScore", String(params.maxScore));
  const url = `${baseUrl}/stocks/buffett-score/scores${qs.toString() ? "?" + qs.toString() : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Failed to load Buffett scores (${response.status})`);
  }
  return response.json();
}

export async function calculateBuffettScores(
  accessToken: string,
  body?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<BuffettScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/stocks/buffett-score/calculate-scores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Buffett score run failed (${response.status})`);
  }
  return response.json();
}

export interface DruckenmillerScoreRow {
  ticker: string;
  score: number;
  label: "positive" | "neutral" | "negative";
  confidence: number;
  summary: string;
  updatedAt: string | null;
}

export interface DruckenmillerScoreCalculateResult {
  tickersRequested: number;
  tickersWithData: number;
  scoresWritten: number;
  errors: { ticker: string; message: string }[];
  scores: DruckenmillerScoreRow[];
}

export async function getDruckenmillerScores(
  accessToken: string,
  params?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<DruckenmillerScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const qs = new URLSearchParams();
  if (params?.tickers?.length) {
    params.tickers.forEach((t) => qs.append("tickers", t));
  }
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.minScore != null) qs.set("minScore", String(params.minScore));
  if (params?.maxScore != null) qs.set("maxScore", String(params.maxScore));
  const url = `${baseUrl}/stocks/druckenmiller-score/scores${qs.toString() ? "?" + qs.toString() : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Failed to load Druckenmiller scores (${response.status})`);
  }
  return response.json();
}

export async function calculateDruckenmillerScores(
  accessToken: string,
  body?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<DruckenmillerScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/stocks/druckenmiller-score/calculate-scores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Druckenmiller score run failed (${response.status})`);
  }
  return response.json();
}

export interface WoodScoreRow {
  ticker: string;
  score: number;
  label: "positive" | "neutral" | "negative";
  confidence: number;
  summary: string;
  updatedAt: string | null;
}

export interface WoodScoreCalculateResult {
  tickersRequested: number;
  tickersWithData: number;
  scoresWritten: number;
  errors: { ticker: string; message: string }[];
  scores: WoodScoreRow[];
}

export async function getWoodScores(
  accessToken: string,
  params?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<WoodScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const qs = new URLSearchParams();
  if (params?.tickers?.length) {
    params.tickers.forEach((t) => qs.append("tickers", t));
  }
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.minScore != null) qs.set("minScore", String(params.minScore));
  if (params?.maxScore != null) qs.set("maxScore", String(params.maxScore));
  const url = `${baseUrl}/stocks/wood-score/scores${qs.toString() ? "?" + qs.toString() : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Failed to load Wood scores (${response.status})`);
  }
  return response.json();
}

export async function calculateWoodScores(
  accessToken: string,
  body?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<WoodScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/stocks/wood-score/calculate-scores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Wood score run failed (${response.status})`);
  }
  return response.json();
}

export interface GrahamScoreRow {
  ticker: string;
  score: number;
  label: "positive" | "neutral" | "negative";
  confidence: number;
  summary: string;
  updatedAt: string | null;
}

export interface GrahamScoreCalculateResult {
  tickersRequested: number;
  tickersWithData: number;
  scoresWritten: number;
  errors: { ticker: string; message: string }[];
  scores: GrahamScoreRow[];
}

export async function getGrahamScores(
  accessToken: string,
  params?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<GrahamScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const qs = new URLSearchParams();
  if (params?.tickers?.length) {
    params.tickers.forEach((t) => qs.append("tickers", t));
  }
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.minScore != null) qs.set("minScore", String(params.minScore));
  if (params?.maxScore != null) qs.set("maxScore", String(params.maxScore));
  const url = `${baseUrl}/stocks/graham-score/scores${qs.toString() ? "?" + qs.toString() : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Failed to load Graham scores (${response.status})`);
  }
  return response.json();
}

export async function calculateGrahamScores(
  accessToken: string,
  body?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<GrahamScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/stocks/graham-score/calculate-scores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Graham score run failed (${response.status})`);
  }
  return response.json();
}

export interface LynchScoreRow {
  ticker: string;
  score: number;
  label: "positive" | "neutral" | "negative";
  confidence: number;
  summary: string;
  updatedAt: string | null;
}

export interface LynchScoreCalculateResult {
  tickersRequested: number;
  tickersWithData: number;
  scoresWritten: number;
  errors: { ticker: string; message: string }[];
  scores: LynchScoreRow[];
}

export async function getLynchScores(
  accessToken: string,
  params?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<LynchScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const qs = new URLSearchParams();
  if (params?.tickers?.length) {
    params.tickers.forEach((t) => qs.append("tickers", t));
  }
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.minScore != null) qs.set("minScore", String(params.minScore));
  if (params?.maxScore != null) qs.set("maxScore", String(params.maxScore));
  const url = `${baseUrl}/stocks/lynch-score/scores${qs.toString() ? "?" + qs.toString() : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Failed to load Lynch scores (${response.status})`);
  }
  return response.json();
}

export async function calculateLynchScores(
  accessToken: string,
  body?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<LynchScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/stocks/lynch-score/calculate-scores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Lynch score run failed (${response.status})`);
  }
  return response.json();
}

export interface BurryScoreRow {
  ticker: string;
  score: number;
  label: "positive" | "neutral" | "negative";
  confidence: number;
  summary: string;
  updatedAt: string | null;
}

export interface BurryScoreCalculateResult {
  tickersRequested: number;
  tickersWithData: number;
  scoresWritten: number;
  errors: { ticker: string; message: string }[];
  scores: BurryScoreRow[];
}

export async function getBurryScores(
  accessToken: string,
  params?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<BurryScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const qs = new URLSearchParams();
  if (params?.tickers?.length) {
    params.tickers.forEach((t) => qs.append("tickers", t));
  }
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.minScore != null) qs.set("minScore", String(params.minScore));
  if (params?.maxScore != null) qs.set("maxScore", String(params.maxScore));
  const url = `${baseUrl}/stocks/burry-score/scores${qs.toString() ? "?" + qs.toString() : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Failed to load Burry scores (${response.status})`);
  }
  return response.json();
}

export async function calculateBurryScores(
  accessToken: string,
  body?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<BurryScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/stocks/burry-score/calculate-scores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Burry score run failed (${response.status})`);
  }
  return response.json();
}

export interface NetExposureDirectionWeightsInput {
  beneficiary?: number;
  supplier?: number;
  customer?: number;
  dependent?: number;
}

function appendScoreQueryParams(
  qs: URLSearchParams,
  params?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
) {
  if (params?.tickers?.length) {
    params.tickers.forEach((t) => qs.append("tickers", t));
  }
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.minScore != null) qs.set("minScore", String(params.minScore));
  if (params?.maxScore != null) qs.set("maxScore", String(params.maxScore));
}

export async function getPoliticalScores(
  accessToken: string,
  params?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<PoliticalScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const qs = new URLSearchParams();
  appendScoreQueryParams(qs, params);
  const url = `${baseUrl}/stocks/political-score/scores${qs.toString() ? "?" + qs.toString() : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Failed to load political scores (${response.status})`);
  }
  return response.json();
}

export async function calculatePoliticalScores(
  accessToken: string,
  body?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<PoliticalScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/stocks/political-score/calculate-scores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const msg = Array.isArray(data.message)
      ? data.message.join("; ")
      : data.message;
    throw new Error(msg ?? `Political score run failed (${response.status})`);
  }
  return response.json();
}

export async function getNetExposureScores(
  accessToken: string,
  params?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
  }
): Promise<NetExposureScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const qs = new URLSearchParams();
  appendScoreQueryParams(qs, params);
  const url = `${baseUrl}/stocks/net-exposure/scores${qs.toString() ? "?" + qs.toString() : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Failed to load net exposure scores (${response.status})`);
  }
  return response.json();
}

export async function calculateNetExposureScores(
  accessToken: string,
  body?: {
    tickers?: string[];
    limit?: number;
    minScore?: number;
    maxScore?: number;
    directionWeights?: NetExposureDirectionWeightsInput;
  }
): Promise<NetExposureScoreCalculateResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/stocks/net-exposure/calculate-scores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const msg = Array.isArray(data.message)
      ? data.message.join("; ")
      : data.message;
    throw new Error(msg ?? `Net exposure score run failed (${response.status})`);
  }
  return response.json();
}

export interface SyncFmpPoliticalTradesResult {
  inserted: number;
  syncNotes: string[];
  errors: string[];
}

/** FMP senate/house → `political_trades` (platform admin only). Unknown tickers can be upserted from FMP profile first (default on). */
export async function syncFmpPoliticalTrades(
  accessToken: string,
  options?: { backfillMissingSecurities?: boolean }
): Promise<SyncFmpPoliticalTradesResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/stocks/political-score/sync-fmp-political-trades`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        backfillMissingSecurities: options?.backfillMissingSecurities !== false,
      }),
    }
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const msg = Array.isArray(data.message)
      ? data.message.join("; ")
      : data.message;
    throw new Error(msg ?? `FMP political trades sync failed (${response.status})`);
  }
  return response.json();
}

export interface SyncFmpPoliticalFeedMissingSecuritiesResult {
  dryRun: boolean;
  uniqueSymbolsInFeeds: number;
  missingInSecurities: number;
  toProcess: number;
  synced: number;
  filtered: number;
  notFound: number;
  failed: number;
  errors: string[];
}

/**
 * FMP senate/house feeds → symbols absent from `securities` → `/stable/profile` upsert each
 * (platform admin). Use dryRun to count only; limit to cap API calls per run.
 */
export async function syncFmpPoliticalFeedMissingSecurities(
  accessToken: string,
  body?: { delayMs?: number; limit?: number | null; dryRun?: boolean }
): Promise<SyncFmpPoliticalFeedMissingSecuritiesResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/fmp/sync-political-feed-missing-securities`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body ?? {}),
    }
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const msg = Array.isArray(data.message)
      ? data.message.join("; ")
      : data.message;
    throw new Error(
      msg ?? `FMP political-feed missing securities sync failed (${response.status})`
    );
  }
  return response.json();
}

export interface TriggerDispatchResult {
  mode: "trigger";
  taskId: string;
  runId: string;
  message: string;
}

export function isTriggerDispatchResult(
  value: unknown
): value is TriggerDispatchResult {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as TriggerDispatchResult).mode === "trigger" &&
    typeof (value as TriggerDispatchResult).runId === "string"
  );
}

export interface DataSyncLastRun {
  at: string;
  ok: boolean;
  summary?: string;
  runId?: string;
  triggerStatus?: string;
  source?: "trigger.dev" | "nest-scheduler";
  running?: boolean;
}

export interface DataSyncJobInfo {
  cron: string | null;
  triggerTaskId?: string;
  lastRun: DataSyncLastRun | null;
}

export interface DataSyncStatus {
  mode: "nest-scheduler" | "trigger.dev";
  triggerConfigured?: boolean;
  inlineSyncAvailable?: boolean;
  triggerProjectId?: string;
  runHistory?: {
    databaseRowCount: number;
    triggerApiRunCount: number;
    triggerApiConfigured: boolean;
    hint?: string;
  };
  jobs: {
    fmpPoliticalTrades: DataSyncJobInfo;
    fmpPoliticalFeedMissingSecurities: DataSyncJobInfo;
    congressMembers: DataSyncJobInfo;
    committeeMemberships: DataSyncJobInfo;
    taxonomyStructuralGrowthCagrScores: DataSyncJobInfo;
    taxonomyCycleScores: DataSyncJobInfo;
    equityExposures: DataSyncJobInfo;
  };
}

export interface EquityExposuresSyncResult {
  total: number;
  processed: number;
  skippedNoProfile: number;
  exposuresAssignedTotal: number;
  errors: string[];
}

export async function syncEquityExposures(
  accessToken: string,
  body?: { delayMs?: number; limit?: number | null }
): Promise<EquityExposuresSyncResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/data-sync/run/equity-exposures`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const msg = Array.isArray(data.message)
      ? data.message.join("; ")
      : data.message;
    throw new Error(msg ?? `Equity exposures sync failed (${response.status})`);
  }
  return response.json();
}

export interface TaxonomyCycleScoresSyncResult {
  entitiesTotal: number;
  entitiesProcessed: number;
  skippedNoPrompt: number;
  llmCalls: number;
  horizonUpserts: number;
  errors: string[];
}

export async function syncTaxonomyCycleScores(
  accessToken: string,
  body?: { delayMs?: number; limit?: number | null }
): Promise<TaxonomyCycleScoresSyncResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/data-sync/run/taxonomy-cycle-scores`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    }
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const msg = Array.isArray(data.message)
      ? data.message.join("; ")
      : data.message;
    throw new Error(msg ?? `Taxonomy cycle score sync failed (${response.status})`);
  }
  return response.json();
}

export async function fetchDataSyncStatus(
  accessToken: string
): Promise<DataSyncStatus> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/data-sync/status`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const msg = Array.isArray(data.message)
      ? data.message.join("; ")
      : data.message;
    throw new Error(msg ?? `Data sync status failed (${response.status})`);
  }
  return response.json();
}

export async function syncCongressMembers(accessToken: string): Promise<{
  congress: number;
  synced: number;
  errors: number;
}> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/congress/sync-members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const msg = Array.isArray(data.message)
      ? data.message.join("; ")
      : data.message;
    throw new Error(msg ?? `Congress member sync failed (${response.status})`);
  }
  return response.json();
}

export async function syncCommitteeMemberships(accessToken: string): Promise<{
  congress: number;
  upserted: number;
  removed: number;
  warnings: string[];
}> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/congress/sync-committee-memberships`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const msg = Array.isArray(data.message)
      ? data.message.join("; ")
      : data.message;
    throw new Error(msg ?? `Committee membership sync failed (${response.status})`);
  }
  return response.json();
}

export async function getFundamentalConstrictionScores(
  accessToken: string,
  params?: { tickers?: string[]; limit?: number }
): Promise<FundamentalConstrictionCalculateResult> {
  const baseUrl = getApiUrl();
  const qs = new URLSearchParams();
  if (params?.tickers?.length) {
    params.tickers.forEach((t) => qs.append("tickers", t));
  }
  if (params?.limit != null) qs.set("limit", String(params.limit));
  const url = `${baseUrl}/stocks/fundamental-constriction/scores${qs.toString() ? "?" + qs.toString() : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message;
    throw new Error(msg ?? `Failed to load fundamental constriction scores (${response.status})`);
  }
  return response.json();
}

export async function calculateFundamentalConstrictionScores(
  accessToken: string,
  body?: { tickers?: string[]; limit?: number }
): Promise<FundamentalConstrictionCalculateResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/stocks/fundamental-constriction/calculate-scores`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body ?? {}),
    }
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const msg = Array.isArray(data.message)
      ? data.message.join("; ")
      : data.message;
    throw new Error(
      msg ?? `Fundamental constriction run failed (${response.status})`
    );
  }
  return response.json();
}

// --- Platform admin: exposures & tags dictionaries ---

export interface AdminExposureRow {
  exposure_id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  is_active: boolean;
  sort_order: number | null;
  polarity: number | null;
  created_at: string;
  updated_at: string;
}

export interface AdminTagRow {
  tag_id: string;
  name: string;
  slug: string;
  group: string;
  description: string | null;
  is_active: boolean;
  is_llm_assignable: boolean;
  sort_order: number | null;
  weight_hint: number | null;
  organization_id: string;
  organization_name: string | null;
  organization_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignalCategory {
  id: string;
  name: string;
  description: string | null;
}

function adminApiErrorMessage(data: unknown, fallback: string): string {
  const body = data as { message?: string | string[] };
  const msg = body.message;
  if (Array.isArray(msg)) return msg.join("; ");
  if (typeof msg === "string") return msg;
  return fallback;
}

export async function fetchAdminExposures(
  accessToken: string,
  params?: { active_only?: boolean }
): Promise<AdminExposureRow[]> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (params?.active_only) sp.set("active_only", "true");
  const q = sp.toString();
  const url = `${baseUrl}/admin/exposures${q ? `?${q}` : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load exposures"));
  }
  return response.json();
}

export async function createAdminExposure(
  accessToken: string,
  body: {
    name: string;
    slug: string;
    category: string;
    description?: string | null;
    is_active?: boolean;
    sort_order?: number | null;
    polarity?: number | null;
  }
): Promise<AdminExposureRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/exposures`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to create exposure"));
  }
  return response.json();
}

export async function updateAdminExposure(
  accessToken: string,
  exposureId: string,
  body: {
    name?: string;
    slug?: string;
    category?: string;
    description?: string | null;
    is_active?: boolean;
    sort_order?: number | null;
    polarity?: number | null;
  }
): Promise<AdminExposureRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/exposures/${exposureId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to update exposure"));
  }
  return response.json();
}

export async function deleteAdminExposure(
  accessToken: string,
  exposureId: string
): Promise<void> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/exposures/${exposureId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to delete exposure"));
  }
}

export async function fetchAdminTags(
  accessToken: string,
  params?: { active_only?: boolean; llm_assignable_only?: boolean }
): Promise<AdminTagRow[]> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (params?.active_only) sp.set("active_only", "true");
  if (params?.llm_assignable_only) sp.set("llm_assignable_only", "true");
  const q = sp.toString();
  const url = `${baseUrl}/admin/tags${q ? `?${q}` : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load tags"));
  }
  return response.json();
}

export async function createAdminTag(
  accessToken: string,
  body: {
    name: string;
    slug: string;
    group: string;
    description?: string | null;
    is_active?: boolean;
    is_llm_assignable?: boolean;
    sort_order?: number | null;
    weight_hint?: number | null;
    organization_id?: string;
  }
): Promise<AdminTagRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/tags`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to create tag"));
  }
  return response.json();
}

export async function updateAdminTag(
  accessToken: string,
  tagId: string,
  body: {
    name?: string;
    slug?: string;
    group?: string;
    description?: string | null;
    is_active?: boolean;
    is_llm_assignable?: boolean;
    sort_order?: number | null;
    weight_hint?: number | null;
    organization_id?: string;
  }
): Promise<AdminTagRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/tags/${tagId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to update tag"));
  }
  return response.json();
}

export async function deleteAdminTag(accessToken: string, tagId: string): Promise<void> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/tags/${tagId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to delete tag"));
  }
}

function parseSignalCategoriesPayload(raw: unknown): SignalCategory[] {
  if (Array.isArray(raw)) {
    return raw as SignalCategory[];
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const arr = o.data ?? o.items ?? o.categories;
    if (Array.isArray(arr)) {
      return arr as SignalCategory[];
    }
  }
  return [];
}

function parseSignalCategoryPayload(raw: unknown): SignalCategory {
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const inner = o.data ?? o.category;
    if (inner && typeof inner === "object") {
      return inner as SignalCategory;
    }
  }
  return raw as SignalCategory;
}

export async function listAdminSignalCategories(
  accessToken: string
): Promise<SignalCategory[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/signal-categories`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load signal categories"));
  }
  const raw: unknown = await response.json();
  return parseSignalCategoriesPayload(raw);
}

export async function getAdminSignalCategory(
  accessToken: string,
  categoryId: string
): Promise<SignalCategory> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/signal-categories/${encodeURIComponent(categoryId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load signal category"));
  }
  const raw: unknown = await response.json();
  return parseSignalCategoryPayload(raw);
}

export async function createAdminSignalCategory(
  accessToken: string,
  body: { name: string; description?: string | null }
): Promise<SignalCategory> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/signal-categories`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to create signal category"));
  }
  const raw: unknown = await response.json();
  return parseSignalCategoryPayload(raw);
}

export async function updateAdminSignalCategory(
  accessToken: string,
  categoryId: string,
  body: { name?: string; description?: string | null }
): Promise<SignalCategory> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/signal-categories/${encodeURIComponent(categoryId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to update signal category"));
  }
  const raw: unknown = await response.json();
  return parseSignalCategoryPayload(raw);
}

export type FormulaVisibility = "organization" | "private" | "public";

export interface FormulaMarketingRow {
  id: string;
  /** Null for legacy / platform-wide formula rows. */
  organization_id: string | null;
  key: string;
  name: string;
  visibility: string;
  hero_image_url: string | null;
  marketing_slug: string | null;
  marketing_settings: Record<string, unknown>;
  description?: string | null;
  display_formula?: string | null;
  next_release_at?: string | null;
  updated_at?: string;
  /** Public marketing hub page — search / Open Graph. */
  seo_title?: string | null;
  seo_description?: string | null;
  seo_og_image_url?: string | null;
}

function parseAdminFormulaMarketingListPayload(raw: unknown): FormulaMarketingRow[] {
  if (Array.isArray(raw)) {
    return raw as FormulaMarketingRow[];
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const arr = o.data ?? o.items ?? o.formulas;
    if (Array.isArray(arr)) {
      return arr as FormulaMarketingRow[];
    }
  }
  return [];
}

/** CON-112 — org member catalog of formulas with marketing fields (hero, description, etc.). */
export async function listOrganizationFormulaMarketing(
  accessToken: string,
  organizationId: string
): Promise<FormulaMarketingRow[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${organizationId}/formulas/marketing`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Failed to list formulas");
  }
  const raw: unknown = await response.json();
  return parseAdminFormulaMarketingListPayload(raw);
}

export async function listAdminFormulaMarketing(
  accessToken: string,
  params?: { organization_id?: string }
): Promise<FormulaMarketingRow[]> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (params?.organization_id) {
    sp.set("organization_id", params.organization_id);
  }
  const q = sp.toString();
  const response = await fetch(
    `${baseUrl}/admin/formula-marketing/formulas${q ? `?${q}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to list formulas"));
  }
  const raw: unknown = await response.json();
  return parseAdminFormulaMarketingListPayload(raw);
}

export async function getAdminFormulaMarketing(
  accessToken: string,
  formulaId: string
): Promise<FormulaMarketingRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/formula-marketing/formulas/${formulaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load formula"));
  }
  return response.json() as Promise<FormulaMarketingRow>;
}

export type PatchAdminFormulaMarketingBody = {
  marketing_slug?: string | null;
  marketing_settings?: Record<string, unknown>;
  visibility?: FormulaVisibility | string;
  hero_image_url?: string | null;
  description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
};

export async function patchAdminFormulaMarketing(
  accessToken: string,
  formulaId: string,
  body: PatchAdminFormulaMarketingBody
): Promise<FormulaMarketingRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/formula-marketing/formulas/${formulaId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 409) {
      throw new Error(
        adminApiErrorMessage(err, "Duplicate marketing slug in this organization")
      );
    }
    throw new Error(adminApiErrorMessage(err, "Failed to update formula"));
  }
  return response.json() as Promise<FormulaMarketingRow>;
}

/** `GET /admin/ai-assistant/prompt-templates` — platform admin (CON-125). */
export type AiPromptTemplateRow = {
  id: string;
  template_key: string;
  template_text: string;
  required_context_keys: unknown;
  is_active: boolean;
  version: number;
  change_note: string | null;
  updated_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchAdminAiPromptTemplates(
  accessToken: string
): Promise<AiPromptTemplateRow[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/ai-assistant/prompt-templates`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load prompt templates"));
  }
  return response.json() as Promise<AiPromptTemplateRow[]>;
}

export type PatchAdminAiPromptTemplateBody = {
  template_text?: string;
  change_note?: string | null;
  is_active?: boolean;
};

export async function patchAdminAiPromptTemplate(
  accessToken: string,
  templateId: string,
  body: PatchAdminAiPromptTemplateBody
): Promise<AiPromptTemplateRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/ai-assistant/prompt-templates/${encodeURIComponent(templateId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to save prompt template"));
  }
  return response.json() as Promise<AiPromptTemplateRow>;
}

export async function fetchAdminAiFormulaDisclosurePolicy(
  accessToken: string
): Promise<Record<string, unknown>> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/ai-assistant/formula-disclosure-policy`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load disclosure policy"));
  }
  return response.json() as Promise<Record<string, unknown>>;
}

export type PatchAdminAiFormulaDisclosurePolicyBody = {
  block_exact_equation_for_system_formulas?: boolean;
  allow_factor_names?: boolean;
  allow_weights?: boolean;
};

export async function patchAdminAiFormulaDisclosurePolicy(
  accessToken: string,
  body: PatchAdminAiFormulaDisclosurePolicyBody
): Promise<Record<string, unknown>> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/ai-assistant/formula-disclosure-policy`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to save disclosure policy"));
  }
  return response.json() as Promise<Record<string, unknown>>;
}

export async function fetchAdminAiAssistantCoreConfig(
  accessToken: string
): Promise<Record<string, unknown>> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/ai-assistant/core-config`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load assistant core config"));
  }
  return response.json() as Promise<Record<string, unknown>>;
}

export async function fetchAdminAiScopePolicy(
  accessToken: string
): Promise<Record<string, unknown>> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/ai-assistant/scope-policy`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load scope policy"));
  }
  return response.json() as Promise<Record<string, unknown>>;
}

export type FormulaGovernanceRow = {
  id: string;
  key: string;
  name: string;
  organization_id: string | null;
  formula_origin: string;
  equation_visibility_mode: string;
  is_locked: boolean;
  source_formula_id: string | null;
};

export type FactorGovernanceRow = {
  id: string;
  key: string;
  name: string;
  organization_id: string | null;
  factor_origin: string;
  factor_visibility_mode: string;
  is_locked: boolean;
  source_factor_id: string | null;
};

export async function listAdminAiFormulasGovernance(
  accessToken: string,
  params?: { limit?: number; offset?: number; organization_id?: string }
): Promise<{ rows: FormulaGovernanceRow[]; total: number }> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.organization_id) sp.set("organization_id", params.organization_id);
  const q = sp.toString();
  const response = await fetch(
    `${baseUrl}/admin/ai-assistant/formulas/governance${q ? `?${q}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to list formulas governance"));
  }
  return response.json() as Promise<{ rows: FormulaGovernanceRow[]; total: number }>;
}

export type PatchAdminAiFormulaGovernanceBody = {
  formula_origin?: "system" | "organization";
  equation_visibility_mode?: "hidden" | "owner_only" | "public";
  is_locked?: boolean;
  source_formula_id?: string | null;
};

export async function patchAdminAiFormulaGovernance(
  accessToken: string,
  formulaId: string,
  body: PatchAdminAiFormulaGovernanceBody
): Promise<FormulaGovernanceRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/ai-assistant/formulas/${encodeURIComponent(formulaId)}/governance`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to update formula governance"));
  }
  return response.json() as Promise<FormulaGovernanceRow>;
}

export async function listAdminAiFactorsGovernance(
  accessToken: string,
  params?: { limit?: number; offset?: number; organization_id?: string }
): Promise<{ rows: FactorGovernanceRow[]; total: number }> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.organization_id) sp.set("organization_id", params.organization_id);
  const q = sp.toString();
  const response = await fetch(
    `${baseUrl}/admin/ai-assistant/factors/governance${q ? `?${q}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to list factors governance"));
  }
  return response.json() as Promise<{ rows: FactorGovernanceRow[]; total: number }>;
}

export type PatchAdminAiFactorGovernanceBody = {
  factor_origin?: "system" | "organization";
  factor_visibility_mode?: "hidden" | "organization" | "public";
  is_locked?: boolean;
  source_factor_id?: string | null;
};

export async function patchAdminAiFactorGovernance(
  accessToken: string,
  factorId: string,
  body: PatchAdminAiFactorGovernanceBody
): Promise<FactorGovernanceRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/ai-assistant/factors/${encodeURIComponent(factorId)}/governance`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to update factor governance"));
  }
  return response.json() as Promise<FactorGovernanceRow>;
}

export async function uploadAdminFormulaHeroImage(
  accessToken: string,
  formulaId: string,
  file: File
): Promise<FormulaMarketingRow> {
  const baseUrl = getApiUrl();
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(
    `${baseUrl}/admin/formula-marketing/formulas/${encodeURIComponent(formulaId)}/hero-image`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to upload hero image"));
  }
  return response.json() as Promise<FormulaMarketingRow>;
}

export async function deleteAdminFormulaHeroImage(
  accessToken: string,
  formulaId: string
): Promise<FormulaMarketingRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/formula-marketing/formulas/${encodeURIComponent(formulaId)}/hero-image`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to remove hero image"));
  }
  if (response.status === 204) {
    return getAdminFormulaMarketing(accessToken, formulaId);
  }
  const ct = response.headers.get("content-type");
  if (ct?.includes("application/json")) {
    const data = (await response.json().catch(() => null)) as FormulaMarketingRow | null;
    if (data) return data;
  }
  return getAdminFormulaMarketing(accessToken, formulaId);
}

function parseSeoOgFormulaResponseBody(raw: unknown): FormulaMarketingRow {
  if (!raw || typeof raw !== "object") {
    return raw as FormulaMarketingRow;
  }
  const o = raw as Record<string, unknown>;
  const inner = o.formula ?? o.data;
  if (inner && typeof inner === "object") {
    return inner as FormulaMarketingRow;
  }
  return raw as FormulaMarketingRow;
}

/**
 * `POST /admin/formula-marketing/formulas/{formulaId}/seo-og-image` — multipart field `file`.
 * Response: updated formula row (includes `seo_og_image_url`). Platform admin + bearer token.
 */
export async function uploadAdminFormulaMarketingSeoOgImage(
  accessToken: string,
  formulaId: string,
  file: File
): Promise<FormulaMarketingRow> {
  const baseUrl = getApiUrl();
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(
    `${baseUrl}/admin/formula-marketing/formulas/${encodeURIComponent(formulaId)}/seo-og-image`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to upload formula SEO OG image"));
  }
  const raw: unknown = await response.json();
  return parseSeoOgFormulaResponseBody(raw);
}

/**
 * `DELETE /admin/formula-marketing/formulas/{formulaId}/seo-og-image`
 * Response: updated formula JSON or 204 (caller may refetch).
 */
export async function deleteAdminFormulaMarketingSeoOgImage(
  accessToken: string,
  formulaId: string
): Promise<FormulaMarketingRow | undefined> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/formula-marketing/formulas/${encodeURIComponent(formulaId)}/seo-og-image`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to remove formula SEO OG image"));
  }
  if (response.status === 204) {
    return undefined;
  }
  const ct = response.headers.get("content-type");
  if (ct?.includes("application/json")) {
    const raw: unknown = await response.json();
    return parseSeoOgFormulaResponseBody(raw);
  }
  return undefined;
}

/** Published marketing release for a formula (admin list + SEO). */
export interface FormulaMarketingReleaseRow {
  id: string;
  formula_id?: string;
  slug: string;
  title: string;
  /** Server marks the live “current” published drop shown on the public hub. */
  is_current: boolean;
  published_at: string;
  as_of: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image_url: string | null;
}

function parseSeoOgReleaseResponseBody(raw: unknown): FormulaMarketingReleaseRow {
  if (!raw || typeof raw !== "object") {
    return raw as FormulaMarketingReleaseRow;
  }
  const o = raw as Record<string, unknown>;
  const inner = o.release ?? o.data;
  if (inner && typeof inner === "object") {
    return inner as FormulaMarketingReleaseRow;
  }
  return raw as FormulaMarketingReleaseRow;
}

function parseAdminFormulaMarketingReleasesPayload(
  raw: unknown
): FormulaMarketingReleaseRow[] {
  if (Array.isArray(raw)) {
    return raw as FormulaMarketingReleaseRow[];
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const arr = o.data ?? o.releases ?? o.items;
    if (Array.isArray(arr)) {
      return arr as FormulaMarketingReleaseRow[];
    }
  }
  return [];
}

/**
 * @see FormulaMarketingReleaseRow
 * `GET /admin/formula-marketing/releases?formula_id=<uuid>` (see backend marketing release admin API).
 */
export async function listAdminFormulaMarketingReleases(
  accessToken: string,
  formulaId: string
): Promise<FormulaMarketingReleaseRow[]> {
  const baseUrl = getApiUrl();
  const q = new URLSearchParams();
  q.set("formula_id", formulaId);
  const response = await fetch(`${baseUrl}/admin/formula-marketing/releases?${q}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to list marketing releases"));
  }
  const raw: unknown = await response.json();
  return parseAdminFormulaMarketingReleasesPayload(raw);
}

/** Ticker line from `GET/PUT /admin/formula-marketing/releases/:id` (with rows). */
export type FormulaMarketingReleaseLineRow = {
  ticker: string;
  entity_name?: string | null;
  name?: string | null;
  rank?: number | null;
  score?: number | null;
  confidence?: number | null;
  label?: string | null;
  summary?: string | null;
  explanation?: string | null;
};

function parseAdminFormulaReleaseDetailPayload(raw: unknown): {
  release: FormulaMarketingReleaseRow;
  rows: FormulaMarketingReleaseLineRow[];
} {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid release response");
  }
  const o = raw as Record<string, unknown>;
  const rows = Array.isArray(o.rows) ? (o.rows as FormulaMarketingReleaseLineRow[]) : [];
  if (o.release && typeof o.release === "object") {
    return { release: o.release as FormulaMarketingReleaseRow, rows };
  }
  const release: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (k === "rows" || k === "formula") {
      continue;
    }
    release[k] = v;
  }
  return { release: release as unknown as FormulaMarketingReleaseRow, rows };
}

/**
 * `GET /admin/formula-marketing/releases/:releaseId` — includes `rows` (ticker lines).
 * Response may be `{ release, rows, formula }` or a flat object with `rows` and release fields.
 */
export async function getAdminFormulaMarketingRelease(
  accessToken: string,
  releaseId: string
): Promise<{ release: FormulaMarketingReleaseRow; rows: FormulaMarketingReleaseLineRow[] }> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/formula-marketing/releases/${encodeURIComponent(releaseId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load release"));
  }
  const raw: unknown = await response.json();
  return parseAdminFormulaReleaseDetailPayload(raw);
}

export type PatchAdminFormulaMarketingReleaseBody = {
  seo_title?: string | null;
  seo_description?: string | null;
};

/**
 * @see PatchAdminFormulaMarketingReleaseBody
 * Assumed route: `PATCH /admin/formula-marketing/releases/{releaseId}`
 */
export async function patchAdminFormulaMarketingRelease(
  accessToken: string,
  releaseId: string,
  body: PatchAdminFormulaMarketingReleaseBody
): Promise<FormulaMarketingReleaseRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/formula-marketing/releases/${encodeURIComponent(releaseId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to update release SEO"));
  }
  return response.json() as Promise<FormulaMarketingReleaseRow>;
}

/**
 * `POST /admin/formula-marketing/releases/{releaseId}/seo-og-image` — multipart field `file`.
 * Response: updated release row (includes `seo_og_image_url`). Platform admin + bearer token.
 */
export async function uploadAdminFormulaMarketingReleaseSeoOgImage(
  accessToken: string,
  releaseId: string,
  file: File
): Promise<FormulaMarketingReleaseRow> {
  const baseUrl = getApiUrl();
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(
    `${baseUrl}/admin/formula-marketing/releases/${encodeURIComponent(
      releaseId
    )}/seo-og-image`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to upload release SEO OG image"));
  }
  const raw: unknown = await response.json();
  return parseSeoOgReleaseResponseBody(raw);
}

/**
 * `DELETE /admin/formula-marketing/releases/{releaseId}/seo-og-image`
 * Response: updated release JSON or 204 (UI refetches on empty).
 */
export async function deleteAdminFormulaMarketingReleaseSeoOgImage(
  accessToken: string,
  releaseId: string
): Promise<FormulaMarketingReleaseRow | undefined> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/formula-marketing/releases/${encodeURIComponent(
      releaseId
    )}/seo-og-image`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to remove release SEO OG image"));
  }
  if (response.status === 204) {
    return undefined;
  }
  const ct = response.headers.get("content-type");
  if (ct?.includes("application/json")) {
    const raw: unknown = await response.json();
    return parseSeoOgReleaseResponseBody(raw);
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Stock chart
// ---------------------------------------------------------------------------

export type StockChartRange = "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";

export interface StockChartPoint {
  ts: string;
  /** null for 1d (daily-line) bars — FMP serietype=line returns only close */
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
}

export interface StockChartData {
  symbol: string;
  range: StockChartRange;
  points: StockChartPoint[];
}

/** FMP v3 `stock_news` (headlines). */
export interface FmpStockNewsArticle {
  published_at: string | null;
  title: string;
  summary: string | null;
  url: string | null;
  source: string | null;
  symbols: string[];
}

/** FMP v3 `press-releases/{symbol}`. */
export interface FmpPressRelease {
  published_at: string | null;
  title: string;
  text: string | null;
  url: string | null;
}

export interface FmpStockNewsBundle {
  ticker: string;
  stock_news: FmpStockNewsArticle[];
  press_releases: FmpPressRelease[];
  warnings: string[];
}

export async function getFmpStockNews(
  accessToken: string,
  ticker: string,
  params?: { stock_limit?: number; press_limit?: number }
): Promise<FmpStockNewsBundle> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (params?.stock_limit != null) sp.set("stock_limit", String(params.stock_limit));
  if (params?.press_limit != null) sp.set("press_limit", String(params.press_limit));
  const qs = sp.toString();
  const response = await fetch(
    `${baseUrl}/fmp/stocks/${encodeURIComponent(ticker)}/news${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = typeof err?.message === "string" ? err.message : `Failed to load FMP news (${response.status})`;
    throw new Error(msg);
  }
  return response.json();
}

/** Rows from `security_fmp_news_items` (latest per channel, default 10 each). */
export async function getSecurityFmpNewsCached(
  accessToken: string,
  securityId: string,
  params?: { stock_limit?: number; press_limit?: number }
): Promise<FmpStockNewsBundle> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (params?.stock_limit != null) sp.set("stock_limit", String(params.stock_limit));
  if (params?.press_limit != null) sp.set("press_limit", String(params.press_limit));
  const qs = sp.toString();
  const response = await fetch(
    `${baseUrl}/fmp/securities/${encodeURIComponent(securityId)}/news${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg =
      typeof err?.message === "string" ? err.message : `Failed to load cached FMP news (${response.status})`;
    throw new Error(msg);
  }
  return response.json();
}

export interface IngestSecurityFmpNewsResult {
  security_id: string;
  ticker: string;
  upserted: number;
  stock_news_rows: number;
  press_release_rows: number;
  warnings: string[];
}

/** Platform admin: pull FMP stock_news + press-releases and upsert into `security_fmp_news_items`. */
export async function ingestSecurityFmpNewsFromFmp(
  accessToken: string,
  securityId: string,
  params?: { stock_limit?: number; press_limit?: number }
): Promise<IngestSecurityFmpNewsResult> {
  const baseUrl = getApiUrl();
  const sp = new URLSearchParams();
  if (params?.stock_limit != null) sp.set("stock_limit", String(params.stock_limit));
  if (params?.press_limit != null) sp.set("press_limit", String(params.press_limit));
  const qs = sp.toString();
  const response = await fetch(
    `${baseUrl}/fmp/securities/${encodeURIComponent(securityId)}/news/ingest${qs ? `?${qs}` : ""}`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg =
      typeof err?.message === "string" ? err.message : `FMP news ingest failed (${response.status})`;
    throw new Error(msg);
  }
  return response.json();
}

export async function getStockChart(
  accessToken: string,
  ticker: string,
  range: StockChartRange = "1D"
): Promise<StockChartData> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/fmp/stocks/${encodeURIComponent(ticker)}/chart?range=${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = typeof err?.message === "string" ? err.message : `Failed to load chart (${response.status})`;
    throw new Error(msg);
  }
  return response.json();
}

/** DB intervals: 5min→1D chart, 15min→5D chart, 1d→1M…MAX chart */
export type SecurityPriceBarInterval = "5min" | "15min" | "1d";

export interface IngestStockChartBarsResult {
  security_id: string;
  ticker: string;
  chart_range: StockChartRange;
  intervals: Partial<Record<SecurityPriceBarInterval, number>>;
  errors: string[];
}

/** Platform admin: fetch FMP data for the selected chart range and upsert into `security_price_bars`. */
export async function ingestStockChartBarsFromFmp(
  accessToken: string,
  securityId: string,
  range: StockChartRange
): Promise<IngestStockChartBarsResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/fmp/securities/${encodeURIComponent(securityId)}/chart-data/ingest?range=${encodeURIComponent(range)}`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg =
      typeof err?.message === "string" ? err.message : `Chart ingest failed (${response.status})`;
    throw new Error(msg);
  }
  return response.json();
}

/**
 * Precision-managed social media accounts (admin only).
 * The backend resolves the Precision org from its own `PRECISION_ORG_UUID` env var,
 * so the frontend does not send `organization_id` on these endpoints.
 *
 * The OAuth endpoints are platform-parameterized:
 *   /admin/integrations/social/oauth/{platform}/authorize-url
 *   /admin/integrations/social/oauth/{platform}/exchange
 *   /admin/integrations/social/oauth/{platform}/refresh
 */
export type SocialPlatform = "linkedin" | "facebook" | "x" | "instagram" | string;
export type SocialAccountStatus = "active" | "disconnected" | "error" | string;

export const CONFIGURABLE_SOCIAL_PLATFORMS = [
  "linkedin",
  "facebook",
  "instagram",
  "x",
  "tiktok",
] as const;
export type ConfigurableSocialPlatform = (typeof CONFIGURABLE_SOCIAL_PLATFORMS)[number];

export interface SocialAccountCredentials {
  token_expires_at: string | null;
  last_refreshed_at: string | null;
  last_refresh_error_at: string | null;
  last_refresh_error_message: string | null;
}

export interface SocialAccountRow {
  id: string;
  organization_id: string;
  platform: SocialPlatform;
  account_label: string | null;
  external_account_name: string | null;
  external_account_id: string | null;
  status: SocialAccountStatus;
  last_successful_publish_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  metadata?: {
    woop?: boolean;
    image_url?: string;
    woop_platform?: string;
    [key: string]: unknown;
  } | null;
  social_account_credentials: SocialAccountCredentials | null;
  created_at: string;
  updated_at: string;
}

export interface SocialAuthorizeUrlResponse {
  authorization_url: string;
  state: string;
  redirect_uri: string;
}

/** @deprecated Use `SocialAuthorizeUrlResponse`. */
export type LinkedInAuthorizeUrlResponse = SocialAuthorizeUrlResponse;

function parseSocialAccountsPayload(raw: unknown): SocialAccountRow[] {
  if (Array.isArray(raw)) return raw as SocialAccountRow[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const arr = o.data ?? o.items ?? o.accounts;
    if (Array.isArray(arr)) return arr as SocialAccountRow[];
  }
  return [];
}

export async function listPrecisionSocialAccounts(
  accessToken: string
): Promise<SocialAccountRow[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/integrations/social/accounts`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load social accounts"));
  }
  return parseSocialAccountsPayload(await response.json());
}

export function socialPlatformLabel(platform: SocialPlatform): string {
  if (platform === "linkedin") return "LinkedIn";
  if (platform === "facebook") return "Facebook";
  if (platform === "x") return "X (Twitter)";
  if (platform === "instagram") return "Instagram";
  if (platform === "tiktok") return "TikTok";
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

export async function refreshSocialAccountToken(
  accessToken: string,
  platform: ConfigurableSocialPlatform,
  socialAccountId: string
): Promise<SocialAccountRow | null> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/integrations/social/oauth/${encodeURIComponent(platform)}/refresh`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ social_account_id: socialAccountId }),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      adminApiErrorMessage(err, `Failed to refresh ${socialPlatformLabel(platform)} token`)
    );
  }
  if (response.status === 204) return null;
  const ct = response.headers.get("content-type");
  if (!ct?.includes("application/json")) return null;
  const raw: unknown = await response.json();
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const inner = o.data ?? o.account ?? raw;
    return inner as SocialAccountRow;
  }
  return null;
}

export async function getSocialAuthorizeUrl(
  accessToken: string,
  platform: ConfigurableSocialPlatform,
  options?: { redirectUri?: string }
): Promise<SocialAuthorizeUrlResponse> {
  const baseUrl = getApiUrl();
  const qs = new URLSearchParams();
  if (options?.redirectUri) qs.set("redirect_uri", options.redirectUri);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const response = await fetch(
    `${baseUrl}/admin/integrations/social/oauth/${encodeURIComponent(platform)}/authorize-url${suffix}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      adminApiErrorMessage(err, `Failed to start ${socialPlatformLabel(platform)} OAuth`)
    );
  }
  const raw: unknown = await response.json();
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid authorize-url response");
  }
  return raw as SocialAuthorizeUrlResponse;
}

export async function exchangeSocialOAuthCode(
  accessToken: string,
  platform: ConfigurableSocialPlatform,
  body: { code: string; state: string; redirect_uri?: string }
): Promise<SocialAccountRow | null> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/integrations/social/oauth/${encodeURIComponent(platform)}/exchange`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      adminApiErrorMessage(err, `${socialPlatformLabel(platform)} OAuth exchange failed`)
    );
  }
  if (response.status === 204) return null;
  const ct = response.headers.get("content-type");
  if (!ct?.includes("application/json")) return null;
  const raw: unknown = await response.json();
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const inner = o.data ?? o.account ?? raw;
    return inner as SocialAccountRow;
  }
  return null;
}

/** @deprecated Use `refreshSocialAccountToken(token, "linkedin", id)`. */
export const refreshLinkedInSocialAccountToken = (
  accessToken: string,
  socialAccountId: string
) => refreshSocialAccountToken(accessToken, "linkedin", socialAccountId);

/** MVP automated publish platforms (CON-167). */
export const SOCIAL_PUBLISH_PLATFORMS = ["facebook", "linkedin", "x"] as const;
export type SocialPublishPlatform = (typeof SOCIAL_PUBLISH_PLATFORMS)[number];

export interface SocialPostPreviewResponse {
  platform: string;
  post_kind: string;
  caption: string;
  link_url: string;
  suggested_social_account_id: string | null;
}

export interface SocialPostPublishResponse {
  id: string;
  status: string;
  external_post_id?: string;
  external_post_url?: string | null;
  publish_at?: string | null;
}

export async function previewSocialPostCaption(
  accessToken: string,
  body: {
    platform: string;
    link_url: string;
    share_title: string;
    share_summary?: string;
    ticker?: string;
    organization_name?: string;
    post_kind?: string;
    render_template_key?: string;
  }
): Promise<SocialPostPreviewResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/integrations/social/posts/preview`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to generate social caption preview"));
  }
  return (await response.json()) as SocialPostPreviewResponse;
}

export type SocialPublishMode = "now" | "schedule" | "draft";

export async function publishSocialPost(
  accessToken: string,
  body: {
    social_account_id: string;
    caption: string;
    link_url?: string;
    post_kind?: string;
    prompt_params?: Record<string, unknown>;
    publish?: boolean;
    publish_mode?: SocialPublishMode;
    publish_at?: string;
    media_ids?: string[];
  }
): Promise<SocialPostPublishResponse> {
  const baseUrl = getApiUrl();
  const publishMode = body.publish_mode ?? (body.publish === false ? "draft" : "now");
  const response = await fetch(`${baseUrl}/admin/integrations/social/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...body,
      publish: publishMode !== "draft",
      publish_mode: publishMode,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to publish to social account"));
  }
  return (await response.json()) as SocialPostPublishResponse;
}

export interface SocialPostRow {
  id: string;
  post_kind: string;
  status: string;
  caption: string | null;
  link_url: string | null;
  published_at: string | null;
  publish_at?: string | null;
  external_post_url: string | null;
  last_error_message: string | null;
  created_at: string;
  social_accounts?: { platform?: string; account_label?: string } | null;
}

export async function listSocialPosts(accessToken: string): Promise<SocialPostRow[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/integrations/social/posts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load social posts"));
  }
  const raw: unknown = await response.json();
  return Array.isArray(raw) ? (raw as SocialPostRow[]) : [];
}

export type SocialPromptTemplateRow = {
  id: string;
  template_key: string;
  channel: string;
  post_kind: string;
  purpose: string;
  prompt_role: string;
  template_text: string;
  required_context_keys: string[];
  is_active: boolean;
  version: number;
  change_note: string | null;
};

export type SocialRenderTemplateRow = {
  template_key: string;
  display_name: string;
  description: string | null;
  renderer: string;
  compatible_post_kinds: string[];
  default_prompt_bundle: Record<string, unknown>;
  is_active: boolean;
};

export type SocialRenderTemplateDetail = SocialRenderTemplateRow & {
  slot_links?: Array<{
    slot: string;
    sort_order: number;
    social_prompt_templates?: {
      id: string;
      template_key: string;
      prompt_role: string;
      channel: string;
      purpose: string;
    } | null;
  }>;
  resolved_prompts?: Array<{
    id: string;
    template_key: string;
    prompt_role: string;
    channel: string;
    post_kind?: string;
    purpose: string;
    template_text: string;
    is_active: boolean;
  }>;
};

export type SocialPromptPreviewResult = {
  caption: string;
  resolved_prompt_keys: string[];
  render_template_key: string;
  generation_id?: string;
};

export type SocialPromptGenerationRow = {
  id: string;
  organization_id: string;
  generation_kind: "caption" | "image_prompt" | "video_script";
  render_template_key: string | null;
  platform: string | null;
  post_kind: string | null;
  context: Record<string, unknown>;
  output_text: string;
  resolved_prompt_keys: string[];
  provider: "gemini" | "manual" | "woop_dashboard";
  woop_media_id: string | null;
  status: "text_only" | "media_linked" | "published";
  created_by_user_id: string | null;
  created_at: string;
};

export type SocialImagePromptPreviewResult = {
  image_prompt_text: string;
  resolved_prompt_keys: string[];
  render_template_key: string;
  generation_id?: string;
};

async function socialAdminFetch(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const baseUrl = getApiUrl();
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

export async function listSocialPromptTemplates(
  accessToken: string,
  params?: Record<string, string>
): Promise<SocialPromptTemplateRow[]> {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  const response = await socialAdminFetch(
    accessToken,
    `/admin/integrations/social/prompts/templates${qs}`
  );
  if (!response.ok) throw new Error("Failed to load prompt templates");
  return (await response.json()) as SocialPromptTemplateRow[];
}

export async function createSocialPromptTemplate(
  accessToken: string,
  body: Partial<SocialPromptTemplateRow> & {
    template_key: string;
    purpose: string;
    prompt_role: string;
    template_text: string;
  }
): Promise<SocialPromptTemplateRow> {
  const response = await socialAdminFetch(
    accessToken,
    "/admin/integrations/social/prompts/templates",
    { method: "POST", body: JSON.stringify(body) }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to create prompt template"));
  }
  return (await response.json()) as SocialPromptTemplateRow;
}

export type UpdateSocialPromptTemplateBody = {
  channel?: string;
  post_kind?: string;
  purpose?: string;
  prompt_role?: string;
  template_text?: string;
  required_context_keys?: string[];
  is_active?: boolean;
  change_note?: string | null;
};

export function pickUpdatePromptTemplateBody(
  draft: Partial<SocialPromptTemplateRow>
): UpdateSocialPromptTemplateBody {
  return {
    channel: draft.channel,
    post_kind: draft.post_kind,
    purpose: draft.purpose,
    prompt_role: draft.prompt_role,
    template_text: draft.template_text,
    required_context_keys: draft.required_context_keys,
    is_active: draft.is_active,
    change_note: draft.change_note ?? undefined,
  };
}

export async function updateSocialPromptTemplate(
  accessToken: string,
  id: string,
  body: UpdateSocialPromptTemplateBody
): Promise<SocialPromptTemplateRow> {
  const response = await socialAdminFetch(
    accessToken,
    `/admin/integrations/social/prompts/templates/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(body) }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to update prompt template"));
  }
  return (await response.json()) as SocialPromptTemplateRow;
}

export async function deleteSocialPromptTemplate(
  accessToken: string,
  id: string
): Promise<void> {
  const response = await socialAdminFetch(
    accessToken,
    `/admin/integrations/social/prompts/templates/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
  if (!response.ok) throw new Error("Failed to deactivate prompt template");
}

export async function listSocialRenderTemplates(
  accessToken: string
): Promise<SocialRenderTemplateRow[]> {
  const response = await socialAdminFetch(
    accessToken,
    "/admin/integrations/social/prompts/render-templates"
  );
  if (!response.ok) throw new Error("Failed to load render templates");
  return (await response.json()) as SocialRenderTemplateRow[];
}

export async function getSocialRenderTemplate(
  accessToken: string,
  templateKey: string
): Promise<SocialRenderTemplateDetail> {
  const response = await socialAdminFetch(
    accessToken,
    `/admin/integrations/social/prompts/render-templates/${encodeURIComponent(templateKey)}`
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load render template detail"));
  }
  return (await response.json()) as SocialRenderTemplateDetail;
}

export async function previewSocialPromptCaption(
  accessToken: string,
  body: {
    platform: string;
    post_kind?: string;
    render_template_key?: string;
    context: Record<string, string>;
  }
): Promise<SocialPromptPreviewResult> {
  const response = await socialAdminFetch(
    accessToken,
    "/admin/integrations/social/prompts/preview",
    { method: "POST", body: JSON.stringify(body) }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Prompt preview failed"));
  }
  return (await response.json()) as SocialPromptPreviewResult;
}

export type SocialGenerateImageResult = {
  woop_media_id: string;
  mime: string;
  image_prompt_text?: string;
  resolved_prompt_keys: string[];
  render_template_key: string;
  generation_id?: string;
};

export type SocialGenerateVideoScriptResult = {
  script_text: string;
  resolved_prompt_keys: string[];
  render_template_key: string;
  generation_id?: string;
};

export async function generateSocialPromptMedia(
  accessToken: string,
  body: {
    platform: string;
    post_kind?: string;
    render_template_key?: string;
    context: Record<string, string>;
    media_kind: "image" | "video_script";
  }
): Promise<SocialGenerateImageResult | SocialGenerateVideoScriptResult> {
  const response = await socialAdminFetch(
    accessToken,
    "/admin/integrations/social/prompts/generate-media",
    { method: "POST", body: JSON.stringify(body) }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Media generation failed"));
  }
  return (await response.json()) as SocialGenerateImageResult | SocialGenerateVideoScriptResult;
}

export async function listSocialPromptGenerations(
  accessToken: string,
  params?: { kind?: string; render_template_key?: string; limit?: string }
): Promise<SocialPromptGenerationRow[]> {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  const response = await socialAdminFetch(
    accessToken,
    `/admin/integrations/social/prompts/generations${qs}`
  );
  if (!response.ok) throw new Error("Failed to load generation history");
  return (await response.json()) as SocialPromptGenerationRow[];
}

export async function linkSocialPromptGenerationMedia(
  accessToken: string,
  generationId: string,
  woopMediaId: string
): Promise<SocialPromptGenerationRow> {
  const response = await socialAdminFetch(
    accessToken,
    `/admin/integrations/social/prompts/generations/${encodeURIComponent(generationId)}`,
    { method: "PATCH", body: JSON.stringify({ woop_media_id: woopMediaId }) }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to link Woop media"));
  }
  return (await response.json()) as SocialPromptGenerationRow;
}

export async function previewSocialImagePrompt(
  accessToken: string,
  body: {
    render_template_key?: string;
    context: Record<string, string>;
  }
): Promise<SocialImagePromptPreviewResult> {
  const response = await socialAdminFetch(
    accessToken,
    "/admin/integrations/social/prompts/preview-image-prompt",
    { method: "POST", body: JSON.stringify(body) }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to resolve image prompt"));
  }
  return (await response.json()) as SocialImagePromptPreviewResult;
}

function unwrapWoopMediaList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "media" in raw) {
    const inner = (raw as { media?: unknown }).media;
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

export async function listWoopMedia(accessToken: string): Promise<WoopMediaItem[]> {
  const response = await socialAdminFetch(accessToken, "/admin/integrations/social/woop/media");
  if (!response.ok) throw new Error("Failed to load Woop media");
  const raw = await response.json();
  return unwrapWoopMediaList(raw).map(parseWoopMediaItem);
}

export type WoopMediaItem = {
  id: string;
  mediaType: string;
  thumbnailUrl: string | null;
  url: string | null;
  createdAt: string | null;
  fileName: string | null;
};

export function parseWoopMediaItem(raw: unknown): WoopMediaItem {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(o.id ?? o.mediaId ?? ""),
    mediaType: String(o.mediaType ?? o.type ?? "unknown"),
    thumbnailUrl: (o.thumbnailUrl as string | undefined) ?? (o.thumbnail_url as string | undefined) ?? null,
    url: (o.url as string | undefined) ?? null,
    createdAt: (o.createdAt as string | undefined) ?? (o.created_at as string | undefined) ?? null,
    fileName: (o.fileName as string | undefined) ?? (o.file_name as string | undefined) ?? null,
  };
}

export type WoopValidateResult = {
  valid?: boolean;
  errors?: Array<{ message?: string; code?: string } | string>;
  warnings?: Array<{ message?: string; code?: string } | string>;
};

export async function validateWoopCompose(
  accessToken: string,
  body: {
    social_account_id: string;
    caption: string;
    link_url?: string;
    post_kind?: string;
    platform_inputs?: Record<string, unknown>;
    media_ids?: string[];
    publish_mode?: SocialPublishMode;
    publish_at?: string;
  }
): Promise<WoopValidateResult> {
  const response = await socialAdminFetch(
    accessToken,
    "/admin/integrations/social/woop/posts/validate-compose",
    { method: "POST", body: JSON.stringify(body) }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Post validation failed"));
  }
  return (await response.json()) as WoopValidateResult;
}

export async function listWoopWebhooks(accessToken: string): Promise<unknown[]> {
  const response = await socialAdminFetch(
    accessToken,
    "/admin/integrations/social/woop/webhooks"
  );
  if (!response.ok) throw new Error("Failed to load Woop webhooks");
  const raw = await response.json();
  return Array.isArray(raw) ? raw : [];
}

export async function createWoopWebhook(
  accessToken: string,
  body: { url: string; eventTypes: string[] }
): Promise<unknown> {
  const response = await socialAdminFetch(
    accessToken,
    "/admin/integrations/social/woop/webhooks",
    { method: "POST", body: JSON.stringify(body) }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to create webhook"));
  }
  return response.json();
}

export async function deleteWoopWebhook(
  accessToken: string,
  endpointId: string
): Promise<void> {
  const response = await socialAdminFetch(
    accessToken,
    `/admin/integrations/social/woop/webhooks/${encodeURIComponent(endpointId)}`,
    { method: "DELETE" }
  );
  if (!response.ok) throw new Error("Failed to delete webhook");
}

export async function getWoopPlatformInputs(
  accessToken: string,
  socialAccountId: string
): Promise<unknown> {
  const response = await socialAdminFetch(
    accessToken,
    `/admin/integrations/social/woop/accounts/${encodeURIComponent(socialAccountId)}/platform-inputs`
  );
  if (!response.ok) throw new Error("Failed to load platform inputs");
  return response.json();
}

export async function startWoopMediaUpload(
  accessToken: string,
  fileSizeInBytes: number
): Promise<unknown> {
  const response = await socialAdminFetch(
    accessToken,
    "/admin/integrations/social/woop/media/upload-sessions",
    { method: "POST", body: JSON.stringify({ fileSizeInBytes }) }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to start media upload"));
  }
  return response.json();
}

export async function completeWoopMediaUpload(
  accessToken: string,
  sessionId: string
): Promise<unknown> {
  const response = await socialAdminFetch(
    accessToken,
    `/admin/integrations/social/woop/media/upload-sessions/${encodeURIComponent(sessionId)}/complete`,
    { method: "POST" }
  );
  if (!response.ok) throw new Error("Failed to complete media upload");
  return response.json();
}

/** @deprecated Use `getSocialAuthorizeUrl(token, "linkedin")`. */
export const getLinkedInAuthorizeUrl = (accessToken: string) =>
  getSocialAuthorizeUrl(accessToken, "linkedin");

/** @deprecated Use `exchangeSocialOAuthCode(token, "linkedin", body)`. */
export const exchangeLinkedInOAuthCode = (
  accessToken: string,
  body: { code: string; state: string; redirect_uri: string }
) => exchangeSocialOAuthCode(accessToken, "linkedin", body);

/**
 * Marketing contact / demo-request submission.
 *
 * Public endpoint — no Authorization header. The browser origin of the marketing
 * site must be allowlisted in the backend's `CORS_ORIGIN` env var.
 *
 * Backend returns 201 `{ ok: true }` on success; surfaces 400 (validation),
 * 429 (rate limit), or 503 (email provider unavailable).
 */
/** `GET /admin/monetization/plans` — platform admin (CON-160). */
export type SubscriptionPlanAdminRow = {
  id: string;
  plan_key: string;
  stripe_product_id: string;
  stripe_price_id: string;
  display_name: string | null;
  billing_interval: string | null;
  currency: string | null;
  amount_cents: number | null;
  pricing_model: "flat" | "per_seat";
  seat_based_enabled: boolean;
  unit_amount_cents: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SyncPlansFromStripeResult = {
  updated: number;
  unchanged: number;
  skipped: number;
  errors: { plan_key: string; message: string }[];
};

export async function fetchAdminMonetizationPlans(
  accessToken: string,
  options?: { active?: boolean }
): Promise<SubscriptionPlanAdminRow[]> {
  const baseUrl = getApiUrl();
  const params = new URLSearchParams();
  if (options?.active === true) params.set("active", "true");
  if (options?.active === false) params.set("active", "false");
  const q = params.toString();
  const response = await fetch(
    `${baseUrl}/admin/monetization/plans${q ? `?${q}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load subscription plans"));
  }
  return response.json() as Promise<SubscriptionPlanAdminRow[]>;
}

export async function syncAdminMonetizationPlansFromStripe(
  accessToken: string
): Promise<SyncPlansFromStripeResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/monetization/plans/sync-stripe`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to sync plans from Stripe"));
  }
  return response.json() as Promise<SyncPlansFromStripeResult>;
}

export type EntitlementCell = {
  id: string | null;
  plan_id: string;
  capability_key: string;
  is_enabled: boolean;
  hard_block: boolean;
  quota_period: "day" | "month" | "lifetime" | null;
  quota_limit: number | null;
  upsell_message: string | null;
  updated_at: string | null;
  updated_by_user_id: string | null;
};

export type EntitlementMatrixRow = {
  capability_key: string;
  display_name: string;
  description: string;
  is_mutating: boolean;
  cells: EntitlementCell[];
};

export type EntitlementsMatrixResponse = {
  plans: SubscriptionPlanAdminRow[];
  rows: EntitlementMatrixRow[];
};

export async function fetchAdminEntitlementsMatrix(
  accessToken: string
): Promise<EntitlementsMatrixResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/monetization/entitlements/matrix`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load entitlements matrix"));
  }
  return response.json() as Promise<EntitlementsMatrixResponse>;
}

export type PatchAdminEntitlementBody = {
  is_enabled: boolean;
  hard_block?: boolean;
  quota_period?: "day" | "month" | "lifetime" | null;
  quota_limit?: number | null;
  upsell_message?: string | null;
};

export async function patchAdminEntitlement(
  accessToken: string,
  planId: string,
  capabilityKey: string,
  body: PatchAdminEntitlementBody
): Promise<EntitlementCell> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/monetization/entitlements/${encodeURIComponent(planId)}/${encodeURIComponent(capabilityKey)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to save entitlement"));
  }
  return response.json() as Promise<EntitlementCell>;
}

export type BulkEnableReadonlyResult = {
  plans_updated: number;
  entitlements_upserted: number;
};

export async function bulkEnableAdminReadonlyEntitlements(
  accessToken: string,
  planId?: string
): Promise<BulkEnableReadonlyResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/monetization/entitlements/bulk/enable-readonly`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(planId ? { plan_id: planId } : {}),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to enable read-only capabilities"));
  }
  return response.json() as Promise<BulkEnableReadonlyResult>;
}

export type CopyEntitlementsResult = {
  entitlements_copied: number;
};

export async function copyAdminPlanEntitlements(
  accessToken: string,
  sourcePlanId: string,
  targetPlanId: string
): Promise<CopyEntitlementsResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/monetization/entitlements/bulk/copy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_plan_id: sourcePlanId,
      target_plan_id: targetPlanId,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to copy entitlements"));
  }
  return response.json() as Promise<CopyEntitlementsResult>;
}

export type EntitlementPreviewReason =
  | "allowed"
  | "allowed_with_quota"
  | "not_enabled"
  | "hard_block";

export type EntitlementPreviewResult = {
  allowed: boolean;
  reason: EntitlementPreviewReason;
  upsell_message: string | null;
  plan: {
    id: string;
    plan_key: string;
    display_name: string | null;
  };
  capability: {
    capability_key: string;
    display_name: string;
    description: string;
  };
  entitlement: {
    is_enabled: boolean;
    hard_block: boolean;
    quota_period: "day" | "month" | "lifetime" | null;
    quota_limit: number | null;
    upsell_message: string | null;
  } | null;
};

export async function previewAdminEntitlement(
  accessToken: string,
  planId: string,
  capabilityKey: string
): Promise<EntitlementPreviewResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/monetization/entitlements/preview`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: planId,
      capability_key: capabilityKey,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to preview entitlement"));
  }
  return response.json() as Promise<EntitlementPreviewResult>;
}

export type OrgSubscriptionListItem = {
  organization_id: string;
  organization_name: string;
  organization_stripe_customer_id: string | null;
  subscription_row_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  plan_key: string;
  plan_display_name: string | null;
  seat_quantity: number;
  current_period_end: string | null;
  updated_at: string;
};

export type OrgSubscriptionDetailResponse = {
  organization: {
    id: string;
    name: string;
    stripe_customer_id: string | null;
  };
  subscription: {
    id: string;
    status: string;
    seat_quantity: number;
    price_per_seat_cents: number | null;
    current_period_start: string | null;
    current_period_end: string | null;
    trial_end: string | null;
    cancel_at_period_end: boolean;
    last_stripe_event_at: string | null;
    stripe_customer_id: string;
    stripe_subscription_id: string;
    plan: { plan_key: string; display_name: string | null };
  } | null;
};

export async function searchAdminOrgSubscriptions(
  accessToken: string,
  q?: string
): Promise<OrgSubscriptionListItem[]> {
  const baseUrl = getApiUrl();
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  const qs = params.toString();
  const response = await fetch(
    `${baseUrl}/admin/monetization/organizations${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to search organization subscriptions"));
  }
  return response.json() as Promise<OrgSubscriptionListItem[]>;
}

export async function fetchAdminOrgSubscriptionDetail(
  accessToken: string,
  organizationId: string
): Promise<OrgSubscriptionDetailResponse> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/monetization/organizations/${encodeURIComponent(organizationId)}/subscription`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load organization subscription"));
  }
  return response.json() as Promise<OrgSubscriptionDetailResponse>;
}

export type StripeEventLogStatus = "pending" | "processed" | "failed";

export type StripeEventLogListItem = {
  id: string;
  stripe_event_id: string;
  event_type: string;
  status: StripeEventLogStatus;
  received_at: string;
  processed_at: string | null;
  error_message: string | null;
};

export type StripeEventLogDetail = StripeEventLogListItem & {
  payload: Record<string, unknown>;
};

export type RetryStripeEventResult = {
  id: string;
  stripe_event_id: string;
  status: StripeEventLogStatus;
  processed_at: string | null;
  error_message: string | null;
};

export async function listAdminStripeEvents(
  accessToken: string,
  options?: {
    status?: StripeEventLogStatus;
    event_type?: string;
    q?: string;
    limit?: number;
  }
): Promise<StripeEventLogListItem[]> {
  const baseUrl = getApiUrl();
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.event_type?.trim()) params.set("event_type", options.event_type.trim());
  if (options?.q?.trim()) params.set("q", options.q.trim());
  if (options?.limit) params.set("limit", String(options.limit));
  const qs = params.toString();
  const response = await fetch(
    `${baseUrl}/admin/monetization/stripe-events${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load Stripe event log"));
  }
  return response.json() as Promise<StripeEventLogListItem[]>;
}

export async function fetchAdminStripeEventDetail(
  accessToken: string,
  logId: string
): Promise<StripeEventLogDetail> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/monetization/stripe-events/${encodeURIComponent(logId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load Stripe event"));
  }
  return response.json() as Promise<StripeEventLogDetail>;
}

export async function retryAdminStripeEvent(
  accessToken: string,
  logId: string
): Promise<RetryStripeEventResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/monetization/stripe-events/${encodeURIComponent(logId)}/retry`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to retry Stripe event"));
  }
  return response.json() as Promise<RetryStripeEventResult>;
}

// --- Credits (CON-97 / CON-162) ---

export type OrganizationCreditWallet = {
  organization_id: string;
  base_credits_in_cycle: number;
  base_credits_remaining: number;
  pack_credits_remaining: number;
  total_credits_remaining: number;
  cycle_start: string | null;
  cycle_end: string | null;
  last_reset_at: string | null;
  last_consumed_at: string | null;
};

export type CreditPackCatalogItem = {
  pack_key: string;
  name: string;
  credits_amount: number;
  currency: string;
  unit_amount_cents: number | null;
};

export type CreditPackAdminRow = {
  id: string;
  pack_key: string;
  name: string;
  credits_amount: number;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  currency: string;
  unit_amount_cents: number | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

export type SyncCreditPacksFromStripeResult = {
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  errors: { pack_key: string; message: string }[];
};

export type CapabilityCreditCostAdminRow = {
  capability_key: string;
  display_name: string;
  description: string;
  credits_cost: number;
  is_enabled: boolean;
  updated_at: string;
};

export type CreditPolicyConfig = {
  id: string;
  config_key: string;
  consumption_order: string;
  pack_expiry_days: number;
  base_carryover_enabled: boolean;
  pack_carryover_until_expiry: boolean;
  carryover_cap_credits: number | null;
  upgrade_proration_mode: string;
  downgrade_effective_mode: string;
  updated_at: string;
};

export type CreditTransactionRow = {
  id: string;
  organization_id: string;
  tx_type: string;
  bucket_type: string;
  credits_delta: number;
  capability_key: string | null;
  reference_id: string | null;
  note: string | null;
  occurred_at: string;
};

export type AdminCreditWalletRow = {
  id: string;
  organization_id: string;
  base_credits_in_cycle: number;
  base_credits_remaining: number;
  pack_credits_remaining: number;
  cycle_start: string | null;
  cycle_end: string | null;
  organizations: { id: string; name: string } | { id: string; name: string }[] | null;
};

export async function fetchOrganizationCreditWallet(
  accessToken: string,
  organizationId: string
): Promise<OrganizationCreditWallet> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${encodeURIComponent(organizationId)}/credits/wallet`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load credit balance"));
  }
  return response.json() as Promise<OrganizationCreditWallet>;
}

export async function fetchOrganizationCreditPacks(
  accessToken: string,
  organizationId: string
): Promise<CreditPackCatalogItem[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${encodeURIComponent(organizationId)}/credits/packs`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load credit packs"));
  }
  return response.json() as Promise<CreditPackCatalogItem[]>;
}

export async function createOrganizationCreditPackCheckout(
  accessToken: string,
  organizationId: string,
  packKey: string
): Promise<{ url: string; sessionId: string }> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/organizations/${encodeURIComponent(organizationId)}/credits/checkout`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pack_key: packKey }),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to start credit checkout"));
  }
  return response.json() as Promise<{ url: string; sessionId: string }>;
}

export async function fetchAdminCreditPacks(
  accessToken: string
): Promise<CreditPackAdminRow[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/monetization/credit-packs`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load credit packs"));
  }
  return response.json() as Promise<CreditPackAdminRow[]>;
}

export async function syncAdminCreditPacksFromStripe(
  accessToken: string
): Promise<SyncCreditPacksFromStripeResult> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/monetization/credit-packs/sync-stripe`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to sync credit packs from Stripe"));
  }
  return response.json() as Promise<SyncCreditPacksFromStripeResult>;
}

export async function fetchAdminCreditCosts(
  accessToken: string
): Promise<CapabilityCreditCostAdminRow[]> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/monetization/credit-costs`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load credit costs"));
  }
  return response.json() as Promise<CapabilityCreditCostAdminRow[]>;
}

export async function patchAdminCreditCost(
  accessToken: string,
  capabilityKey: string,
  body: { credits_cost: number; is_enabled?: boolean }
): Promise<CapabilityCreditCostAdminRow> {
  const baseUrl = getApiUrl();
  const response = await fetch(
    `${baseUrl}/admin/monetization/credit-costs/${encodeURIComponent(capabilityKey)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to update credit cost"));
  }
  return response.json() as Promise<CapabilityCreditCostAdminRow>;
}

export async function fetchAdminCreditPolicy(
  accessToken: string
): Promise<CreditPolicyConfig> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/monetization/credit-policy`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load credit policy"));
  }
  return response.json() as Promise<CreditPolicyConfig>;
}

export async function patchAdminCreditPolicy(
  accessToken: string,
  body: Partial<
    Pick<
      CreditPolicyConfig,
      | "pack_expiry_days"
      | "base_carryover_enabled"
      | "pack_carryover_until_expiry"
      | "carryover_cap_credits"
      | "upgrade_proration_mode"
      | "downgrade_effective_mode"
    >
  >
): Promise<CreditPolicyConfig> {
  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}/admin/monetization/credit-policy`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to update credit policy"));
  }
  return response.json() as Promise<CreditPolicyConfig>;
}

export async function fetchAdminCreditWallets(
  accessToken: string,
  options?: { q?: string; limit?: number; organization_id?: string }
): Promise<AdminCreditWalletRow[]> {
  const baseUrl = getApiUrl();
  const params = new URLSearchParams();
  if (options?.q) params.set("q", options.q);
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.organization_id) params.set("organization_id", options.organization_id);
  const q = params.toString();
  const response = await fetch(
    `${baseUrl}/admin/monetization/credit-wallets${q ? `?${q}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load credit wallets"));
  }
  return response.json() as Promise<AdminCreditWalletRow[]>;
}

export async function fetchAdminCreditTransactions(
  accessToken: string,
  options?: {
    organization_id?: string;
    tx_type?: string;
    bucket_type?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }
): Promise<CreditTransactionRow[]> {
  const baseUrl = getApiUrl();
  const params = new URLSearchParams();
  if (options?.organization_id) params.set("organization_id", options.organization_id);
  if (options?.tx_type) params.set("tx_type", options.tx_type);
  if (options?.bucket_type) params.set("bucket_type", options.bucket_type);
  if (options?.from) params.set("from", options.from);
  if (options?.to) params.set("to", options.to);
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.offset != null) params.set("offset", String(options.offset));
  const q = params.toString();
  const response = await fetch(
    `${baseUrl}/admin/monetization/credit-transactions${q ? `?${q}` : ""}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(adminApiErrorMessage(err, "Failed to load credit transactions"));
  }
  return response.json() as Promise<CreditTransactionRow[]>;
}

export type MarketingContactPayload = {
  name: string;
  firm: string;
  email: string;
  role: string;
  message: string;
};

export async function submitMarketingContact(
  payload: MarketingContactPayload
): Promise<void> {
  const baseUrl = getApiUrl();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/marketing/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "We couldn't reach the server. Check your connection and try again."
    );
  }

  if (response.ok) return;

  if (response.status === 429) {
    throw new Error(
      "You've sent a few messages in a short time. Please wait a minute and try again."
    );
  }
  if (response.status === 503) {
    throw new Error(
      "Our email service is temporarily unavailable. Please email alex@withprecision.ai instead."
    );
  }

  if (response.status === 400) {
    const err = await response.json().catch(() => null);
    const msg = (err as { message?: string | string[] } | null)?.message;
    if (Array.isArray(msg)) throw new Error(msg.join("; "));
    if (typeof msg === "string" && msg) throw new Error(msg);
    throw new Error("Please double-check the form fields and try again.");
  }

  throw new Error("Something went wrong. Please try again in a moment.");
}
