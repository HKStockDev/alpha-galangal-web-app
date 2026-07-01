"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Share2 } from "lucide-react";

type Channel = "x" | "stocktwits" | "instagram" | "linkedin" | "facebook";

const btnClass =
  "h-9 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-xs font-medium sm:flex-initial sm:px-4";

type Props = {
  /** e.g. page title for share text. */
  shareTitle: string;
  className?: string;
};

function makeShareText(title: string, pageUrl: string) {
  const t = title.trim() || "Precision";
  return `${t} — ${pageUrl}`.replace(/\s+/g, " ").trim();
}

function shareHref(channel: Channel, pageUrl: string, text: string): { href: string; external: boolean } {
  const u = encodeURIComponent(pageUrl);
  const t = encodeURIComponent(text);
  switch (channel) {
    case "x":
      return {
        href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
        external: true,
      };
    case "facebook":
      return { href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, external: true };
    case "linkedin":
      return { href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, external: true };
    case "stocktwits": {
      const message = `${text}`.replace(/\n/g, " ");
      return {
        href: `https://stocktwits.com/share?message=${encodeURIComponent(message)}`,
        external: true,
      };
    }
    case "instagram":
    default:
      return { href: "#", external: false };
  }
}

export function FormulaShareSection({ shareTitle, className }: Props) {
  const pathname = usePathname() ?? "/";
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPageUrl(window.location.origin + pathname);
  }, [pathname]);

  const text = makeShareText(shareTitle, pageUrl || "");
  const [igState, setIgState] = useState<"idle" | "copied" | "err">("idle");

  const copyForInstagram = useCallback(async () => {
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
      setIgState("copied");
      window.setTimeout(() => setIgState("idle"), 2500);
    } catch {
      setIgState("err");
      window.setTimeout(() => setIgState("idle"), 2500);
    }
  }, [pageUrl]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-muted/20 px-4 py-4 sm:px-5",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Share2 className="h-4 w-4 text-muted-foreground" aria-hidden />
        Share
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Opens a share or compose window. Instagram has no public URL for arbitrary links, so we copy
        the page link for you to paste in a story or post.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {(
          [
            { id: "x" as const, label: "X" },
            { id: "stocktwits" as const, label: "StockTwits" },
            { id: "instagram" as const, label: "Instagram" },
            { id: "linkedin" as const, label: "LinkedIn" },
            { id: "facebook" as const, label: "Facebook" },
          ] as const
        ).map(({ id, label }) => {
          if (id === "instagram") {
            return (
              <Button
                key={id}
                type="button"
                variant="outline"
                className={btnClass}
                disabled={!pageUrl}
                onClick={() => void copyForInstagram()}
              >
                {igState === "copied" ? "Link copied" : igState === "err" ? "Copy failed" : label}
              </Button>
            );
          }
          const { href, external } = shareHref(id, pageUrl, text);
          return (
            <Button
              key={id}
              type="button"
              variant="outline"
              className={btnClass}
              disabled={!pageUrl}
              asChild
            >
              <a
                href={pageUrl ? href : undefined}
                target="_blank"
                rel={external ? "noopener noreferrer" : undefined}
                aria-label={`Share on ${label}`}
              >
                {label}
              </a>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
