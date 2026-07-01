import { INGEST_SECURITY_TYPE_LABELS } from "@/lib/stock-ingest-filters.constants";

export type IngestRulesSource = {
  exchanges: string[];
  security_types: string[];
  countries: string[];
  min_market_cap_millions: number | null;
  min_avg_share_volume_thousands: number | null;
  min_price_usd: number | null;
  min_avg_dollar_volume_millions: number | null;
};

export function isIngestRulesWideOpen(d: IngestRulesSource): boolean {
  return (
    d.exchanges.length === 0 &&
    d.security_types.length === 0 &&
    d.countries.length === 0 &&
    d.min_market_cap_millions == null &&
    d.min_avg_share_volume_thousands == null &&
    d.min_price_usd == null &&
    d.min_avg_dollar_volume_millions == null
  );
}

/** Human-readable lines for the active draft or saved config (not a ticker list). */
export function describeIngestRules(d: IngestRulesSource): string[] {
  const lines: string[] = [];

  lines.push(
    d.exchanges.length === 0
      ? "Exchanges: no restriction — any exchange can pass this gate."
      : `Exchanges: only ${d.exchanges.slice().sort().join(", ")}.`
  );

  const typeLabels = d.security_types
    .slice()
    .sort()
    .map((t) => INGEST_SECURITY_TYPE_LABELS[t as keyof typeof INGEST_SECURITY_TYPE_LABELS] ?? t);
  lines.push(
    d.security_types.length === 0
      ? "Security types: no restriction — types allowed by the ingest mapper can pass."
      : `Security types: only ${typeLabels.join(", ")}.`
  );

  lines.push(
    d.countries.length === 0
      ? "Countries: no restriction — headquarters country is not filtered here."
      : `Countries: only ${d.countries.slice().sort().join(", ")}.`
  );

  lines.push(
    d.min_market_cap_millions == null
      ? "Market cap: no minimum."
      : `Market cap: at least $${formatNum(d.min_market_cap_millions)}M (USD).`
  );

  lines.push(
    d.min_avg_share_volume_thousands == null
      ? "Average share volume: no minimum."
      : `Average daily volume: at least ${formatNum(d.min_avg_share_volume_thousands)}K shares.`
  );

  lines.push(
    d.min_price_usd == null
      ? "Price: no minimum."
      : `Price: at least $${formatNum(d.min_price_usd)} (USD).`
  );

  lines.push(
    d.min_avg_dollar_volume_millions == null
      ? "Average dollar volume: no minimum."
      : `Average dollar volume: at least $${formatNum(d.min_avg_dollar_volume_millions)}M (USD).`
  );

  return lines;
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
