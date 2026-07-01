"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { fetchMyOrganizations, fetchOrganizationBillingStatus } from "@/lib/api";
import { InviteTeammateForm } from "@/components/organization/invite-teammate-form";
import { TeamInvitationsList } from "@/components/organization/team-invitations-list";
import { TeamMembersList } from "@/components/organization/team-members-list";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OrgTeamPage() {
  const { accessToken, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [inviteListNonce, setInviteListNonce] = useState(0);
  const [membersListNonce, setMembersListNonce] = useState(0);
  const [perSeatBilling, setPerSeatBilling] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const orgs = await fetchMyOrganizations(accessToken);
        if (cancelled) return;
        if (orgs.length === 0) {
          setOrgId(null);
          setIsOrgAdmin(false);
          setOrgName(null);
        } else {
          const first = orgs[0];
          setOrgId(first.id);
          setIsOrgAdmin(first.role === "org_admin");
          setOrgName(first.name);
          try {
            const billing = await fetchOrganizationBillingStatus(
              accessToken,
              first.id
            );
            if (!cancelled) {
              const planKey = billing.subscription?.plan_key ?? "";
              setPerSeatBilling(planKey.startsWith("team_"));
            }
          } catch {
            if (!cancelled) setPerSeatBilling(false);
          }
        }
      } catch {
        if (!cancelled) {
          setOrgId(null);
          setIsOrgAdmin(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-12">
        <LoadingSkeleton variant="card" lines={3} className="w-full max-w-md" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
        <EmptyState compact description="No organization found." />
      </div>
    );
  }

  if (!isOrgAdmin) {
    return (
      <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
        <div className="mx-auto max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Team
          </h1>
          <p className="text-sm text-muted-foreground">
            Only organization admins can invite people or manage invitations.
            Ask an admin if you need access for a colleague.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Team
          </h1>
          <p className="text-base text-muted-foreground">
            Invite people to {orgName ?? "your organization"}, manage members,
            and review pending invitations.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Team members</CardTitle>
            <CardDescription>
              Active members with access to your organization. Removing someone
              revokes their access immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamMembersList
              accessToken={accessToken}
              organizationId={orgId}
              currentUserId={user?.id ?? null}
              perSeatBilling={perSeatBilling}
              reloadNonce={membersListNonce}
              onMemberRemoved={() => setMembersListNonce((n) => n + 1)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite by email</CardTitle>
            <CardDescription>
              We&apos;ll send a link to join your organization. You can cancel
              or resend invitations below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <InviteTeammateForm
              accessToken={accessToken}
              organizationId={orgId}
              perSeatBilling={perSeatBilling}
              onInvitationSent={() => {
                setInviteListNonce((n) => n + 1);
                setMembersListNonce((n) => n + 1);
              }}
            />
            <TeamInvitationsList
              accessToken={accessToken}
              organizationId={orgId}
              reloadNonce={inviteListNonce}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
