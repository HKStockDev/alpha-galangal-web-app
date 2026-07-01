import { InvestorsScoresHub } from "@/components/dashboard/investors-scores-hub";
import { ORG_DASHBOARD } from "@/lib/auth-routing";

export default function OrganizationInvestorsScoresHubPage() {
  return <InvestorsScoresHub basePath={ORG_DASHBOARD} />;
}
