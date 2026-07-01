import { type Metadata } from "next"
import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import { SectionHeader } from "@/components/marketing/section-header"
import { FeatureCard } from "@/components/marketing/feature-card"
import { CTASection } from "@/components/marketing/cta-section"
import { DashboardPreview } from "@/components/marketing/dashboard-preview"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Platform",
  description:
    "Multi-factor screening, weighted formulas, and signal intelligence built around your research process.",
}

export default function PlatformPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/40 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-4">
                Platform Overview
              </Badge>
              <h1 className="font-display text-balance text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl">
                Structured research infrastructure for serious investors
              </h1>
              <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
                Build custom screening workflows, layer signal intelligence, and
                track factor evolution — all in one unified platform.
              </p>
            </div>
          </div>
        </section>

        {/* Multi-factor Screening */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="font-display text-balance text-4xl font-normal leading-tight tracking-tight text-foreground sm:text-5xl">
                  Multi-factor screening built around your process
                </h2>
                <p className="mt-6 text-pretty leading-relaxed text-muted-foreground">
                  Filter by fundamentals, rank by custom formulas, and layer
                  signal intelligence. The platform adapts to how you evaluate
                  companies — not the other way around.
                </p>
                <ul className="mt-8 flex flex-col gap-4">
                  {[
                    "Filter by over 200 fundamental metrics",
                    "Rank results using custom scoring formulas",
                    "Layer insider, political, and positioning signals",
                    "Save and reuse screening templates",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-foreground"
                    >
                      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <DashboardPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Scoring Models */}
        <section className="border-y border-border/40 bg-muted/20 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="order-2 lg:order-1">
                {/* Scoring Model Preview */}
                <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
                  <div className="border-b border-border/40 bg-muted/30 px-4 py-3">
                    <span className="text-sm font-medium text-foreground">
                      Formula Builder — Quality + Momentum Model
                    </span>
                  </div>
                  <div className="divide-y divide-border/30 p-4">
                    {[
                      { factor: "ROE (5yr avg)", weight: "25%", direction: "Higher is better" },
                      { factor: "Revenue Growth", weight: "20%", direction: "Higher is better" },
                      { factor: "Price Momentum (6mo)", weight: "20%", direction: "Higher is better" },
                      { factor: "Debt/Equity", weight: "15%", direction: "Lower is better" },
                      { factor: "Insider Buying Score", weight: "20%", direction: "Higher is better" },
                    ].map((row) => (
                      <div
                        key={row.factor}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {row.factor}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.direction}
                          </p>
                        </div>
                        <Badge variant="secondary">{row.weight}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border/40 bg-muted/20 px-4 py-3">
                    <span className="text-xs text-muted-foreground">
                      Total weight: 100% — Model validated
                    </span>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="font-display text-balance text-4xl font-normal leading-tight tracking-tight text-foreground sm:text-5xl">
                  Build your own scoring models
                </h2>
                <p className="mt-6 text-pretty leading-relaxed text-muted-foreground">
                  Create weighted formulas that reflect your investment
                  philosophy. Save model templates, track historical performance,
                  and understand exactly why each company scores the way it does.
                </p>
                <ul className="mt-8 flex flex-col gap-4">
                  {[
                    "Weighted formulas with adjustable parameters",
                    "Reusable model templates across screens",
                    "Explainable score breakdowns",
                    "Historical score tracking and backtesting",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-foreground"
                    >
                      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Signal Intelligence */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Signal intelligence beyond fundamentals"
              description="Layer alternative data signals into your screening process for a more complete research picture."
            />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                eyebrow="POLITICAL"
                title="Political activity signals"
                description="Track congressional trading activity and committee membership exposures across your universe."
              />
              <FeatureCard
                eyebrow="INSIDER"
                title="Insider behavior tracking"
                description="Monitor Form 4 filings, executive buying patterns, and insider alignment scores."
              />
              <FeatureCard
                eyebrow="13F"
                title="Hedge fund positioning"
                description="Overlay 13F holdings changes and institutional ownership momentum."
              />
              <FeatureCard
                eyebrow="MOMENTUM"
                title="Industry taxonomy momentum"
                description="Identify sector rotations using granular industry classification signals."
              />
              <FeatureCard
                eyebrow="THEMES"
                title="Thematic exposure tagging"
                description="Tag and filter companies by thematic exposures like AI, reshoring, or energy transition."
              />
              <FeatureCard
                eyebrow="OVERLAYS"
                title="Custom signal layers"
                description="Combine multiple signal types into composite overlays for your screens."
              />
            </div>
          </div>
        </section>

        {/* Track Through Time */}
        <section className="border-y border-border/40 bg-muted/20 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="font-display text-balance text-4xl font-normal leading-tight tracking-tight text-foreground sm:text-5xl">
                  Track signals through time
                </h2>
                <p className="mt-6 text-pretty leading-relaxed text-muted-foreground">
                  Understand how factor scores, signal intensities, and rankings
                  evolve over time. Detect dislocations when fundamentals diverge
                  from price action.
                </p>
                <ul className="mt-8 flex flex-col gap-4">
                  {[
                    "Historical factor score timelines",
                    "Score evolution tracking across periods",
                    "Trend awareness and momentum detection",
                    "Dislocation identification when metrics diverge",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-foreground"
                    >
                      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                {/* Timeline Preview */}
                <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
                  <div className="border-b border-border/40 bg-muted/30 px-4 py-3">
                    <span className="text-sm font-medium text-foreground">
                      Score History — NVDA
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-end justify-between gap-2">
                      {[65, 72, 68, 78, 82, 85, 91, 94].map((score, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <div
                            className="w-8 rounded-t bg-primary/80"
                            style={{ height: `${score * 1.2}px` }}
                          />
                          <span className="text-xs text-muted-foreground">
                            Q{i + 1 > 4 ? i - 3 : i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        8-quarter trend
                      </span>
                      <span className="font-medium text-emerald-600">
                        +44.6% improvement
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <CTASection
          title="See the platform in action"
          primaryLabel="Book a Demo"
          primaryHref="/demo"
          secondaryLabel="View Use Cases"
          secondaryHref="/use-cases"
        />
      </main>
      <Footer />
    </div>
  )
}
