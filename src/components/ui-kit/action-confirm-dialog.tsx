"use client";

import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export type ActionConfirmRequest = {
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

type ActionConfirmDialogProps = {
  request: ActionConfirmRequest | null;
  isConfirming?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

export function ActionConfirmDialog({
  request,
  isConfirming = false,
  onOpenChange,
  onConfirm,
}: ActionConfirmDialogProps) {
  return (
    <AlertDialog
      open={request != null}
      onOpenChange={(open) => {
        if (!open && !isConfirming) onOpenChange(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{request?.title}</AlertDialogTitle>
          <AlertDialogDescription>{request?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>
            {request?.cancelLabel ?? "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isConfirming}
            className={cn(request?.destructive && "bg-destructive hover:bg-destructive/90")}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
          >
            {isConfirming ? "Working…" : (request?.confirmLabel ?? "OK")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
