"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  completeWoopMediaUpload,
  listWoopMedia,
  startWoopMediaUpload,
  type WoopMediaItem,
} from "@/lib/api";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { SectionCard } from "@/components/ui-kit/cards";
import { WoopMediaGrid } from "@/components/social/woop-media-grid";
import { WoopMediaPreviewDialog } from "@/components/social/woop-media-preview-dialog";

const WOOP_DASHBOARD_URL = "https://app.woopsocial.com";

export function AdminSocialMediaPanel() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<WoopMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video">("all");
  const [previewItem, setPreviewItem] = useState<WoopMediaItem | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setItems(await listWoopMedia(accessToken));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [accessToken, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    if (mediaFilter === "image") {
      return items.filter((m) => !/video/i.test(m.mediaType));
    }
    if (mediaFilter === "video") {
      return items.filter((m) => /video/i.test(m.mediaType));
    }
    return items;
  }, [items, mediaFilter]);

  const uploadFile = async (file: File) => {
    if (!accessToken) return;
    setUploading(true);
    try {
      const session = (await startWoopMediaUpload(accessToken, file.size)) as {
        uploadSessionId: string;
        parts?: Array<{ partNumber: number; uploadUrl: string }>;
        partSizeInBytes?: number;
      };
      const parts = session.parts ?? [];
      for (const part of parts) {
        const start = (part.partNumber - 1) * (session.partSizeInBytes ?? file.size);
        const end = Math.min(start + (session.partSizeInBytes ?? file.size), file.size);
        const chunk = file.slice(start, end);
        await fetch(part.uploadUrl, { method: "PUT", body: chunk });
      }
      await completeWoopMediaUpload(accessToken, session.uploadSessionId);
      showSuccess("Media uploaded to Woop library.");
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton variant="card" lines={4} className="mx-auto max-w-4xl py-6" />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <header>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Media library</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All media in your Woop project library (Precision Gemini uploads, API uploads, and assets
          saved to the project media library on Woop). Click a thumbnail to preview or download.
          Post drafts that were never saved to the media library are not listed here.
        </p>
        <a
          href={WOOP_DASHBOARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-primary underline"
        >
          Open Woop dashboard
        </a>
      </header>

      <SectionCard>
        <h3 className="text-base font-semibold text-foreground">Upload</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a file directly to the Woop media library (max 100 MB single request).
        </p>
        <input
          type="file"
          className="mt-3 block text-sm"
          disabled={uploading}
          accept="image/*,video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
      </SectionCard>

      <SectionCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">Library</h3>
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border border-border bg-background px-2 py-1 text-sm"
              value={mediaFilter}
              onChange={(e) => setMediaFilter(e.target.value as "all" | "image" | "video")}
            >
              <option value="all">All</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
            <SecondaryButton type="button" size="sm" onClick={() => void load()}>
              Refresh
            </SecondaryButton>
          </div>
        </div>
        <div className="mt-4">
          <WoopMediaGrid
            items={filteredItems}
            showMeta
            previewable
            onPreview={setPreviewItem}
            emptyMessage="No media items yet. Upload here or create assets in the Woop dashboard."
          />
        </div>
        <WoopMediaPreviewDialog
          item={previewItem}
          open={previewItem !== null}
          onOpenChange={(open) => {
            if (!open) setPreviewItem(null);
          }}
        />
        <PrimaryButton type="button" className="mt-3" onClick={() => void load()}>
          Refresh library
        </PrimaryButton>
      </SectionCard>
    </div>
  );
}
