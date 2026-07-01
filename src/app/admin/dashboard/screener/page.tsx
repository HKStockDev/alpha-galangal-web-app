"use client";

import { useAuth } from "@/context/auth-context";
import { DataSyncPanel } from "@/components/admin/data-sync-panel";
import { ScreenerFallback } from "@/components/screener/screener-fallback";
import { SectionCard } from "@/components/ui-kit/cards";

export default function ScreenerPage() {
  const { user, accessToken } = useAuth();
  const isPlatformAdmin = Boolean(user?.is_platform_admin);

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Screener
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stock screening UI is still in progress. Platform admins can monitor
            and trigger data pipeline jobs below — last-run times come from
            Trigger.dev when background sync is enabled.
          </p>
        </header>

        {isPlatformAdmin && accessToken ? (
          <DataSyncPanel accessToken={accessToken} />
        ) : null}

        <SectionCard className="p-0">
          <ScreenerFallback
            className="p-0"
            isPlatformAdmin={isPlatformAdmin}
          />
        </SectionCard>
      </div>
    </div>
  );
}
