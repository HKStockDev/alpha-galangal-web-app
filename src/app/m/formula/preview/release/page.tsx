import type { Metadata } from "next";
import { MarketingFormulaShell } from "@/components/marketing/formula/marketing-formula-shell";
import { PublicFormulaReleaseView } from "@/components/marketing/formula/public-formula-views";
import { DUMMY_MARKETING_RELEASE } from "@/lib/public-marketing-fixtures";

export const metadata: Metadata = {
  title: "Fixture: marketing release (demo data)",
  description: "No API — static in-repo data for layout review.",
};

export default function MarketingFormulaReleasePreviewFixturePage() {
  return (
    <MarketingFormulaShell>
      <PublicFormulaReleaseView data={DUMMY_MARKETING_RELEASE} />
    </MarketingFormulaShell>
  );
}
