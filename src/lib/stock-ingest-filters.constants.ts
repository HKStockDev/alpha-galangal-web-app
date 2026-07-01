/** Mirrors API `ingest-filter.constants` for admin UI. */

export const ALLOWED_STOCK_EXCHANGES = [
  "NYSE",
  "NASDAQ",
  "AMEX",
  "OTC",
] as const;

export const ALLOWED_INGEST_SECURITY_TYPES = [
  "COMMON_STOCK",
  "ETF",
  "REIT",
  "SPAC",
  "ADR",
  "PREFERRED",
  "WARRANT",
  "UNIT",
  "CLOSED_END_FUND",
  "MUTUAL_FUND",
  "INDEX",
  "CRYPTO",
] as const;

export const ALLOWED_INGEST_COUNTRIES = [
  "USA",
  "Canada",
  "UK",
  "Germany",
  "China",
  "Japan",
  "Australia",
] as const;

export const INGEST_SECURITY_TYPE_LABELS: Record<
  (typeof ALLOWED_INGEST_SECURITY_TYPES)[number],
  string
> = {
  COMMON_STOCK: "Common stock",
  ETF: "ETF",
  REIT: "REIT",
  SPAC: "SPAC",
  ADR: "ADR",
  PREFERRED: "Preferred",
  WARRANT: "Warrant",
  UNIT: "Unit",
  CLOSED_END_FUND: "Closed-end fund",
  MUTUAL_FUND: "Mutual fund",
  INDEX: "Index",
  CRYPTO: "Crypto",
};
