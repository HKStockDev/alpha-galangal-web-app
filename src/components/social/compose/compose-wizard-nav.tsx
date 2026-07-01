"use client";

import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";

type ComposeWizardNavProps = {
  step: number;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
};

export function ComposeWizardNav({ step, canContinue, onBack, onContinue }: ComposeWizardNavProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
      <SecondaryButton type="button" disabled={step === 0} onClick={onBack}>
        Back
      </SecondaryButton>
      {step < 2 ? (
        <PrimaryButton type="button" disabled={!canContinue} onClick={onContinue}>
          Continue
        </PrimaryButton>
      ) : null}
    </div>
  );
}
