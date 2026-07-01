const LOGO_BASE = "/logos";

export type BrandLogoVariant = "full" | "collapsed";

export function brandLogoSrc(
  theme: "light" | "dark",
  variant: BrandLogoVariant,
  format: "png" | "svg" = "png",
) {
  return `${LOGO_BASE}/precision-${theme}-${variant}.${format}`;
}

export const MARKETING_LOGO = {
  light: brandLogoSrc("light", "full", "svg"),
  dark: brandLogoSrc("dark", "full", "svg"),
} as const;
