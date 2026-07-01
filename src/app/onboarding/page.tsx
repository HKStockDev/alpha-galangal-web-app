"use client";

import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  checkOrganizationSlug,
  createOrganization,
  fetchMyOrganizations,
  updateMyProfile,
  type OrganizationType,
} from "@/lib/api";
import { InviteTeammateForm } from "@/components/organization/invite-teammate-form";
import { TeamInvitationsList } from "@/components/organization/team-invitations-list";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { ADMIN_DASHBOARD, ORG_DASHBOARD } from "@/lib/auth-routing";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GhostButton, PrimaryButton } from "@/components/ui-kit/buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { PasswordInput } from "@/components/ui-kit/password-input";

const ORG_TYPE_OPTIONS: { value: OrganizationType; label: string }[] = [
  { value: "ria", label: "Registered Investment Advisor (RIA)" },
  { value: "research_firm", label: "Independent research firm" },
  { value: "hedge_fund", label: "Hedge fund" },
  { value: "family_office", label: "Family office" },
  { value: "asset_manager", label: "Asset manager" },
];

function stepHeading(
  step: number,
  accessToken: string | null | undefined
): { title: string; description: string } {
  switch (step) {
    case 1:
      if (accessToken) {
        return {
          title: "Continue setup",
          description:
            "Your account is ready. Next you will create your organization workspace and become its admin.",
        };
      }
      return {
        title: "Create your account",
        description:
          "Start here with your email. You will then name your organization, confirm how you appear to teammates, and optionally send invitations.",
      };
    case 2:
      return {
        title: "Create your organization",
        description:
          "Choose a display name and a unique URL slug. Add your company domain if you want enrichment from public sources after creation.",
      };
    case 3:
      return {
        title: "Your profile",
        description: "This name appears in the product when teammates collaborate with you.",
      };
    case 4:
      return {
        title: "Invite your team",
        description:
          "Optional but recommended: add colleagues by email. You can always invite more people later from the team area.",
      };
    default:
      return { title: "Setup", description: "" };
  }
}

export default function OnboardingPage() {
  const { accessToken, user, isLoading, register, logout, refetchUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [booting, setBooting] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Step 1 — register
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Step 2 — organization
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgType, setOrgType] = useState<OrganizationType>("research_firm");
  const [orgDomain, setOrgDomain] = useState("");
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available?: boolean;
    valid_format?: boolean;
  }>({ checking: false });
  const [orgSubmitting, setOrgSubmitting] = useState(false);

  // Step 3 — profile
  const [profileName, setProfileName] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Step 4 — invites (list reload after send)
  const [inviteListNonce, setInviteListNonce] = useState(0);

  useEffect(() => {
    if (isLoading) return;

    if (!accessToken) {
      setStep(1);
      setBooting(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const orgs = await fetchMyOrganizations(accessToken);
        if (cancelled) return;
        if (orgs.length > 0) {
          router.replace(
            user?.is_platform_admin ? ADMIN_DASHBOARD : ORG_DASHBOARD
          );
          return;
        }
        setStep(2);
      } catch {
        if (!cancelled) setStep(2);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, isLoading, router, user?.is_platform_admin]);

  useEffect(() => {
    if (user?.full_name) {
      setProfileName((prev) => prev || user.full_name || "");
    }
  }, [user?.full_name]);

  useEffect(() => {
    if (!accessToken || step < 2) return;
    const slug = orgSlug.trim().toLowerCase();
    if (slug.length < 1) {
      setSlugStatus({ checking: false });
      return;
    }
    const t = setTimeout(() => {
      setSlugStatus((s) => ({ ...s, checking: true }));
      checkOrganizationSlug(accessToken, slug)
        .then((r) => {
          setSlugStatus({ checking: false, available: r.available, valid_format: r.valid_format });
        })
        .catch(() => {
          setSlugStatus({ checking: false });
        });
    }, 400);
    return () => clearTimeout(t);
  }, [orgSlug, accessToken, step]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegSubmitting(true);
    try {
      await register(regEmail, regPassword, regFullName.trim() || undefined);
      showSuccess("Account created");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegSubmitting(false);
    }
  }

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setOrgSubmitting(true);
    try {
      const domain = orgDomain.trim() || undefined;
      const org = await createOrganization(accessToken, {
        name: orgName.trim(),
        slug: orgSlug.trim().toLowerCase(),
        organization_type: orgType,
        enrichment_domain: domain,
      });
      setOrgId(org.id);
      showSuccess("Organization created — you are the admin");
      setStep(3);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not create organization");
    } finally {
      setOrgSubmitting(false);
    }
  }

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setProfileSubmitting(true);
    try {
      await updateMyProfile(accessToken, profileName.trim());
      await refetchUser();
      showSuccess("Profile saved");
      setStep(4);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setProfileSubmitting(false);
    }
  }

  const heading = stepHeading(step, accessToken);

  if (isLoading || booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 sm:py-12 dark:bg-muted/15">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <Link
            href="/m"
            className="text-base font-semibold tracking-tight text-primary hover:text-primary/90"
          >
            Precision
          </Link>
          <h1 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Set up your organization
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
            A short guided flow: account, workspace, your name, then optional invites—so your team
            can start researching together.
          </p>
        </header>

        <OnboardingProgress currentStep={step} />

        <Card className="mt-6 shadow-md">
          <CardHeader className="gap-4 border-b border-border px-6 pb-6 pt-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1.5 text-left">
                <CardTitle className="text-xl sm:text-2xl">{heading.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed sm:text-base">
                  {heading.description}
                </CardDescription>
              </div>
              <GhostButton
                type="button"
                size="sm"
                className="shrink-0 self-start sm:mt-0.5"
                onClick={() => logout()}
              >
                Sign out
              </GhostButton>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-8 pt-6 sm:px-8">
          {step === 1 && (
            <>
              {accessToken ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Signed in as <span className="font-medium text-foreground">{user?.email}</span>
                  </p>
                  <PrimaryButton
                    type="button"
                    className="h-11 w-full rounded-lg"
                    onClick={() => setStep(2)}
                  >
                    Continue to organization
                  </PrimaryButton>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Full name
                    </label>
                    <input
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground"
                      placeholder="Jane Doe"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Password
                    </label>
                    <PasswordInput
                      required
                      minLength={8}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground"
                      autoComplete="new-password"
                    />
                  </div>
                  <PrimaryButton
                    type="submit"
                    disabled={regSubmitting}
                    className="h-11 w-full rounded-lg disabled:opacity-60"
                  >
                    {regSubmitting ? "Creating account…" : "Continue"}
                  </PrimaryButton>
                </form>
              )}

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {step === 2 && accessToken && (
            <>
              <form onSubmit={handleCreateOrg} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Organization name
                  </label>
                  <input
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground"
                    placeholder="Skew Labs"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    URL slug
                  </label>
                  <input
                    required
                    value={orgSlug}
                    onChange={(e) =>
                      setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 font-mono text-sm text-foreground"
                    placeholder="skew-labs"
                  />
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    Reserved for your workspace identifier in the product. Choose carefully—it is
                    difficult to change later.
                  </p>
                  {orgSlug.length >= 1 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {slugStatus.checking
                        ? "Checking availability…"
                        : slugStatus.valid_format === false
                          ? "Use lowercase letters, numbers, and hyphens only."
                          : slugStatus.available === false
                            ? "This slug is already taken."
                            : slugStatus.available === true
                              ? "This slug is available."
                              : null}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Organization type
                  </label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground"
                  >
                    {ORG_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Company domain (optional, for Apollo enrichment)
                  </label>
                  <input
                    value={orgDomain}
                    onChange={(e) => setOrgDomain(e.target.value.trim())}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground"
                    placeholder="example.com"
                  />
                </div>
                <PrimaryButton
                  type="submit"
                  disabled={
                    orgSubmitting ||
                    orgSlug.trim().length < 1 ||
                    slugStatus.checking ||
                    slugStatus.available !== true ||
                    slugStatus.valid_format === false
                  }
                  className="h-11 w-full rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {orgSubmitting ? "Creating…" : "Create organization"}
                </PrimaryButton>
              </form>
            </>
          )}

          {step === 3 && accessToken && (
            <>
              <form onSubmit={handleProfile} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Display name
                  </label>
                  <input
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground"
                    placeholder="Jane Doe"
                  />
                </div>
                <PrimaryButton
                  type="submit"
                  disabled={profileSubmitting}
                  className="h-11 w-full rounded-lg disabled:opacity-60"
                >
                  {profileSubmitting ? "Saving…" : "Continue to invites"}
                </PrimaryButton>
              </form>
            </>
          )}

          {step === 4 && accessToken && orgId && (
            <>
              <div className="mb-6">
                <InviteTeammateForm
                  accessToken={accessToken}
                  organizationId={orgId}
                  variant="onboarding"
                  onInvitationSent={() =>
                    setInviteListNonce((n) => n + 1)
                  }
                />
              </div>

              <div className="mb-6">
                <TeamInvitationsList
                  accessToken={accessToken}
                  organizationId={orgId}
                  reloadNonce={inviteListNonce}
                  variant="onboarding"
                />
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4 dark:bg-muted/20">
                <p className="text-sm font-medium text-foreground">What&apos;s next</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  After you open the dashboard, try these to get value quickly:
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link
                      href={`${ORG_DASHBOARD}/screener`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Multi-factor screener
                    </Link>
                    <span className="text-muted-foreground"> — rank names with your formulas</span>
                  </li>
                  <li>
                    <Link
                      href={`${ORG_DASHBOARD}/team`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Team
                    </Link>
                    <span className="text-muted-foreground"> — add or resend invites anytime</span>
                  </li>
                  <li>
                    <Link
                      href={`${ORG_DASHBOARD}/clients`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Clients
                    </Link>
                    <span className="text-muted-foreground"> — structure who you cover</span>
                  </li>
                </ul>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Invitations can wait—you can return to them from{" "}
                <span className="font-medium text-foreground">Team</span> whenever you are ready.
              </p>

              <PrimaryButton
                type="button"
                className="h-11 w-full rounded-lg"
                onClick={() => {
                  showSuccess("Welcome to Precision");
                  router.push(
                    user?.is_platform_admin ? ADMIN_DASHBOARD : ORG_DASHBOARD
                  );
                }}
              >
                Go to dashboard
              </PrimaryButton>
            </>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
