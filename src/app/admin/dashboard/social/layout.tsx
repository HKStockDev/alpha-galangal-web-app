"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ADMIN_SOCIAL_BASE, ADMIN_SOCIAL_ACCOUNTS, ADMIN_SOCIAL_COMPOSE, ADMIN_SOCIAL_GENERATIONS, ADMIN_SOCIAL_MEDIA, ADMIN_SOCIAL_POSTS, ADMIN_SOCIAL_PROMPTS, ADMIN_SOCIAL_WEBHOOKS } from "@/lib/social-routes";
import { ScrollableTabsNav } from "@/components/ui/scrollable-tabs-nav";
import { cn } from "@/lib/utils";

const SOCIAL_TABS = [
  { href: ADMIN_SOCIAL_BASE, label: "Overview", exact: true },
  { href: ADMIN_SOCIAL_ACCOUNTS, label: "Connected accounts" },
  { href: ADMIN_SOCIAL_PROMPTS, label: "Prompt library" },
  { href: ADMIN_SOCIAL_COMPOSE, label: "Compose" },
  { href: ADMIN_SOCIAL_GENERATIONS, label: "Generations" },
  { href: ADMIN_SOCIAL_POSTS, label: "Post history" },
  { href: ADMIN_SOCIAL_MEDIA, label: "Media" },
  { href: ADMIN_SOCIAL_WEBHOOKS, label: "Webhooks" },
] as const;

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [pathname]);

  return (
    <div className="space-y-0">
      <header className="mb-4 px-4 sm:px-8 md:px-10 lg:px-12">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Social media
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect Conviction-managed social accounts, refresh OAuth tokens, and review publish
          history (platform admin).
        </p>
        <ScrollableTabsNav aria-label="Social media sections">
          {SOCIAL_TABS.map((tab) => {
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
