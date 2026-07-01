import { InvestorsScoresHub } from "@/components/dashboard/investors-scores-hub";
import { ADMIN_DASHBOARD } from "@/lib/auth-routing";

export default function AdminInvestorsScoresHubPage() {
  return <InvestorsScoresHub basePath={ADMIN_DASHBOARD} />;
}
