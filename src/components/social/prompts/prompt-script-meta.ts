export const RENDER_TEMPLATE_STORAGE_KEY = "conviction_social_render_template";

export type RenderScriptMeta = {
  icon: string;
  useCase: string;
  platforms: string[];
  accentClass: string;
  capabilities: {
    caption: boolean;
    image: boolean;
    videoScript: boolean;
  };
};

export const RENDER_SCRIPT_META: Record<string, RenderScriptMeta> = {
  signal_card_v1: {
    icon: "📊",
    useCase: "OG-style signal cards and link shares across major networks",
    platforms: ["linkedin", "facebook", "x", "instagram", "tiktok", "stocktwits"],
    accentClass: "border-blue-500/30 bg-blue-500/5",
    capabilities: { caption: true, image: true, videoScript: false },
  },
  quick_take_v1: {
    icon: "⚡",
    useCase: "Fast hook-first drops for short-form feeds",
    platforms: ["x", "tiktok", "stocktwits"],
    accentClass: "border-amber-500/30 bg-amber-500/5",
    capabilities: { caption: true, image: false, videoScript: false },
  },
  image_first_v1: {
    icon: "🖼️",
    useCase: "Visual-first posts when the image carries the story",
    platforms: ["instagram", "facebook", "linkedin"],
    accentClass: "border-pink-500/30 bg-pink-500/5",
    capabilities: { caption: true, image: true, videoScript: false },
  },
  video_teaser_v1: {
    icon: "🎬",
    useCase: "Video and reel teasers with scroll-stopping hooks",
    platforms: ["tiktok", "instagram", "x"],
    accentClass: "border-violet-500/30 bg-violet-500/5",
    capabilities: { caption: true, image: false, videoScript: true },
  },
};

export const ROLE_ORDER = [
  "base",
  "platform_overlay",
  "post_kind_overlay",
  "guardrail",
  "normalizer",
] as const;

export const ROLE_BADGE_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  base: "default",
  platform_overlay: "secondary",
  post_kind_overlay: "outline",
  guardrail: "destructive",
  normalizer: "outline",
};

export const SAMPLE_CONTEXT = {
  organization_name: "Conviction",
  ticker: "AAPL",
  signal_name: "High insider conviction",
  summary:
    "Insider buying accelerated over the last 90 days with clustered open-market purchases.",
  page_url: "https://app.withconviction.ai/stocks/AAPL",
};

export type PromptsTab = "overview" | "scripts" | "templates" | "sandbox";

export const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  x: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  tiktok: 2200,
  stocktwits: 1000,
};
