"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  type ConsentCategory,
  type ConsentChoices,
} from "@/lib/consent";
import { useConsent } from "./consent-provider";
import { cn } from "@/lib/utils";

export function ManageCookiesDialog() {
  const {
    state,
    isManageOpen,
    closeManageDialog,
    acceptAll,
    rejectNonEssential,
    savePartial,
    gpcActive,
  } = useConsent();

  const [draft, setDraft] = React.useState<ConsentChoices>(state.choices);

  // Reset the local draft each time the dialog opens so it reflects the latest persisted state.
  React.useEffect(() => {
    if (isManageOpen) setDraft({ ...state.choices });
  }, [isManageOpen, state.choices]);

  const toggle = (category: ConsentCategory) => (next: boolean) => {
    if (category === "necessary") return;
    setDraft((prev) => ({ ...prev, [category]: next }));
  };

  return (
    <Dialog open={isManageOpen} onOpenChange={(open) => (open ? null : closeManageDialog())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Cookie preferences
          </DialogTitle>
          <DialogDescription>
            Choose which categories of cookies and similar technologies you allow on Conviction. You
            can change these any time. See our{" "}
            <Link
              href="/privacy"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Privacy Policy
            </Link>{" "}
            for full detail.
          </DialogDescription>
        </DialogHeader>

        {gpcActive ? (
          <div className="-mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Your browser is sending a Global Privacy Control signal. We&apos;ve pre-set
            non-essential categories to off. You can override below.
          </div>
        ) : null}

        <ul className="divide-y divide-border rounded-xl border border-border">
          {ALL_CATEGORIES.map((category) => {
            const meta = CATEGORY_LABELS[category];
            const isLocked = category === "necessary";
            const checked = isLocked ? true : draft[category];
            return (
              <li
                key={category}
                className="flex items-start justify-between gap-4 p-4 first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">{meta.title}</h3>
                    {isLocked ? (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Always on
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {meta.description}
                  </p>
                </div>
                <Switch
                  checked={checked}
                  disabled={isLocked}
                  onCheckedChange={toggle(category)}
                  aria-label={`${meta.title} ${checked ? "enabled" : "disabled"}`}
                  className={cn(isLocked && "opacity-60")}
                />
              </li>
            );
          })}
        </ul>

        <DialogFooter className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 rounded-lg px-3"
              onClick={rejectNonEssential}
            >
              Reject non-essential
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-lg px-3"
              onClick={acceptAll}
            >
              Accept all
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-9 rounded-lg px-4"
            onClick={() => savePartial(draft)}
          >
            Save preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
