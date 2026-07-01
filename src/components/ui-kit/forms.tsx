"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DivProps = React.ComponentPropsWithoutRef<"div">;
type LabelProps = React.ComponentPropsWithoutRef<typeof Label>;
type InputProps = React.ComponentPropsWithoutRef<typeof Input>;
type HelperTextProps = React.ComponentPropsWithoutRef<"p">;

export function FormSection({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "space-y-4 rounded-2xl border border-border bg-card p-6",
        className
      )}
      {...props}
    />
  );
}

export function FormLabel({ className, ...props }: LabelProps) {
  return (
    <Label className={cn("text-sm font-medium text-foreground", className)} {...props} />
  );
}

export function FormInput({ className, ...props }: InputProps) {
  return (
    <Input
      className={cn(
        "rounded-xl border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/30",
        className
      )}
      {...props}
    />
  );
}

export function FormHelperText({ className, ...props }: HelperTextProps) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
