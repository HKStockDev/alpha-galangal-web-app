"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConsent } from "./consent-provider";
import { ManageCookiesDialog } from "./manage-cookies-dialog";
import { useIsAppHost } from "@/lib/use-is-app-host";
import { cn } from "@/lib/utils";

export function CookieBanner() {
  const { isBannerOpen, openManageDialog, acceptAll, rejectNonEssential } = useConsent();
  const isApp = useIsAppHost();

  // The cookie banner is scoped to the public marketing site. Authenticated app
  // users agreed to the Privacy Policy at signup, and the only cookies inside
  // the app are strictly necessary, so showing a banner there would be noise.
  if (isApp) return null;

  // The banner is visually hidden when no decision is pending, but the dialog
  // remains mounted so the "Manage cookies" footer link can open it any time.
  return (
    <>
      <ManageCookiesDialog />
      <div
        role="dialog"
        aria-label="Cookie preferences"
        aria-hidden={!isBannerOpen}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 sm:px-6 sm:pb-6",
          "transition-all duration-300 ease-out",
          isBannerOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-6 opacity-0"
        )}
      >
        <div
          className={cn(
            "relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border/60 bg-card text-card-foreground shadow-2xl",
            "backdrop-blur supports-[backdrop-filter]:bg-card/95"
          )}
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-5 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
              <Cookie className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-foreground sm:text-base">
                Cookies on Precision
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                We use strictly necessary cookies to run the site. With your consent we also use
                analytics and session-replay tools to understand how visitors use Precision so we
                can improve it. You can change your mind any time from the footer.{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Read our Privacy Policy
                </Link>
                .
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-9 rounded-lg px-3 text-sm text-muted-foreground hover:text-foreground"
                  onClick={openManageDialog}
                >
                  Customize
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-lg px-3 text-sm"
                  onClick={rejectNonEssential}
                >
                  Reject non-essential
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-lg px-4 text-sm"
                  onClick={acceptAll}
                >
                  Accept all
                </Button>
              </div>
            </div>
            <button
              type="button"
              aria-label="Reject non-essential cookies"
              onClick={rejectNonEssential}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:right-3 sm:top-3"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
