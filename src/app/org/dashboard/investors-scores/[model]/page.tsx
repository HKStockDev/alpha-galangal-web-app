import { notFound } from "next/navigation";
import { isInvestorScoreSlug } from "@/lib/investor-score-models";
import { InvestorScoreModelPage } from "@/components/dashboard/investor-score-model-page";
import { ORG_DASHBOARD } from "@/lib/auth-routing";

type Props = { params: Promise<{ model: string }> };

export default async function OrganizationInvestorScoreModelPage({ params }: Props) {
  const { model: slug } = await params;
  if (!isInvestorScoreSlug(slug)) {
    notFound();
  }
  return <InvestorScoreModelPage model={slug} basePath={ORG_DASHBOARD} />;
}
