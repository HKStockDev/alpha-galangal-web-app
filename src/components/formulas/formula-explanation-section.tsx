"use client";

import { useAuth } from "@/context/auth-context";
import { useFormulaMarketingByKey } from "@/hooks/use-formula-marketing-by-key";
import { FormulaExplanationPanel } from "./formula-explanation-panel";

export function FormulaExplanationSection({
  formulaKey,
  compact,
}: {
  formulaKey: string;
  compact?: boolean;
}) {
  const { accessToken } = useAuth();
  const { marketing, loading } = useFormulaMarketingByKey(accessToken, formulaKey);
  return (
    <FormulaExplanationPanel
      formulaKey={formulaKey}
      marketing={marketing}
      loading={loading}
      compact={compact}
    />
  );
}
