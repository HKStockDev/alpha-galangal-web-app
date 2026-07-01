"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DashboardBasePath } from "@/lib/auth-routing";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RunModalProps {
  basePath: DashboardBasePath;
  isOpen: boolean;
  onClose: () => void;
}

export function RunModal({ basePath, isOpen, onClose }: RunModalProps) {
  const router = useRouter();
  const [ticker, setTicker] = useState("");

  function handleRun() {
    const trimmed = ticker.trim().toUpperCase();
    if (!trimmed) return;
    onClose();
    setTicker("");
    router.push(`${basePath}/run?ticker=${encodeURIComponent(trimmed)}`);
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Run Committee Analysis</DialogTitle>
          <DialogDescription>
            Enter a stock ticker to run through the committee formula.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-1">
          <FormLabel htmlFor="run-ticker">Ticker</FormLabel>
          <FormInput
            id="run-ticker"
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRun()}
            placeholder="e.g. AAPL, SMCI"
            autoFocus
          />
        </div>
        <DialogFooter>
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="button" onClick={handleRun} disabled={!ticker.trim()}>
            Run
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
