"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  fetchMyOrganizations,
  listOrganizationEquities,
  type MyOrganization,
  type OrgEquityRow,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const LIMIT = 100;

function formatMetric(v: number | null | undefined, digits = 4): string {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return Number(v).toFixed(digits);
}

export function OrgJobsFormulaValues() {
  const { accessToken } = useAuth();
  const { showError } = useToast();
  const [orgs, setOrgs] = useState<MyOrganization[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [rows, setRows] = useState<OrgEquityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!accessToken) return;
    setOrgLoading(true);
    fetchMyOrganizations(accessToken)
      .then((data) => {
        setOrgs(data);
        setOrganizationId(data[0]?.id ?? null);
      })
      .catch((e) => showError(e instanceof Error ? e.message : "Failed to load organizations"))
      .finally(() => setOrgLoading(false));
  }, [accessToken, showError]);

  useEffect(() => {
    if (!accessToken || !organizationId) return;
    setLoading(true);
    listOrganizationEquities(accessToken, organizationId, {
      q: debouncedQ || undefined,
      limit: LIMIT,
      offset: 0,
      cycle_horizon: "24m",
    })
      .then((res) => setRows(res.items))
      .catch((e) => showError(e instanceof Error ? e.message : "Failed to load values"))
      .finally(() => setLoading(false));
  }, [accessToken, organizationId, debouncedQ, showError]);

  if (orgLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!organizationId) {
    return <p className="text-sm text-muted-foreground">No organization linked to this account.</p>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Jobs formula values</h1>
        <p className="text-sm text-muted-foreground">
          view for jobs-derived factors from entity-level snapshots.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search by ticker or company name. Showing first {LIMIT} matches.</CardDescription>
        </CardHeader>
        <CardContent className="border-t border-border/80 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-select-jobs">Organization</Label>
              <select
                id="org-select-jobs"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobs-score-q">Search</Label>
              <Input
                id="jobs-score-q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="AAPL or Apple"
                autoComplete="off"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-md border border-border">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Jobs / 100 employees</TableHead>
                <TableHead className="text-right">Jobs Growth 30d</TableHead>
                <TableHead className="text-right">Jobs Growth 90d</TableHead>
                <TableHead className="text-right">Workforce Growth 90d</TableHead>
                <TableHead className="text-right">Hiring Spike</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    No rows found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-medium">{r.ticker}</TableCell>
                    <TableCell className="max-w-[260px] truncate">{r.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatMetric(r.jobs_per_100_employees)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatMetric(r.jobs_growth_rate_30d)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatMetric(r.jobs_growth_rate_90d)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatMetric(r.workforce_growth_rate_90d)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatMetric(r.hiring_spike_indicator)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

