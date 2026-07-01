"use client";

import Image from "next/image";
import type { WoopMediaItem } from "@/lib/api";
import { SecondaryButton } from "@/components/ui-kit/buttons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WoopMediaPreviewDialogProps = {
  item: WoopMediaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function downloadFileName(item: WoopMediaItem): string {
  if (item.fileName?.trim()) return item.fileName.trim();
  const ext = /video/i.test(item.mediaType) ? "mp4" : "jpg";
  return `woop-${item.id}.${ext}`;
}

export function WoopMediaPreviewDialog({ item, open, onOpenChange }: WoopMediaPreviewDialogProps) {
  if (!item) return null;

  const mediaUrl = item.url ?? item.thumbnailUrl;
  const isVideo = /video/i.test(item.mediaType);
  const fileName = downloadFileName(item);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{item.fileName ?? (isVideo ? "Video" : "Image")}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1 text-left font-mono text-xs">
              <div>ID: {item.id}</div>
              {item.createdAt ? <div>{new Date(item.createdAt).toLocaleString()}</div> : null}
              <div>{item.mediaType}</div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-muted">
          {mediaUrl ? (
            isVideo ? (
              <video src={mediaUrl} controls className="max-h-[60vh] w-full bg-black" playsInline>
                <track kind="captions" />
              </video>
            ) : (
              <div className="relative aspect-[4/3] w-full min-h-[200px]">
                <Image
                  src={mediaUrl}
                  alt={item.fileName ?? item.id}
                  fill
                  className="object-contain"
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 672px"
                />
              </div>
            )
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">No preview URL available.</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {mediaUrl ? (
            <>
              <SecondaryButton type="button" size="sm" asChild>
                <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                  Open full size
                </a>
              </SecondaryButton>
              <SecondaryButton type="button" size="sm" asChild>
                <a href={mediaUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              </SecondaryButton>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
