"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useToast } from "@/context/toast-context";
import {
  deleteAdminFormulaMarketingSeoOgImage,
  getAdminFormulaMarketing,
  patchAdminFormulaMarketing,
  uploadAdminFormulaMarketingSeoOgImage,
  type FormulaMarketingRow,
} from "@/lib/api";
import { absolutePublicMarketingUrl } from "@/lib/public-marketing-base-url";
import { marketingHubPath } from "@/components/marketing/formula/routes";
import { FormHelperText, FormInput, FormLabel, FormSection } from "@/components/ui-kit/forms";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { cn } from "@/lib/utils";

const MAX_SEO_OG_BYTES = 8 * 1024 * 1024;

type Props = {
  accessToken: string;
  row: FormulaMarketingRow;
  onRowUpdated: (r: FormulaMarketingRow) => void;
};

export function FormulaMarketingHubSeo({ accessToken, row, onRowUpdated }: Props) {
  const { showError, showSuccess } = useToast();
  const id = useId();
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const ogFileRef = useRef<HTMLInputElement>(null);
  const [ogPreviewUrl, setOgPreviewUrl] = useState<string | null>(null);
  const [ogSelectedFile, setOgSelectedFile] = useState<File | null>(null);
  const [ogAction, setOgAction] = useState<"idle" | "upload" | "delete">("idle");

  const clearOgPick = useCallback(() => {
    if (ogPreviewUrl) {
      URL.revokeObjectURL(ogPreviewUrl);
    }
    setOgPreviewUrl(null);
    setOgSelectedFile(null);
    if (ogFileRef.current) {
      ogFileRef.current.value = "";
    }
  }, [ogPreviewUrl]);

  useEffect(() => {
    setSeoTitle(row.seo_title ?? "");
    setSeoDescription(row.seo_description ?? "");
  }, [row.id, row.seo_title, row.seo_description]);

  const onSave = async () => {
    setSaving(true);
    try {
      const updated = await patchAdminFormulaMarketing(accessToken, row.id, {
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
      });
      onRowUpdated(updated);
      setSeoTitle(updated.seo_title ?? "");
      setSeoDescription(updated.seo_description ?? "");
      showSuccess("Hub SEO saved");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onOgFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      clearOgPick();
      return;
    }
    if (!f.type.startsWith("image/")) {
      showError("Please choose an image file (PNG, JPEG, WebP, …).");
      clearOgPick();
      return;
    }
    if (f.size > MAX_SEO_OG_BYTES) {
      showError(`Image must be ${MAX_SEO_OG_BYTES / (1024 * 1024)}MB or smaller.`);
      clearOgPick();
      return;
    }
    setOgPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(f);
    });
    setOgSelectedFile(f);
  };

  const onUploadOg = async () => {
    if (!ogSelectedFile) {
      return;
    }
    setOgAction("upload");
    try {
      const updated = await uploadAdminFormulaMarketingSeoOgImage(
        accessToken,
        row.id,
        ogSelectedFile
      );
      onRowUpdated(updated);
      clearOgPick();
      showSuccess("Hub OG image uploaded");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setOgAction("idle");
    }
  };

  const onRemoveOg = async () => {
    setOgAction("delete");
    try {
      const updated = await deleteAdminFormulaMarketingSeoOgImage(accessToken, row.id);
      if (updated) {
        onRowUpdated(updated);
      } else {
        const fresh = await getAdminFormulaMarketing(accessToken, row.id);
        onRowUpdated(fresh);
      }
      clearOgPick();
      showSuccess("Hub OG image removed");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setOgAction("idle");
    }
  };

  const hubSlug = row.marketing_slug?.trim();

  return (
    <FormSection className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">Formula hub (public landing)</h3>
        <p className="text-sm text-muted-foreground">
          SEO for the marketing home URL when you have a{" "}
          <span className="font-mono text-xs">marketing_slug</span>. This is separate from
          per-release SEO.
        </p>
      </div>

      {hubSlug ? (
        <p className="text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => {
              window.open(absolutePublicMarketingUrl(marketingHubPath(hubSlug)), "_blank", "noopener,noreferrer");
            }}
            className="text-primary underline-offset-2 hover:underline"
          >
            Open public hub page
          </button>
        </p>
      ) : (
        <p className="text-sm text-amber-600/90 dark:text-amber-400/90">
          Set a marketing slug on the Settings tab to preview the public hub URL.
        </p>
      )}

      <div className="space-y-2">
        <FormLabel htmlFor={`${id}-hub-seo-title`}>SEO title</FormLabel>
        <FormInput
          id={`${id}-hub-seo-title`}
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
          placeholder="Optional — overrides the formula name in meta tags"
          autoComplete="off"
        />
        <FormHelperText>
          If empty, the public site can fall back to the formula name.
        </FormHelperText>
      </div>

      <div className="space-y-2">
        <FormLabel htmlFor={`${id}-hub-seo-desc`}>SEO description</FormLabel>
        <textarea
          id={`${id}-hub-seo-desc`}
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          rows={3}
          className={cn(
            "flex min-h-20 w-full max-w-2xl resize-y rounded-xl border border-input bg-background px-3 py-2",
            "text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          )}
          placeholder="Optional — search / social description"
        />
        <FormHelperText>
          If empty, the public site can fall back to name or title and the marketing hero image
          file.
        </FormHelperText>
      </div>

      <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
        <div>
          <FormLabel className="text-foreground">SEO OG image</FormLabel>
          <p className="mt-1 text-xs text-muted-foreground">
            If empty, the public site can fall back to name or title and the hero image.
          </p>
        </div>
        <input
          ref={ogFileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          id={`${id}-hub-seo-og`}
          aria-label="Choose hub SEO Open Graph image"
          onChange={onOgFileChange}
        />
        {row.seo_og_image_url && !ogSelectedFile ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Current</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin API URLs */}
              <img
                src={row.seo_og_image_url}
                alt=""
                className="h-24 max-w-full rounded-lg border border-border object-contain"
              />
              <a
                href={row.seo_og_image_url}
                target="_blank"
                rel="noreferrer"
                className="break-all text-xs text-primary underline-offset-2 hover:underline"
              >
                Open image URL
              </a>
            </div>
          </div>
        ) : !row.seo_og_image_url && !ogSelectedFile ? (
          <p className="text-sm text-muted-foreground">No hub OG image set.</p>
        ) : null}
        {ogSelectedFile && ogPreviewUrl ? (
          <p className="text-sm text-foreground">
            {ogSelectedFile.name} ({(ogSelectedFile.size / 1024).toFixed(0)} KB)
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <SecondaryButton
            type="button"
            disabled={ogAction !== "idle"}
            onClick={() => ogFileRef.current?.click()}
          >
            {row.seo_og_image_url || ogSelectedFile ? "Replace image…" : "Choose image…"}
          </SecondaryButton>
          {ogSelectedFile ? (
            <>
              <PrimaryButton
                type="button"
                disabled={ogAction !== "idle" || !ogSelectedFile}
                onClick={() => void onUploadOg()}
              >
                {ogAction === "upload" ? "Uploading…" : "Upload OG image"}
              </PrimaryButton>
              <SecondaryButton type="button" disabled={ogAction !== "idle"} onClick={clearOgPick}>
                Clear selection
              </SecondaryButton>
            </>
          ) : null}
          {row.seo_og_image_url && !ogSelectedFile ? (
            <SecondaryButton
              type="button"
              disabled={ogAction !== "idle"}
              onClick={() => void onRemoveOg()}
            >
              {ogAction === "delete" ? "Removing…" : "Remove OG image"}
            </SecondaryButton>
          ) : null}
        </div>
        <FormHelperText>Max {MAX_SEO_OG_BYTES / (1024 * 1024)}MB. Common image types.</FormHelperText>
      </div>

      <div className="flex flex-wrap gap-2">
        <PrimaryButton type="button" onClick={() => void onSave()} disabled={saving}>
          {saving ? "Saving…" : "Save SEO text"}
        </PrimaryButton>
      </div>
    </FormSection>
  );
}
