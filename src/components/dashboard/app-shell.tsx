"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { DashboardBasePath } from "@/lib/auth-routing";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { cn } from "@/lib/utils";

export function AppShell({
  basePath,
  children,
}: {
  basePath: DashboardBasePath;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isAssistantPage = pathname === `${basePath}/assistant`;

  useEffect(() => {
    if (isAssistantPage) {
      setSidebarCollapsed(true);
    }
  }, [isAssistantPage]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        basePath={basePath}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DashboardHeader basePath={basePath} />
        <main className={cn("min-h-0 flex-1", isAssistantPage ? "overflow-hidden" : "overflow-auto")}>
          <div
            className={cn(
              "w-full",
              isAssistantPage ? "h-full p-0" : "px-6 py-6",
              sidebarCollapsed ? "max-w-none" : "mx-auto max-w-7xl"
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
