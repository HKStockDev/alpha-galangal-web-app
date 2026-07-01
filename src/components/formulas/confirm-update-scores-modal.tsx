"use client";

import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmUpdateScoresModalProps {
  isOpen: boolean;
  isCalculating?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Defaults to hedge-fund copy when omitted */
  title?: string;
  description?: string;
}

export function ConfirmUpdateScoresModal({
  isOpen,
  isCalculating = false,
  onConfirm,
  onCancel,
  title = "Recalculate hedge fund quality scores?",
  description = "This will recalculate quality scores for all hedge funds using the updated formula weights. The process may take a few moments.",
}: ConfirmUpdateScoresModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <SecondaryButton type="button" onClick={onCancel} disabled={isCalculating}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onConfirm} disabled={isCalculating}>
            {isCalculating ? "Calculating…" : "Confirm"}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
