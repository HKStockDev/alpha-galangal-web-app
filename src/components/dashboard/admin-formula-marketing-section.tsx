"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ADMIN_DASHBOARD } from "@/lib/auth-routing";
import { FormulaMarketingForm } from "./formula-marketing-form";

type Props = {
  formulaKey: string;
  contextLabel: string;
};

/**
 * Renders {@link FormulaMarketingForm} only under `/admin/dashboard` (shared org+admin pages
 * re-export the same module; this avoids showing the block on org routes).
 */
export function AdminFormulaMarketingSection({ formulaKey, contextLabel }: Props) {
  const pathname = usePathname();
  const { accessToken } = useAuth();
  if (!pathname?.startsWith(ADMIN_DASHBOARD)) {
    return null;
  }
  return (
    <FormulaMarketingForm
      accessToken={accessToken}
      formulaKey={formulaKey}
      contextLabel={contextLabel}
      showReleaseSeo
    />
  );
}
