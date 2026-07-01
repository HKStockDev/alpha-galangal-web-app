"use client";

import { useAuth } from "@/context/auth-context";
import { defaultDashboardPath } from "@/lib/auth-routing";
import { fetchMyOrganizations } from "@/lib/api";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { LoginFormCard } from "@/components/auth/login-form-card";

export default function Home() {
  const { user, isLoading, accessToken } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (isLoading || !user || redirected.current) return;
    if (user.is_platform_admin) {
      redirected.current = true;
      router.replace("/admin/dashboard");
      return;
    }
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const orgs = await fetchMyOrganizations(accessToken);
        if (cancelled) return;
        redirected.current = true;
        router.replace(defaultDashboardPath(user, orgs.length > 0));
      } catch {
        if (!cancelled) {
          redirected.current = true;
          router.replace("/org/dashboard");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isLoading, router, accessToken]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Spinner />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <LoginFormCard />
    </div>
  );
}
