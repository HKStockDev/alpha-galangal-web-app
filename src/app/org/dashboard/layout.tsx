"use client";

import { useAuth } from "@/context/auth-context";
import { AppShell } from "@/components/dashboard/app-shell";
import { ADMIN_DASHBOARD, ORG_DASHBOARD } from "@/lib/auth-routing";
import { fetchMyOrganizations } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { BillingEntitlementBanner } from "@/components/billing/billing-entitlement-banner";
import { OrgChatAssistantDock } from "@/components/org-assistant/org-chat-assistant-dock";
import { OrgChatAssistantProvider } from "@/components/org-assistant/org-chat-assistant-provider";

export default function OrgDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, accessToken, isLoading } = useAuth();
  const router = useRouter();
  const orgCheckDone = useRef(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.is_platform_admin) {
      router.replace(ADMIN_DASHBOARD);
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (isLoading || !user || !accessToken || user.is_platform_admin) return;
    if (orgCheckDone.current) return;
    let cancelled = false;
    (async () => {
      try {
        const orgs = await fetchMyOrganizations(accessToken);
        if (cancelled) return;
        orgCheckDone.current = true;
        if (orgs.length === 0) {
          router.replace("/onboarding");
        }
      } catch {
        orgCheckDone.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, accessToken, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.is_platform_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <OrgChatAssistantProvider>
      <AppShell basePath={ORG_DASHBOARD}>
        <BillingEntitlementBanner />
        {children}
        <OrgChatAssistantDock />
      </AppShell>
    </OrgChatAssistantProvider>
  );
}
