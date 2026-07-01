"use client";

import Link from "next/link";
import { ADMIN_SOCIAL_PROMPTS } from "@/lib/social-routes";

export function ComposeRenderScriptsBanner() {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
      Only one render script is loaded. Apply pending database migrations (
      <code className="text-xs">con176_expand</code>, <code className="text-xs">con177</code>) to
      unlock Quick take, Image-first, and Video teaser.{" "}
      <Link href={ADMIN_SOCIAL_PROMPTS} className="text-primary underline">
        Open prompt library
      </Link>
    </div>
  );
}
