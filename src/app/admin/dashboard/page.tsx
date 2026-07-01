"use client";

import Link from "next/link";
import { ADMIN_DASHBOARD } from "@/lib/auth-routing";
import { MonetizationQuickLinksList } from "@/components/admin/monetization/monetization-quick-links-list";
import { SectionCard } from "@/components/ui-kit/cards";
import { ChevronRight } from "lucide-react";

const QUICK_LINKS = [
  {
    href: `${ADMIN_DASHBOARD}/configuration`,
    title: "Configuration",
    description: "Files, formulas, categories, ingest filters, and exposures/tags in one place.",
  },
  {
    href: `${ADMIN_DASHBOARD}/signal-categories`,
    title: "Formula categories",
    description: "Create and edit signal categories used to group formulas.",
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Admin dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform configuration and screening tools.
          </p>
        </header>
        <SectionCard className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use the sidebar or the links below for configuration, AI monetization, and formula
            categories. Other tools are in the sidebar.
          </p>
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-foreground">AI Monetization</h2>
              <MonetizationQuickLinksList />
            </div>
            <div>
              <h2 className="mb-2 text-sm font-semibold text-foreground">Configuration</h2>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {QUICK_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                    >
                      <span>
                        <span className="block text-sm font-medium text-foreground">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
