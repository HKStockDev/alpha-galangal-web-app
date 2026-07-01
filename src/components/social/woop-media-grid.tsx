"use client";

import Image from "next/image";
import { Expand } from "lucide-react";
import type { WoopMediaItem } from "@/lib/api";
import { cn } from "@/lib/utils";

type WoopMediaGridProps = {
  items: WoopMediaItem[];
  selectedIds?: string[];
  onToggle?: (id: string) => void;
  selectable?: boolean;
  showMeta?: boolean;
  previewable?: boolean;
  onPreview?: (item: WoopMediaItem) => void;
  emptyMessage?: string;
};

export function WoopMediaGrid({
  items,
  selectedIds = [],
  onToggle,
  selectable = false,
  showMeta = false,
  previewable = false,
  onPreview,
  emptyMessage = "No media in library yet.",
}: WoopMediaGridProps) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const canPreview = previewable && Boolean(onPreview);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        const thumb = item.thumbnailUrl ?? item.url;
        const isVideo = /video/i.test(item.mediaType);

        const previewButton = canPreview ? (
          <button
            type="button"
            aria-label="Preview media"
            className={cn(
              "absolute right-1 top-1 z-10 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition",
              "hover:bg-black/80 group-hover:opacity-100 focus:opacity-100",
              selectable ? "opacity-100" : ""
            )}
            onClick={(e) => {
              e.stopPropagation();
              onPreview?.(item);
            }}
          >
            <Expand className="size-3.5" />
          </button>
        ) : null;

        const inner = (
          <>
            <div
              className={cn(
                "relative aspect-square bg-muted",
                canPreview && !selectable && "cursor-zoom-in"
              )}
            >
              {thumb ? (
                <Image
                  src={thumb}
                  alt={item.fileName ?? item.id}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {isVideo ? "Video" : "Media"}
                </div>
              )}
              {isVideo ? (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  VIDEO
                </span>
              ) : null}
              {selected ? (
                <span className="absolute left-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Selected
                </span>
              ) : null}
              {previewButton}
            </div>
            <div className="px-2 py-1.5">
              <div className="truncate text-xs text-muted-foreground">
                {item.fileName ?? item.mediaType}
              </div>
              {showMeta ? (
                <div className="mt-0.5 space-y-0.5 font-mono text-[10px] text-muted-foreground/80">
                  <div className="truncate" title={item.id}>
                    ID: {item.id}
                  </div>
                  {item.createdAt ? (
                    <div>{new Date(item.createdAt).toLocaleString()}</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </>
        );

        if (selectable) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle?.(item.id)}
              className={cn(
                "group relative overflow-hidden rounded-xl border text-left transition",
                "cursor-pointer hover:border-primary/50",
                selected ? "border-primary ring-2 ring-primary/30" : "border-border"
              )}
            >
              {inner}
            </button>
          );
        }

        if (canPreview) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPreview?.(item)}
              className={cn(
                "group relative overflow-hidden rounded-xl border border-border text-left transition",
                "cursor-pointer hover:border-primary/50 hover:ring-2 hover:ring-primary/20"
              )}
            >
              {inner}
            </button>
          );
        }

        return (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-xl border border-border text-left"
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
}
