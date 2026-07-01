import type { Metadata } from "next";
import { MarketingFormulaShell } from "@/components/marketing/formula/marketing-formula-shell";
import { PublicFormulaHubView } from "@/components/marketing/formula/public-formula-views";
import { DUMMY_MARKETING_HUB } from "@/lib/public-marketing-fixtures";

export const metadata: Metadata = {
  title: "Fixture: marketing hub (demo data)",
  description: "No API — static in-repo data for layout review.",
};

export default function MarketingFormulaHubPreviewFixturePage() {
  return (
    <MarketingFormulaShell>
      <PublicFormulaHubView
        data={DUMMY_MARKETING_HUB}
        marketingSlug={DUMMY_MARKETING_HUB.marketing_slug ?? "demo-formula"}
      />
    </MarketingFormulaShell>
  );
}
