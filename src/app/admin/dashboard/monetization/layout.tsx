"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ADMIN_DASHBOARD } from "@/lib/auth-routing";
import { ScrollableTabsNav } from "@/components/ui/scrollable-tabs-nav";
import { cn } from "@/lib/utils";

const MONETIZATION_TABS = [
  { href: `${ADMIN_DASHBOARD}/monetization`, label: "Overview", exact: true },
  { href: `${ADMIN_DASHBOARD}/monetization/plans`, label: "Plans" },
  { href: `${ADMIN_DASHBOARD}/monetization/entitlements`, label: "Entitlements matrix" },
  { href: `${ADMIN_DASHBOARD}/monetization/organizations`, label: "Organizations" },
  { href: `${ADMIN_DASHBOARD}/monetization/stripe-events`, label: "Stripe events" },
  { href: `${ADMIN_DASHBOARD}/monetization/credit-packs`, label: "Credit packs" },
  { href: `${ADMIN_DASHBOARD}/monetization/credit-costs`, label: "Credit costs" },
  { href: `${ADMIN_DASHBOARD}/monetization/credit-policy`, label: "Credit policy" },
  { href: `${ADMIN_DASHBOARD}/monetization/credit-wallets`, label: "Wallets" },
  { href: `${ADMIN_DASHBOARD}/monetization/credit-transactions`, label: "Ledger" },
  { href: `${ADMIN_DASHBOARD}/monetization/preview`, label: "Preview" },
] as const;

export default function MonetizationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [pathname]);

  return (
    <div className="space-y-0">
      <header className="mb-4 px-4 sm:px-8 md:px-10 lg:px-12">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          AI Monetization
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stripe-mapped plans, entitlements, and billing operations (platform admin).
        </p>
        <ScrollableTabsNav aria-label="AI Monetization sections">
          {MONETIZATION_TABS.map((tab) => {
            const isActive =
              "exact" in tab && tab.exact
                ? pathname === tab.href
                : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                ref={isActive ? activeTabRef : undefined}
                href={tab.href}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </ScrollableTabsNav>
      </header>
      <div className="px-4 sm:px-8 md:px-10 lg:px-12">{children}</div>
    </div>
  );
}
