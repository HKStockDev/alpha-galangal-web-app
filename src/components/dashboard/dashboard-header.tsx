"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, LogOut, Monitor, Moon, Settings, Sun, UserRound } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import type { DashboardBasePath } from "@/lib/auth-routing";
import { OrgAssistantDashboardHeader } from "@/components/org-assistant/org-assistant-dashboard-header";
import { userInitials } from "@/lib/user-initials";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader({ basePath }: { basePath: DashboardBasePath }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const isAssistantPage = pathname === `${basePath}/assistant`;

  if (!user) return null;

  const displayName =
    user.full_name?.trim() || user.email.split("@")[0] || user.email;
  const roleLabel = user.is_platform_admin
    ? "Platform admin"
    : "Organization member";
  const initials = userInitials(user.full_name, user.email);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-6">
      {isAssistantPage ? <OrgAssistantDashboardHeader /> : <div className="min-w-0 flex-1" aria-hidden="true" />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex max-w-full items-center gap-2 rounded-xl border border-transparent px-2.5 py-1.5 text-left outline-none transition-colors hover:border-border hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={`${displayName} avatar`}
                width={36}
                height={36}
                className="size-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                aria-hidden="true"
              >
                {initials}
              </span>
            )}
            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {roleLabel}
              </div>
            </div>
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl border-border">
          <DropdownMenuItem asChild className="rounded-lg">
            <Link href={`${basePath}/profile`}>
              <UserRound className="size-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-lg">
            <Link href={`${basePath}/settings`}>
              <Settings className="size-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="rounded-lg">
              <Monitor className="size-4" />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40 rounded-xl border-border">
              <DropdownMenuItem className="rounded-lg" onSelect={() => setTheme("light")}>
                <Sun className="size-4" />
                Light
                {theme === "light" ? <Check className="ml-auto size-4" /> : null}
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg" onSelect={() => setTheme("dark")}>
                <Moon className="size-4" />
                Dark
                {theme === "dark" ? <Check className="ml-auto size-4" /> : null}
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg" onSelect={() => setTheme("system")}>
                <Monitor className="size-4" />
                System
                {theme === "system" ? <Check className="ml-auto size-4" /> : null}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="rounded-lg"
            onSelect={() => logout()}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
