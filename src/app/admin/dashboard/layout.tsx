"use client";

import { useAuth } from "@/context/auth-context";
import { AppShell } from "@/components/dashboard/app-shell";
import { ADMIN_DASHBOARD, ORG_DASHBOARD } from "@/lib/auth-routing";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (isLoading || !user) return;
    if (!user.is_platform_admin) {
      router.replace(ORG_DASHBOARD);
    }
  }, [isLoading, user, router]);

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

  if (!user.is_platform_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  return <AppShell basePath={ADMIN_DASHBOARD}>{children}</AppShell>;
}
