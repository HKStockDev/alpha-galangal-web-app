"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type MarketingThemeToggleVariant = "icon" | "labeled";

export function MarketingThemeToggle({
  variant = "icon",
  className,
}: {
  variant?: MarketingThemeToggleVariant;
  className?: string;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const icon =
    !mounted ? (
      <Sun className="size-5 shrink-0 opacity-60" aria-hidden />
    ) : resolvedTheme === "dark" ? (
      <Moon className="size-5 shrink-0" aria-hidden />
    ) : (
      <Sun className="size-5 shrink-0" aria-hidden />
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "labeled" ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={cn(
              "h-11 w-full justify-center gap-2 border-border/60 bg-background text-foreground shadow-xs sm:w-auto sm:min-w-[11rem]",
              className
            )}
            aria-label="Choose light or dark color theme"
          >
            {icon}
            <span className="text-sm font-medium">
              {mounted && resolvedTheme === "dark" ? "Dark" : "Light"}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("text-muted-foreground", className)}
            aria-label="Color theme"
          >
            {icon}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={variant === "labeled" ? "start" : "end"}
        className="w-44 rounded-xl border-border"
      >
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
