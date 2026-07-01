"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_SOCIAL_ACCOUNTS, ADMIN_SOCIAL_POSTS } from "@/lib/social-routes";
import FilesPage from "../files/page";
import FormulasPage from "../formulas/page";
import AdminIngestFiltersPage from "../ingest-filters/page";
import ExposuresTagsAdminPage from "../exposures-tags/page";
import AdminSignalCategoriesPage from "../signal-categories/page";
import { AiAssistantConfigurationPanel } from "@/components/admin/ai-assistant-configuration-panel";

type ConfigTabId =
  | "files"
  | "formulas"
  | "signal-categories"
  | "ingest-filters"
  | "exposures-tags"
  | "ai-assistant";

const CONFIG_TABS: { id: ConfigTabId; label: string }[] = [
  { id: "formulas", label: "Formulas" },
  { id: "ai-assistant", label: "AI assistant (prompts & governance)" },
  { id: "signal-categories", label: "Formula categories" },
  { id: "ingest-filters", label: "Ingest filters" },
  { id: "exposures-tags", label: "Exposures & tags" },
  { id: "files", label: "Files" },
];

const DEFAULT_TAB: ConfigTabId = "formulas";
const TAB_IDS = new Set<ConfigTabId>(CONFIG_TABS.map((t) => t.id));

function isConfigTabId(value: string | null): value is ConfigTabId {
  return value != null && TAB_IDS.has(value as ConfigTabId);
}

export default function AdminConfigurationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (() => {
    const fromQs = searchParams.get("tab");
    return isConfigTabId(fromQs) ? fromQs : DEFAULT_TAB;
  })();
  const [tab, setTab] = useState<ConfigTabId>(initialTab);

  // Legacy social tabs moved to /admin/dashboard/social/*
  useEffect(() => {
    const fromQs = searchParams.get("tab");
    if (fromQs === "social-accounts") {
      const qs = new URLSearchParams(searchParams.toString());
      qs.delete("tab");
      const suffix = qs.toString();
      router.replace(suffix ? `${ADMIN_SOCIAL_ACCOUNTS}?${suffix}` : ADMIN_SOCIAL_ACCOUNTS);
      return;
    }
    if (fromQs === "social-posts") {
      router.replace(ADMIN_SOCIAL_POSTS);
    }
  }, [searchParams, router]);

  useEffect(() => {
    const fromQs = searchParams.get("tab");
    if (isConfigTabId(fromQs) && fromQs !== tab) {
      setTab(fromQs);
    }
  }, [searchParams, tab]);

  const handleSelectTab = (next: ConfigTabId) => {
    setTab(next);
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("tab", next);
    router.replace(`?${qs.toString()}`, { scroll: false });
  };

  const panel = useMemo(() => {
    if (tab === "files") return <FilesPage />;
    if (tab === "formulas") return <FormulasPage />;
    if (tab === "ai-assistant") return <AiAssistantConfigurationPanel />;
    if (tab === "signal-categories") return <AdminSignalCategoriesPage />;
    if (tab === "ingest-filters") return <AdminIngestFiltersPage />;
    return <ExposuresTagsAdminPage />;
  }, [tab]);

  return (
    <div className="space-y-0">
      <header className="mb-4 px-4 sm:px-8 md:px-10 lg:px-12">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Configuration
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage admin files, formulas, AI assistant prompts, formula/factor governance (origin,
          visibility, lock), categories, ingest rules, and exposures/tags.
        </p>
      </header>
      <div className="flex w-full min-w-0 flex-wrap gap-0 border-b border-border px-4 sm:px-8 md:px-10 lg:px-12">
        {CONFIG_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => handleSelectTab(item.id)}
            className={cn(
              "relative -mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === item.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-4">
        {panel}
      </div>
    </div>
  );
}
