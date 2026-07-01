"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { ADMIN_DASHBOARD } from "@/lib/auth-routing";
import { cn } from "@/lib/utils";
import {
  FormulaPageMarketingTabContext,
  type FormulaPageLevelMarketingTab,
} from "@/components/dashboard/formula-page-marketing-tab-context";

type PageTab = "results" | FormulaPageLevelMarketingTab;

const MARKETING_TABS: { id: FormulaPageLevelMarketingTab; label: string }[] = [
  { id: "releases", label: "Releases" },
  { id: "seo", label: "SEO" },
  { id: "settings", label: "Settings" },
];

/**
 * On `/admin/dashboard/*`, shows **Results** plus **Releases** / **SEO** / **Settings** (marketing)
 * at the same level. On other paths (e.g. org), renders `results` only.
 */
export function FormulaPageResultsSettingsTabs({
  results,
  settings,
}: {
  results: ReactNode;
  /** Marketing / admin — often {@link AdminFormulaMarketingSection} */
  settings: ReactNode;
}) {
  const pathname = usePathname();
  const isAdminDash = pathname?.startsWith(ADMIN_DASHBOARD) ?? false;
  const [tab, setTab] = useState<PageTab>("results");

  if (!isAdminDash) {
    return <>{results}</>;
  }

  return (
    <div className="space-y-0">
      <div className="flex w-full min-w-0 flex-wrap gap-0 border-b border-border" role="tablist" aria-label="Formula">
        <button
          type="button"
          role="tab"
          id="tab-results"
          aria-selected={tab === "results"}
          aria-controls="panel-results"
          onClick={() => setTab("results")}
          className={cn(
            "relative -mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            tab === "results"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Results
        </button>
        {MARKETING_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-marketing-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative -mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        id="panel-results"
        role="tabpanel"
        aria-labelledby="tab-results"
        className={cn("pt-6", tab !== "results" && "hidden")}
      >
        {results}
      </div>
      {tab !== "results" && (
        <div
          id="panel-marketing"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          className="pt-6"
        >
          <FormulaPageMarketingTabContext.Provider value={tab}>
            {settings}
          </FormulaPageMarketingTabContext.Provider>
        </div>
      )}
    </div>
  );
}
