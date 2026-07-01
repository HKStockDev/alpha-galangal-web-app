"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { WoopMediaGrid } from "../woop-media-grid";
import { WoopMediaPreviewDialog } from "../woop-media-preview-dialog";
import type { WoopMediaItem } from "@/lib/api";
import { useState } from "react";

type GenerationLinkMediaDialogProps = {
  open: boolean;
  items: WoopMediaItem[];
  selectedMediaId: string;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onRefresh: () => void;
};

export function GenerationLinkMediaDialog({
  open,
  items,
  selectedMediaId,
  loading = false,
  onOpenChange,
  onSelect,
  onConfirm,
  onRefresh,
}: GenerationLinkMediaDialogProps) {
  const [previewItem, setPreviewItem] = useState<WoopMediaItem | null>(null);
  const imageItems = items.filter((m) => !/video/i.test(m.mediaType));

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setPreviewItem(null);
          onOpenChange(next);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Link Woop media</DialogTitle>
            <DialogDescription>
              Choose an image from your Woop project library. Use preview to inspect before linking.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {imageItems.length} image{imageItems.length === 1 ? "" : "s"} available
            </p>
            <SecondaryButton type="button" size="sm" onClick={onRefresh} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh library"}
            </SecondaryButton>
          </div>

          <WoopMediaGrid
            items={imageItems}
            selectedIds={selectedMediaId ? [selectedMediaId] : []}
            onToggle={(id) => onSelect(selectedMediaId === id ? "" : id)}
            selectable
            previewable
            onPreview={setPreviewItem}
            showMeta
            emptyMessage="No images in Woop library. Create one on the Woop dashboard or via Gemini in Compose, then refresh."
          />

          <DialogFooter>
            <SecondaryButton type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="button" disabled={!selectedMediaId} onClick={onConfirm}>
              Link selected image
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WoopMediaPreviewDialog
        item={previewItem}
        open={previewItem !== null}
        onOpenChange={(next) => {
          if (!next) setPreviewItem(null);
        }}
      />
    </>
  );
}
