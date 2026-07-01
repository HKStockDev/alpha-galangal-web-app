"use client";

import { useRef } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { SectionCard } from "@/components/ui-kit/cards";
import { WoopMediaGrid } from "@/components/social/woop-media-grid";
import type { WoopMediaItem } from "@/lib/api";

type ComposeMediaPickerProps = {
  items: WoopMediaItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  onRefresh: () => void;
};

export function ComposeMediaPicker({
  items,
  selectedIds,
  onToggle,
  onUpload,
  uploading,
  onRefresh,
}: ComposeMediaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <SectionCard>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Media library</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Attach generated or uploaded assets from Woop.
          </p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton type="button" onClick={onRefresh}>
            Refresh
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Upload"}
          </PrimaryButton>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onUpload(file);
          e.target.value = "";
        }}
      />
      <div className="mt-4">
        <WoopMediaGrid
          items={items}
          selectedIds={selectedIds}
          onToggle={onToggle}
          selectable
          emptyMessage="No media yet — upload an image or video to attach to your post."
        />
      </div>
      {selectedIds.length ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {selectedIds.length} item{selectedIds.length === 1 ? "" : "s"} selected
        </p>
      ) : null}
    </SectionCard>
  );
}
