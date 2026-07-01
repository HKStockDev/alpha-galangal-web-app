import { Facebook, Instagram, Linkedin, Plug } from "lucide-react";
import type { ConfigurableSocialPlatform } from "@/lib/api";
import { cn } from "@/lib/utils";

export type PlatformDescriptor = {
  id: ConfigurableSocialPlatform;
  label: string;
  brandColorClass: string;
  Icon: React.ComponentType<{ className?: string }>;
};

function XBrandIcon({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex h-4 w-4 items-center justify-center text-[11px] font-bold", className)}>
      𝕏
    </span>
  );
}

function TikTokBrandIcon({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex h-4 w-4 items-center justify-center text-[10px] font-bold", className)}>
      TT
    </span>
  );
}

export const SOCIAL_PLATFORMS: PlatformDescriptor[] = [
  { id: "linkedin", label: "LinkedIn", brandColorClass: "text-[#0a66c2]", Icon: Linkedin },
  { id: "facebook", label: "Facebook", brandColorClass: "text-[#1877f2]", Icon: Facebook },
  { id: "instagram", label: "Instagram", brandColorClass: "text-[#e4405f]", Icon: Instagram },
  { id: "x", label: "X", brandColorClass: "text-foreground", Icon: XBrandIcon },
  { id: "tiktok", label: "TikTok", brandColorClass: "text-foreground", Icon: TikTokBrandIcon },
];

export function formatSocialAbsolute(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSocialRelative(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const minutes = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  let phrase: string;
  if (minutes < 1) phrase = "just now";
  else if (minutes < 60) phrase = `${minutes} min`;
  else if (hours < 24) phrase = `${hours} hr`;
  else phrase = `${days} day${days === 1 ? "" : "s"}`;
  if (phrase === "just now") return phrase;
  return diffMs >= 0 ? `in ${phrase}` : `${phrase} ago`;
}

export type StatusVariant = "default" | "secondary" | "destructive" | "outline" | "ghost";

export function socialStatusBadgeVariant(status: string): StatusVariant {
  const s = status.toLowerCase();
  if (s === "active") return "default";
  if (s === "disconnected") return "secondary";
  if (s === "error") return "destructive";
  return "outline";
}

export function SocialPlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const found = SOCIAL_PLATFORMS.find((p) => p.id === platform);
  if (found) {
    const { Icon, brandColorClass } = found;
    return <Icon className={cn("h-4 w-4", brandColorClass, className)} />;
  }
  return <Plug className={cn("h-4 w-4 text-muted-foreground", className)} />;
}

export function isConfigurableSocialPlatform(p: string): p is ConfigurableSocialPlatform {
  return SOCIAL_PLATFORMS.some((known) => known.id === p);
}
