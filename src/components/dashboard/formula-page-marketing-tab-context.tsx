"use client";

import { createContext, useContext } from "react";

export type FormulaPageLevelMarketingTab = "releases" | "seo" | "settings";

/**
 * When set (admin formula pages using {@link FormulaPageResultsSettingsTabs}), the
 * page controls Releases / SEO / Settings at the top level; {@link FormulaMarketingForm}
 * hides its nested tab list and shows the panel matching this value.
 */
export const FormulaPageMarketingTabContext = createContext<FormulaPageLevelMarketingTab | null>(
  null
);

export function useFormulaPageMarketingTab(): FormulaPageLevelMarketingTab | null {
  return useContext(FormulaPageMarketingTabContext);
}
