import type { EntitlementCell } from "@/lib/api";

export function cellsDiffer(a: EntitlementCell, b: EntitlementCell): boolean {
  return (
    a.is_enabled !== b.is_enabled ||
    a.hard_block !== b.hard_block ||
    a.quota_period !== b.quota_period ||
    a.quota_limit !== b.quota_limit ||
    (a.upsell_message ?? "") !== (b.upsell_message ?? "")
  );
}
