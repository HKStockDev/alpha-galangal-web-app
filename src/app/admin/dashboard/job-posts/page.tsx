"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  listAdminJobPosts,
  syncIndeedCompanyJobPosts,
  type AdminJobPostRow,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type BoolFilter = "any" | "true" | "false";

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function AdminJobPostsPage() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();

  const [syncCompanyName, setSyncCompanyName] = useState("");
  const [syncLocation, setSyncLocation] = useState("United States");
  const [syncCountry, setSyncCountry] = useState("US");
  const [syncMaxItems, setSyncMaxItems] = useState("100");
  const [syncing, setSyncing] = useState(false);

  const [q, setQ] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState<BoolFilter>("any");
  const [isExpired, setIsExpired] = useState<BoolFilter>("any");
  const [limit, setLimit] = useState("50");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminJobPostRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const remoteValue = useMemo(
    () => (isRemote === "any" ? undefined : isRemote === "true"),
    [isRemote]
  );
  const expiredValue = useMemo(
    () => (isExpired === "any" ? undefined : isExpired === "true"),
    [isExpired]
  );

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const parsedLimit = Math.max(1, Math.min(200, Number(limit) || 50));
      const res = await listAdminJobPosts(accessToken, {
        q,
        companyName,
        location,
        isRemote: remoteValue,
        isExpired: expiredValue,
        limit: parsedLimit,
        offset: 0,
        sortBy: "posted_at",
        sortOrder: "desc",
      });
      setRows(res.items);
      setTotalCount(res.total_count);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load job posts");
    } finally {
      setLoading(false);
    }
  }, [accessToken, companyName, expiredValue, limit, location, q, remoteValue, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSync(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    const company = syncCompanyName.trim();
    if (!company) {
      showError("Company name is required.");
      return;
    }
    const maxItems = Math.max(1, Math.min(1000, Number(syncMaxItems) || 100));

    setSyncing(true);
    try {
      const res = await syncIndeedCompanyJobPosts(accessToken, {
        companyName: company,
        location: syncLocation.trim() || undefined,
        country: syncCountry.trim() || undefined,
        maxItems,
        sort: "date",
      });
      showSuccess(
        `Fetched ${res.total} post(s). Persisted ${res.persisted}, skipped without source id ${res.skippedWithoutSourceId}.`
      );
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Job-post sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job posts</CardTitle>
            <CardDescription>
              job post ingestion via Apify Indeed actor, with persisted rows for filtering.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSync} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder="Company name (e.g. Google)"
                value={syncCompanyName}
                onChange={(e) => setSyncCompanyName(e.target.value)}
              />
              <Input
                placeholder="Location"
                value={syncLocation}
                onChange={(e) => setSyncLocation(e.target.value)}
              />
              <Input
                placeholder="Country (US)"
                value={syncCountry}
                onChange={(e) => setSyncCountry(e.target.value)}
              />
              <Input
                type="number"
                min={1}
                max={1000}
                value={syncMaxItems}
                onChange={(e) => setSyncMaxItems(e.target.value)}
              />
              <Button type="submit" disabled={syncing}>
                {syncing ? "Syncing..." : "Sync company jobs"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <Input placeholder="Search title/company" value={q} onChange={(e) => setQ(e.target.value)} />
              <Input
                placeholder="Company filter"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Input
                placeholder="Location filter"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={isRemote}
                onChange={(e) => setIsRemote(e.target.value as BoolFilter)}
              >
                <option value="any">Remote: any</option>
                <option value="true">Remote: true</option>
                <option value="false">Remote: false</option>
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={isExpired}
                onChange={(e) => setIsExpired(e.target.value as BoolFilter)}
              >
                <option value="any">Expired: any</option>
                <option value="true">Expired: true</option>
                <option value="false">Expired: false</option>
              </select>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
                  Apply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results ({totalCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Loading job posts...
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No job posts found for the current filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="px-2 py-2">Company</th>
                      <th className="px-2 py-2">Title</th>
                      <th className="px-2 py-2">Location</th>
                      <th className="px-2 py-2">Posted</th>
                      <th className="px-2 py-2">Remote</th>
                      <th className="px-2 py-2">Expired</th>
                      <th className="px-2 py-2">Links</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b align-top">
                        <td className="px-2 py-2">{row.company_name}</td>
                        <td className="px-2 py-2">{row.title ?? "—"}</td>
                        <td className="px-2 py-2">{row.location_text ?? "—"}</td>
                        <td className="px-2 py-2">{formatDateTime(row.posted_at)}</td>
                        <td className="px-2 py-2">{row.is_remote == null ? "—" : row.is_remote ? "Yes" : "No"}</td>
                        <td className="px-2 py-2">{row.is_expired == null ? "—" : row.is_expired ? "Yes" : "No"}</td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-1">
                            {row.indeed_url ? (
                              <a
                                className="text-primary underline underline-offset-2"
                                href={row.indeed_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Indeed
                              </a>
                            ) : null}
                            {row.external_url ? (
                              <a
                                className="text-primary underline underline-offset-2"
                                href={row.external_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                External
                              </a>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
