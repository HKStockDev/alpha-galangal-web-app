import Link from "next/link";
import Image from "next/image";
import {
  INVESTOR_META,
  INVESTOR_SCORE_SLUGS,
} from "@/lib/investor-score-models";
import { cn } from "@/lib/utils";
import type { DashboardBasePath } from "@/lib/auth-routing";

export function InvestorsScoresHub({ basePath }: { basePath: DashboardBasePath }) {
  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Investors scores
          </h1>
          <p className="text-base text-muted-foreground">
            Open a model to view scores, run a custom pass, or recalculate for that formula only.
          </p>
        </header>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INVESTOR_SCORE_SLUGS.map((slug) => {
            const m = INVESTOR_META[slug];
            return (
              <li key={slug}>
                <Link
                  href={`${basePath}/investors-scores/${slug}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border/60 bg-card p-4 transition-colors",
                    "hover:border-border hover:bg-muted/40"
                  )}
                >
                  {m.iconSrc ? (
                    <Image
                      src={m.iconSrc}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-full border border-border object-cover"
                    />
                  ) : (
                    <span
                      className="flex size-10 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold"
                      aria-hidden
                    >
                      {m.shortLabel}
                    </span>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground">View and run {m.label} scores</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
