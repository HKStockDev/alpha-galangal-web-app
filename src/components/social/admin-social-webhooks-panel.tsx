"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { createWoopWebhook, deleteWoopWebhook, listWoopWebhooks } from "@/lib/api";
import { PrimaryButton, GhostButton } from "@/components/ui-kit/buttons";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { SectionCard } from "@/components/ui-kit/cards";

export function AdminSocialWebhooksPanel() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const [endpoints, setEndpoints] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [lastSecret, setLastSecret] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const raw = await listWoopWebhooks(accessToken);
      setEndpoints(raw as Array<Record<string, unknown>>);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }, [accessToken, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const register = async () => {
    if (!accessToken || !webhookUrl.trim()) return;
    try {
      const created = (await createWoopWebhook(accessToken, {
        url: webhookUrl.trim(),
        eventTypes: [
          "socialAccountPost.delivery.published",
          "socialAccountPost.delivery.failed",
        ],
      })) as { signingSecret?: string };
      if (created.signingSecret) {
        setLastSecret(created.signingSecret);
        showSuccess("Webhook registered. Copy the signing secret now — it is shown once.");
      } else {
        showSuccess("Webhook registered.");
      }
      setWebhookUrl("");
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  const remove = async (id: string) => {
    if (!accessToken) return;
    try {
      await deleteWoopWebhook(accessToken, id);
      showSuccess("Webhook deleted.");
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading) {
    return <LoadingSkeleton variant="card" lines={4} className="mx-auto max-w-3xl py-6" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <header>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Webhooks</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Register Woop delivery webhooks. Set <code>WOOP_WEBHOOK_SIGNING_SECRET</code> on the API
          from the secret shown once at registration.
        </p>
      </header>

      <SectionCard>
        <h3 className="text-base font-semibold text-foreground">Register endpoint</h3>
        <input
          className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="https://your-api.example.com/api/integrations/woop/webhooks"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
        />
        <PrimaryButton type="button" onClick={() => void register()}>
          Register webhook
        </PrimaryButton>
        {lastSecret ? (
          <pre className="mt-3 rounded-lg bg-muted p-3 text-xs break-all">{lastSecret}</pre>
        ) : null}
      </SectionCard>

      <SectionCard>
        <h3 className="text-base font-semibold text-foreground">Registered endpoints</h3>
        {!endpoints.length ? (
          <p className="text-sm text-muted-foreground">No webhooks registered.</p>
        ) : (
          <ul className="space-y-3">
            {endpoints.map((ep) => {
              const id = String(ep.id ?? "");
              return (
                <li
                  key={id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                >
                  <span className="break-all">{String(ep.url ?? id)}</span>
                  <GhostButton type="button" size="sm" onClick={() => void remove(id)}>
                    Delete
                  </GhostButton>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
