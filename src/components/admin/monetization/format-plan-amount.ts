import type { SubscriptionPlanAdminRow } from "@/lib/api";

export function formatPlanAmount(row: SubscriptionPlanAdminRow): string {
  const cents =
    row.pricing_model === "per_seat"
      ? row.unit_amount_cents
      : row.amount_cents ?? row.unit_amount_cents;
  if (cents == null) return "—";
  const currency = (row.currency ?? "usd").toUpperCase();
  const amount = (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const suffix = row.pricing_model === "per_seat" ? " / seat" : "";
  return `${amount} ${currency}${suffix}`;
}
