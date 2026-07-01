"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SharedButtonProps = React.ComponentProps<typeof Button>;

export function PrimaryButton({ className, ...props }: SharedButtonProps) {
  return (
    <Button
      className={cn(
        "rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
        className
      )}
      {...props}
    />
  );
}

export function SecondaryButton({ className, ...props }: SharedButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "rounded-xl border-input bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted",
        className
      )}
      {...props}
    />
  );
}

export function GhostButton({ className, ...props }: SharedButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}

export function DangerButton({ className, ...props }: SharedButtonProps) {
  return (
    <Button
      className={cn(
        "rounded-xl bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90",
        className
      )}
      {...props}
    />
  );
}
