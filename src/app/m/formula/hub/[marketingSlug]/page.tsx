import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingFormulaShell } from "@/components/marketing/formula/marketing-formula-shell";
import { PublicFormulaHubView } from "@/components/marketing/formula/public-formula-views";
import { fetchPublicMarketingHub } from "@/lib/public-marketing-api";

type Props = { params: Promise<{ marketingSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { marketingSlug } = await params;
  try {
    const data = await fetchPublicMarketingHub(marketingSlug);
    if (!data) return { title: "Model not found" };
    return {
      title: data.name,
      description: data.description ?? undefined,
    };
  } catch {
    return { title: "Model" };
  }
}

export default async function MarketingFormulaHubTestPage({ params }: Props) {
  const { marketingSlug } = await params;
  let data;
  try {
    data = await fetchPublicMarketingHub(marketingSlug);
  } catch (e) {
    return (
      <MarketingFormulaShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-xl font-semibold">Could not load this page</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {e instanceof Error ? e.message : "Unknown error"}
          </p>
        </div>
      </MarketingFormulaShell>
    );
  }
  if (!data) notFound();
  return (
    <MarketingFormulaShell>
      <PublicFormulaHubView data={data} marketingSlug={marketingSlug} />
    </MarketingFormulaShell>
  );
}
