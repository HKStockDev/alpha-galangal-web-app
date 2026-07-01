"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  completeWoopMediaUpload,
  getWoopPlatformInputs,
  listPrecisionSocialAccounts,
  listSocialRenderTemplates,
  listWoopMedia,
  previewSocialImagePrompt,
  previewSocialPromptCaption,
  publishSocialPost,
  generateSocialPromptMedia,
  startWoopMediaUpload,
  validateWoopCompose,
  type SocialAccountRow,
  type SocialGenerateImageResult,
  type SocialGenerateVideoScriptResult,
  type SocialPublishMode,
  type SocialRenderTemplateRow,
  type WoopMediaItem,
} from "@/lib/api";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { ComposeStepHeader } from "./compose/compose-step-header";
import { ComposeAccountSection } from "./compose/compose-account-section";
import { ComposePostTypeSection } from "./compose/compose-post-type-section";
import { ComposeCaptionSection } from "./compose/compose-caption-section";
import { ComposePlatformPreview } from "./compose/compose-platform-preview";
import { ComposeRenderScriptSection } from "./compose/compose-render-script-section";
import { ComposeRenderScriptsBanner } from "./compose/compose-render-scripts-banner";
import { ComposeImageWorkflowSection } from "./compose/compose-image-workflow-section";
import { ComposeVideoScriptSection } from "./compose/compose-video-script-section";
import { ComposeMediaPicker } from "./compose/compose-media-picker";
import { ComposePlatformOptions } from "./compose/compose-platform-options";
import { ComposePreviewPanel } from "./compose/compose-preview-panel";
import { ComposeScheduleSection } from "./compose/compose-schedule-section";
import { ComposeActionsBar } from "./compose/compose-actions-bar";
import { ComposeWizardNav } from "./compose/compose-wizard-nav";
import { RENDER_SCRIPT_META } from "./prompts/prompt-script-meta";
import {
  DEFAULT_SIGNAL_CONTEXT,
  RENDER_TEMPLATE_STORAGE_KEY,
  localDatetimeToUtcIso,
  parseTickerFromUrl,
  suggestPostKindFromMedia,
  type PostKind,
  type SignalContext,
} from "./compose/compose-types";

function extractValidationMessages(
  result: unknown,
  kind: "errors" | "warnings"
): string[] {
  if (!result || typeof result !== "object") return [];
  const o = result as Record<string, unknown>;
  const items = o[kind];
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      const m = (item as { message?: string; code?: string }).message;
      const c = (item as { code?: string }).code;
      return m ?? c ?? JSON.stringify(item);
    }
    return String(item);
  });
}

function isImageResult(
  result: SocialGenerateImageResult | SocialGenerateVideoScriptResult
): result is SocialGenerateImageResult {
  return "woop_media_id" in result;
}

export function AdminSocialComposePanel() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();

  const [accounts, setAccounts] = useState<SocialAccountRow[]>([]);
  const [renderTemplates, setRenderTemplates] = useState<SocialRenderTemplateRow[]>([]);
  const [mediaItems, setMediaItems] = useState<WoopMediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentStep, setCurrentStep] = useState(0);
  const [accountId, setAccountId] = useState("");
  const [postKind, setPostKind] = useState<PostKind>("link_share");
  const [selectedRenderKey, setSelectedRenderKey] = useState("signal_card_v1");
  const [context, setContext] = useState<SignalContext>(DEFAULT_SIGNAL_CONTEXT);
  const [caption, setCaption] = useState("");
  const [imagePromptText, setImagePromptText] = useState("");
  const [videoScript, setVideoScript] = useState("");
  const [resolvedKeys, setResolvedKeys] = useState<string[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [generatedImageMediaId, setGeneratedImageMediaId] = useState<string | null>(null);
  const [platformInputsRaw, setPlatformInputsRaw] = useState<unknown>(null);
  const [platformOptions, setPlatformOptions] = useState<Record<string, unknown>>({});
  const [publishMode, setPublishMode] = useState<SocialPublishMode>("now");
  const [scheduleLocal, setScheduleLocal] = useState("");

  const [generating, setGenerating] = useState(false);
  const [loadingImagePrompt, setLoadingImagePrompt] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const platform = selectedAccount?.platform ?? "linkedin";
  const selectedRenderTemplate = renderTemplates.find((r) => r.template_key === selectedRenderKey);
  const imageCapable = RENDER_SCRIPT_META[selectedRenderKey]?.capabilities?.image ?? false;

  const canContinueStep0 = Boolean(accountId && selectedRenderKey);
  const canContinueStep1 = Boolean(caption.trim());

  const previewMediaThumb = useMemo(() => {
    const firstId = selectedMediaIds[0];
    if (!firstId) return null;
    const item = mediaItems.find((m) => m.id === firstId);
    return item?.thumbnailUrl ?? item?.url ?? null;
  }, [selectedMediaIds, mediaItems]);

  const loadMedia = useCallback(async () => {
    if (!accessToken) return;
    try {
      setMediaItems(await listWoopMedia(accessToken));
    } catch {
      // Woop may be disabled
    }
  }, [accessToken]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [acctRows, renders] = await Promise.all([
        listPrecisionSocialAccounts(accessToken),
        listSocialRenderTemplates(accessToken),
      ]);
      const active = acctRows.filter((a) => (a.status ?? "").toLowerCase() === "active");
      setAccounts(active);
      setRenderTemplates(renders);
      if (active[0] && !accountId) setAccountId(active[0].id);

      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem(RENDER_TEMPLATE_STORAGE_KEY)
          : null;
      if (stored && renders.some((r) => r.template_key === stored)) {
        setSelectedRenderKey(stored);
      }
      await loadMedia();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load compose data");
    } finally {
      setLoading(false);
    }
  }, [accessToken, accountId, loadMedia, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!accessToken || !accountId) return;
    void getWoopPlatformInputs(accessToken, accountId)
      .then(setPlatformInputsRaw)
      .catch(() => setPlatformInputsRaw(null));
  }, [accessToken, accountId]);

  useEffect(() => {
    const ticker = parseTickerFromUrl(context.page_url);
    if (ticker && ticker !== context.ticker) {
      setContext((c) => ({ ...c, ticker }));
    }
  }, [context.page_url, context.ticker]);

  useEffect(() => {
    const types = selectedMediaIds
      .map((id) => mediaItems.find((m) => m.id === id)?.mediaType ?? "")
      .filter(Boolean);
    setPostKind((current) => suggestPostKindFromMedia(types, current));
  }, [selectedMediaIds, mediaItems]);

  const selectRenderKey = (key: string) => {
    setSelectedRenderKey(key);
    const rt = renderTemplates.find((r) => r.template_key === key);
    if (rt?.compatible_post_kinds?.length) {
      const compatible = rt.compatible_post_kinds as PostKind[];
      setPostKind((current) =>
        compatible.includes(current) ? current : (compatible[0] ?? current)
      );
    }
    setImagePromptText("");
    try {
      localStorage.setItem(RENDER_TEMPLATE_STORAGE_KEY, key);
    } catch {
      // ignore
    }
  };

  const toggleMedia = (id: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const resolveImagePrompt = async () => {
    if (!accessToken) return;
    setLoadingImagePrompt(true);
    try {
      const result = await previewSocialImagePrompt(accessToken, {
        render_template_key: selectedRenderKey,
        context,
      });
      setImagePromptText(result.image_prompt_text);
      setResolvedKeys((prev) => [...new Set([...prev, ...result.resolved_prompt_keys])]);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to resolve image prompt");
    } finally {
      setLoadingImagePrompt(false);
    }
  };

  useEffect(() => {
    if (currentStep === 1 && imageCapable && accessToken && !imagePromptText.trim()) {
      void resolveImagePrompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resolve once when entering content step
  }, [currentStep, imageCapable, accessToken, selectedRenderKey]);

  const copyImagePrompt = async () => {
    try {
      await navigator.clipboard.writeText(imagePromptText);
      showSuccess("Image prompt copied.");
    } catch {
      showError("Could not copy to clipboard.");
    }
  };

  const generateCaption = async () => {
    if (!accessToken || !selectedAccount) return;
    setGenerating(true);
    try {
      const result = await previewSocialPromptCaption(accessToken, {
        platform: selectedAccount.platform,
        post_kind: postKind,
        render_template_key: selectedRenderKey,
        context,
      });
      setCaption(result.caption);
      setResolvedKeys(result.resolved_prompt_keys);
      setValidationErrors([]);
      setValidationWarnings([]);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Caption generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const generateImage = async () => {
    if (!accessToken || !selectedAccount) return;
    if (!imagePromptText.trim()) {
      await resolveImagePrompt();
    }
    setGeneratingImage(true);
    try {
      const result = await generateSocialPromptMedia(accessToken, {
        platform: selectedAccount.platform,
        post_kind: postKind,
        render_template_key: selectedRenderKey,
        context,
        media_kind: "image",
      });
      if (!isImageResult(result)) {
        throw new Error("Unexpected response from image generation.");
      }
      if (result.image_prompt_text) setImagePromptText(result.image_prompt_text);
      setGeneratedImageMediaId(result.woop_media_id);
      setSelectedMediaIds((prev) =>
        prev.includes(result.woop_media_id) ? prev : [...prev, result.woop_media_id]
      );
      setResolvedKeys((prev) => [...new Set([...prev, ...result.resolved_prompt_keys])]);
      await loadMedia();
      showSuccess("Signal card image generated and added to Woop library.");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Image generation failed");
    } finally {
      setGeneratingImage(false);
    }
  };

  const generateVideoScript = async () => {
    if (!accessToken || !selectedAccount) return;
    setGeneratingScript(true);
    try {
      const result = await generateSocialPromptMedia(accessToken, {
        platform: selectedAccount.platform,
        post_kind: postKind,
        render_template_key: selectedRenderKey,
        context,
        media_kind: "video_script",
      });
      if (isImageResult(result)) {
        throw new Error("Unexpected response from video script generation.");
      }
      const scriptResult = result as SocialGenerateVideoScriptResult;
      setVideoScript(scriptResult.script_text);
      setResolvedKeys((prev) => [...new Set([...prev, ...scriptResult.resolved_prompt_keys])]);
      showSuccess("Video script generated.");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Video script generation failed");
    } finally {
      setGeneratingScript(false);
    }
  };

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
        await fetch(part.uploadUrl, { method: "PUT", body: file.slice(start, end) });
      }
      await completeWoopMediaUpload(accessToken, session.uploadSessionId);
      showSuccess("Media uploaded.");
      await loadMedia();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const buildSubmitBody = () => {
    const publishAt =
      publishMode === "schedule" && scheduleLocal
        ? localDatetimeToUtcIso(scheduleLocal)
        : undefined;

    return {
      social_account_id: accountId,
      caption: caption.trim(),
      link_url: context.page_url,
      post_kind: postKind,
      publish_mode: publishMode,
      publish_at: publishAt,
      media_ids: selectedMediaIds.length ? selectedMediaIds : undefined,
      prompt_params: {
        render_template_key: selectedRenderKey,
        woop_platform_inputs: platformOptions,
        signal_context: context,
        video_script: videoScript.trim() || undefined,
        image_prompt_text: imagePromptText.trim() || undefined,
      },
    };
  };

  const validate = async () => {
    if (!accessToken || !accountId || !caption.trim()) {
      showError("Select an account and add a caption before validating.");
      return;
    }
    setValidating(true);
    try {
      const body = buildSubmitBody();
      const result = await validateWoopCompose(accessToken, {
        social_account_id: body.social_account_id,
        caption: body.caption,
        link_url: body.link_url,
        post_kind: body.post_kind,
        platform_inputs: platformOptions,
        media_ids: body.media_ids,
        publish_mode: body.publish_mode,
        publish_at: body.publish_at,
      });
      const errors = extractValidationMessages(result, "errors");
      const warnings = extractValidationMessages(result, "warnings");
      setValidationErrors(errors);
      setValidationWarnings(warnings);
      if (!errors.length) {
        showSuccess("Validation passed — ready to publish.");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setValidating(false);
    }
  };

  const submit = async () => {
    if (!accessToken || !accountId || !caption.trim()) {
      showError("Caption and account are required.");
      return;
    }
    if (publishMode === "schedule" && !scheduleLocal) {
      showError("Pick a schedule date and time.");
      return;
    }
    setSubmitting(true);
    try {
      const body = buildSubmitBody();
      const result = await publishSocialPost(accessToken, body);
      const msg =
        publishMode === "draft"
          ? "Draft saved."
          : publishMode === "schedule"
            ? `Post scheduled${result.publish_at ? ` for ${new Date(result.publish_at).toLocaleString()}` : ""}.`
            : result.external_post_url
              ? `Published! ${result.external_post_url}`
              : "Post submitted via Woop Social.";
      setSuccessMessage(msg);
      showSuccess(msg);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCaption("");
    setImagePromptText("");
    setVideoScript("");
    setResolvedKeys([]);
    setSelectedMediaIds([]);
    setGeneratedImageMediaId(null);
    setValidationErrors([]);
    setValidationWarnings([]);
    setSuccessMessage(null);
    setPublishMode("now");
    setScheduleLocal("");
    setCurrentStep(0);
  };

  const goToStep = (step: number) => {
    if (step <= currentStep || step === 0) {
      setCurrentStep(step);
      return;
    }
    if (step === 1 && canContinueStep0) setCurrentStep(1);
    if (step === 2 && canContinueStep0 && canContinueStep1) setCurrentStep(2);
  };

  const stepNav = useMemo(
    () => (
      <ComposeWizardNav
        step={currentStep}
        canContinue={currentStep === 0 ? canContinueStep0 : canContinueStep1}
        onBack={() => setCurrentStep((s) => Math.max(0, s - 1))}
        onContinue={() => setCurrentStep((s) => Math.min(2, s + 1))}
      />
    ),
    [canContinueStep0, canContinueStep1, currentStep]
  );

  if (loading) {
    return <LoadingSkeleton variant="card" lines={8} className="mx-auto max-w-6xl py-6" />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <header className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Compose post</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Build captions and images from your prompt library, validate, and publish through Woop
            Social.
          </p>
        </div>
        <ComposeStepHeader activeStep={currentStep} onStepClick={goToStep} />
      </header>

      {renderTemplates.length <= 1 ? <ComposeRenderScriptsBanner /> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {currentStep === 0 ? (
            <>
              <ComposeAccountSection
                accounts={accounts}
                accountId={accountId}
                onSelect={setAccountId}
              />
              <ComposePostTypeSection postKind={postKind} onChange={setPostKind} />
              <ComposeRenderScriptSection
                renderTemplates={renderTemplates}
                selectedRenderKey={selectedRenderKey}
                onSelectRenderKey={selectRenderKey}
              />
              {selectedRenderTemplate?.description ? (
                <p className="text-sm text-muted-foreground">{selectedRenderTemplate.description}</p>
              ) : null}
              {stepNav}
            </>
          ) : null}

          {currentStep === 1 ? (
            <>
              <ComposeCaptionSection
                platform={platform}
                context={context}
                caption={caption}
                resolvedKeys={resolvedKeys}
                onContextChange={setContext}
                onCaptionChange={setCaption}
                onGenerate={() => void generateCaption()}
                generating={generating}
              />
              <ComposeImageWorkflowSection
                selectedRenderKey={selectedRenderKey}
                imagePromptText={imagePromptText}
                loadingPrompt={loadingImagePrompt}
                onResolvePrompt={() => void resolveImagePrompt()}
                onCopyPrompt={() => void copyImagePrompt()}
                generatingImage={generatingImage}
                generatedImageMediaId={generatedImageMediaId}
                onGenerateWithGemini={() => void generateImage()}
                mediaItems={mediaItems}
                selectedMediaIds={selectedMediaIds}
                onToggleMedia={toggleMedia}
                onRefreshMedia={() => void loadMedia()}
              />
              <ComposeVideoScriptSection
                selectedRenderKey={selectedRenderKey}
                videoScript={videoScript}
                onVideoScriptChange={setVideoScript}
                generatingScript={generatingScript}
                onGenerateVideoScript={() => void generateVideoScript()}
              />
              <ComposeMediaPicker
                items={mediaItems}
                selectedIds={selectedMediaIds}
                onToggle={toggleMedia}
                onUpload={uploadFile}
                uploading={uploading}
                onRefresh={() => void loadMedia()}
              />
              <ComposePlatformOptions
                platformInputs={platformInputsRaw}
                value={platformOptions}
                onChange={setPlatformOptions}
              />
              {stepNav}
            </>
          ) : null}

          {currentStep === 2 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Confirm schedule and publish on the right. Use{" "}
                <span className="font-medium text-foreground">Validate</span> before submitting.
              </p>
              <ComposeWizardNav
                step={currentStep}
                canContinue={false}
                onBack={() => setCurrentStep(1)}
                onContinue={() => undefined}
              />
            </>
          ) : null}
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {currentStep === 1 ? (
            <ComposePlatformPreview
              platform={platform}
              caption={caption}
              linkUrl={context.page_url}
              selectedMediaCount={selectedMediaIds.length}
              mediaThumbUrl={previewMediaThumb}
            />
          ) : currentStep >= 2 ? (
            <ComposePreviewPanel
              platform={platform}
              caption={caption}
              onCaptionChange={setCaption}
              resolvedKeys={resolvedKeys}
              linkUrl={context.page_url}
              selectedMediaCount={selectedMediaIds.length}
            />
          ) : (
            <ComposePlatformPreview
              platform={platform}
              caption={caption}
              linkUrl={context.page_url}
              selectedMediaCount={selectedMediaIds.length}
              mediaThumbUrl={previewMediaThumb}
            />
          )}
          {currentStep >= 2 ? (
            <>
              <ComposeScheduleSection
                mode={publishMode}
                onModeChange={setPublishMode}
                scheduleLocal={scheduleLocal}
                onScheduleLocalChange={setScheduleLocal}
              />
              <ComposeActionsBar
                publishMode={publishMode}
                validating={validating}
                submitting={submitting}
                validationErrors={validationErrors}
                validationWarnings={validationWarnings}
                onValidate={() => void validate()}
                onSubmit={() => void submit()}
                successMessage={successMessage}
                onReset={resetForm}
              />
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              Continue to Review to schedule, validate, and publish.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
