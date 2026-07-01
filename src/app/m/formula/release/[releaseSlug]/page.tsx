import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingFormulaShell } from "@/components/marketing/formula/marketing-formula-shell";
import { PublicFormulaReleaseView } from "@/components/marketing/formula/public-formula-views";
import { fetchPublicMarketingRelease } from "@/lib/public-marketing-api";

type Props = { params: Promise<{ releaseSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { releaseSlug } = await params;
  try {
    const data = await fetchPublicMarketingRelease(releaseSlug);
    if (!data) return { title: "Release not found" };
    return {
      title: data.title,
      description: data.subtitle ?? data.body?.slice(0, 160) ?? undefined,
    };
  } catch {
    return { title: "Release" };
  }
}

export default async function MarketingFormulaReleaseTestPage({ params }: Props) {
  const { releaseSlug } = await params;
  let data;
  try {
    data = await fetchPublicMarketingRelease(releaseSlug);
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
      <PublicFormulaReleaseView data={data} />
    </MarketingFormulaShell>
  );
}
