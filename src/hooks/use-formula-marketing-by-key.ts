"use client";

import { useEffect, useState } from "react";
import {
  fetchMyOrganizations,
  listOrganizationFormulaMarketing,
  type FormulaMarketingRow,
} from "@/lib/api";

export function useFormulaMarketingByKey(
  accessToken: string | null | undefined,
  formulaKey: string
): { marketing: FormulaMarketingRow | null; loading: boolean } {
  const [marketing, setMarketing] = useState<FormulaMarketingRow | null>(null);
  const [loading, setLoading] = useState(Boolean(accessToken && formulaKey));

  useEffect(() => {
    if (!accessToken || !formulaKey) {
      setMarketing(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const orgs = await fetchMyOrganizations(accessToken);
        if (cancelled) return;
        if (orgs.length === 0) {
          setMarketing(null);
          return;
        }
        const rows = await listOrganizationFormulaMarketing(accessToken, orgs[0].id);
        if (!cancelled) {
          setMarketing(rows.find((r) => r.key === formulaKey) ?? null);
        }
      } catch {
        if (!cancelled) setMarketing(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, formulaKey]);

  return { marketing, loading };
}
