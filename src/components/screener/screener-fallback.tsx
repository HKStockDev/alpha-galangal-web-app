"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SecondaryButton } from "@/components/ui-kit/buttons";
import { ADMIN_DASHBOARD } from "@/lib/auth-routing";
import { cn } from "@/lib/utils";

export function ScreenerFallback({
  isPlatformAdmin,
  className,
}: {
  isPlatformAdmin: boolean;
  /** Override outer padding when the page already provides layout (e.g. admin screener). */
  className?: string;
}) {
  return (
    <div className={cn("p-8", className)}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Screener</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filtered security lists and screen results are not available in the app yet. This page
            is a fallback until that feature ships.
          </p>
        </div>

        <Card className="border-dashed bg-muted/20">
          <CardHeader>
            <CardTitle className="text-base">What you can do instead</CardTitle>
            <CardDescription>
              Global ingest filters decide which symbols are allowed when syncing from market data;
              they do not produce a browseable “filtered universe” screen here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ul className="list-inside list-disc space-y-2">
              <li>
                <span className="font-medium text-foreground">Platform admins</span> can open{" "}
                {isPlatformAdmin ? (
                  <Link
                    href={`${ADMIN_DASHBOARD}/ingest-filters`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Ingest filters
                  </Link>
                ) : (
                  <span className="text-foreground">Ingest filters (platform admin only)</span>
                )}{" "}
                to view the effective rules summary and edit gates.
              </li>
              <li>
                Use <span className="font-medium text-foreground">Run</span> in the sidebar to
                analyze a single ticker with the committee model.
              </li>
              <li>
                Use <span className="font-medium text-foreground">Funds</span> to browse imported
                hedge fund performance data.
              </li>
            </ul>
            {isPlatformAdmin && (
              <SecondaryButton asChild className="mt-2">
                <Link href={`${ADMIN_DASHBOARD}/ingest-filters`}>Open ingest rules summary</Link>
              </SecondaryButton>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
