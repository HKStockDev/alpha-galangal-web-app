"use client";

import * as React from "react";
import { useConsent } from "./consent-provider";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ManageCookiesLink({ className, children, ...props }: Props) {
  const { openManageDialog } = useConsent();
  return (
    <button
      type="button"
      onClick={openManageDialog}
      className={cn(
        "text-sm text-muted-foreground transition-colors hover:text-foreground",
        className
      )}
      {...props}
    >
      {children ?? "Manage cookies"}
    </button>
  );
}
