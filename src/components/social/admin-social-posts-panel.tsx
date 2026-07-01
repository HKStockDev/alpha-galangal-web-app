"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { listSocialPosts, socialPlatformLabel, type SocialPostRow } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { formatSocialAbsolute } from "@/components/social/social-platform-ui";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "published") return "default";
  if (status === "failed") return "destructive";
  if (status === "draft") return "secondary";
  if (status === "scheduled") return "outline";
  return "outline";
}

export function AdminSocialPostsPanel() {
  const { accessToken } = useAuth();
  const { showError } = useToast();
  const [rows, setRows] = useState<SocialPostRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setRows(await listSocialPosts(accessToken));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load social posts");
    } finally {
      setLoading(false);
    }
  }, [accessToken, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingSkeleton variant="card" lines={5} className="mx-auto max-w-6xl py-6" />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <header>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Post history</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent publishes from connected OAuth accounts.
        </p>
      </header>

      {!rows.length ? (
        <EmptyState
          title="No posts yet"
          description="Publish from an admin stock page using Publish to connected account."
        />
      ) : (
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Caption</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const platform =
                row.social_accounts?.platform ??
                (typeof row.social_accounts === "object" && row.social_accounts
                  ? (row.social_accounts as { platform?: string }).platform
                  : undefined);
              return (
                <TableRow key={row.id}>
                  <TableCell>{platform ? socialPlatformLabel(platform) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(row.status)} className="capitalize">
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate text-sm">{row.caption ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {row.status === "scheduled" && row.publish_at
                      ? `Scheduled ${formatSocialAbsolute(row.publish_at)}`
                      : formatSocialAbsolute(row.published_at ?? row.created_at)}
                  </TableCell>
                  <TableCell>
                    {row.external_post_url ? (
                      <a
                        href={row.external_post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline"
                      >
                        View
                      </a>
                    ) : row.last_error_message ? (
                      <span className="line-clamp-2 text-xs text-destructive">
                        {row.last_error_message}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </DataTable>
      )}
    </div>
  );
}
