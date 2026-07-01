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

interface ConfirmSaveModalProps {
  isOpen: boolean;
  isSaving?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSaveModal({
  isOpen,
  isSaving = false,
  onConfirm,
  onCancel,
}: ConfirmSaveModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Save formula changes?</DialogTitle>
          <DialogDescription>
            This will affect the hedge fund scores throughout the entire system. Existing scores
            will be recalculated based on the new weights.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <SecondaryButton type="button" onClick={onCancel} disabled={isSaving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onConfirm} disabled={isSaving}>
            {isSaving ? "Saving…" : "Confirm"}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
