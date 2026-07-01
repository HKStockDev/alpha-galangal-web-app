import { type Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import { SectionHeader } from "@/components/marketing/section-header"
import { FeatureCard } from "@/components/marketing/feature-card"
import { PersonaCard } from "@/components/marketing/persona-card"
import { DashboardPreview } from "@/components/marketing/dashboard-preview"
import { CTASection } from "@/components/marketing/cta-section"
import { DotGridBackground } from "@/components/marketing/dot-grid-background"
import { Filter, Layers, Target, Check, X } from "lucide-react"

export const metadata: Metadata = {
  title: {
    absolute: "Precision - Component-based content architecture for a research platform",
  },
  alternates: { canonical: "/" },
}

// NOTE: tune these to match your real platform coverage when you have firm numbers.
const HERO_STATS = [
  { value: "6,000+", label: "US-listed equities scored" },
  { value: "5", label: "Signal families" },
  { value: "Daily", label: "Refresh cadence" },
  { value: "2018", label: "Backtest depth" },
]

const FEATURES: Array<{
  eyebrow: string
  title: string
  description: string
}> = [
  {
    eyebrow: "SCREENER",
    title: "Multi-factor screening",
    description:
      "Filter and rank securities using customizable factor combinations.",
  },
  {
    eyebrow: "FORMULAS",
    title: "Weighted formula builder",
    description:
      "Create scoring models with adjustable weights and thresholds.",
  },
  {
    eyebrow: "POLITICAL",
    title: "Political activity signals",
    description:
      "Track congressional trading activity and legislative exposures.",
  },
  {
    eyebrow: "INSIDER",
    title: "Insider activity tracking",
    description: "Monitor executive buying patterns and Form 4 filings.",
  },
  {
    eyebrow: "13F",
    title: "Institutional positioning",
    description: "See hedge fund and institutional ownership changes.",
  },
  {
    eyebrow: "MOMENTUM",
    title: "Industry momentum signals",
    description: "Identify sector rotations using taxonomy-based momentum.",
  },
  {
    eyebrow: "THEMES",
    title: "Thematic tagging system",
    description: "Organize research by themes, catalysts, and exposures.",
  },
  {
    eyebrow: "HISTORY",
    title: "Historical factor tracking",
    description: "Analyze how factor scores evolve across time periods.",
  },
]

const WORKFLOW_STEPS = [
  {
    title: "Define your factors",
    description:
      "Select the metrics that reflect how you actually evaluate companies.",
  },
  {
    title: "Build scoring models",
    description:
      "Create weighted formulas aligned with your investment philosophy.",
  },
  {
    title: "Rank and investigate",
    description:
      "Screen the market using explainable signals across entities and industries.",
  },
  {
    title: "Save and refine",
    description:
      "Organize research using tags, watchlists, and reusable workflows.",
  },
]

const PERSONAS = [
  {
    eyebrow: "REGISTERED ADVISORS",
    title: "RIAs",
    description:
      "Generate differentiated ideas and support portfolio decisions with explainable research infrastructure.",
  },
  {
    eyebrow: "RESEARCH FIRMS",
    title: "Independent research",
    description:
      "Build repeatable screening workflows without maintaining internal data pipelines.",
  },
  {
    eyebrow: "ASSET MANAGERS",
    title: "Boutique funds",
    description:
      "Overlay political, insider, and thematic signals into concentrated precision strategies.",
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <DotGridBackground />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <div className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  <span className="h-px w-6 bg-border" aria-hidden />
                  <span>Precision · Research Platform</span>
                </div>
                <h1 className="font-display text-balance text-5xl font-normal leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                  Discover differentiated equity ideas with{" "}
                  <em className="not-italic text-primary">precision</em>
                </h1>
                <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                  Build custom research models using factors, insider activity,
                  political signals, hedge fund positioning, and industry
                  momentum — inside one structured workflow designed for serious
                  investors.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                  <Button asChild size="lg">
                    <Link href="/demo">Book a Demo</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/platform">Explore the Platform</Link>
                  </Button>
                </div>
                <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  No card required · 20-minute walkthrough
                </p>
              </div>
              <div className="lg:pl-8">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Stat strip */}
        <section className="border-b border-border/40 bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <dl className="grid grid-cols-2 divide-border/60 sm:grid-cols-4 sm:divide-x">
              {HERO_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-start gap-1 px-2 py-8 sm:px-6"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="font-display text-4xl font-normal leading-none tracking-tight text-foreground sm:text-5xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Value props — the one section where icons live */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Why Precision"
              title="Move beyond generic screeners"
            />
            <div className="mt-14 grid gap-10 md:grid-cols-3">
              {[
                {
                  icon: Filter,
                  title: "Custom factor models",
                  description:
                    "Build scoring systems around your own investment philosophy instead of relying on static ratings.",
                },
                {
                  icon: Layers,
                  title: "Signal-aware workflows",
                  description:
                    "Overlay insider activity, political trading behavior, and hedge fund positioning directly into your screening process.",
                },
                {
                  icon: Target,
                  title: "Explainable rankings",
                  description:
                    "Understand why a company ranks highly — not just that it does.",
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="text-center">
                    <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md bg-secondary/60 ring-1 ring-inset ring-border/60">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Feature bento — no more icon-tile repetition */}
        <section className="relative overflow-hidden border-y border-border/40 bg-muted/20 py-20 lg:py-28">
          <DotGridBackground className="opacity-40" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Platform"
              title="One platform for structured idea generation"
            />
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  eyebrow={feature.eyebrow}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </div>
        </section>

        {/* How it works — editorial width, serif numerals */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Workflow"
              title="Designed for repeatable research"
              align="left"
              className="mx-0"
            />
            <ol className="mt-14 grid gap-12 sm:grid-cols-2">
              {WORKFLOW_STEPS.map((step, i) => {
                const num = (i + 1).toString().padStart(2, "0")
                return (
                  <li key={step.title} className="relative pl-16">
                    <span
                      aria-hidden
                      className="absolute left-0 top-0 font-display text-5xl font-normal italic leading-none text-foreground/80"
                    >
                      {num}
                    </span>
                    <span
                      aria-hidden
                      className="absolute left-0 top-14 h-px w-10 bg-accent"
                    />
                    <h3 className="text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        {/* Audience */}
        <section className="border-y border-border/40 bg-muted/20 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Built for"
              title="Focused investment teams"
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {PERSONAS.map((persona, i) => (
                <PersonaCard
                  key={persona.title}
                  index={i + 1}
                  eyebrow={persona.eyebrow}
                  title={persona.title}
                  description={persona.description}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Differentiation */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Compared"
              title="Not another generic screener"
            />
            <div className="mt-12 overflow-hidden rounded-md border border-border/60">
              <div className="grid md:grid-cols-3">
                <div className="border-b border-border/40 p-6 md:border-b-0 md:border-r">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Generic screeners
                  </h3>
                  <ul className="mt-6 flex flex-col gap-3">
                    {[
                      "Static filters",
                      "Limited signals",
                      "No workflow layer",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 text-sm text-muted-foreground"
                      >
                        <X className="h-4 w-4 text-muted-foreground/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-b border-border/40 p-6 md:border-b-0 md:border-r">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Traditional terminals
                  </h3>
                  <ul className="mt-6 flex flex-col gap-3">
                    {[
                      "Expensive",
                      "Fragmented workflows",
                      "Rigid interfaces",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 text-sm text-muted-foreground"
                      >
                        <X className="h-4 w-4 text-muted-foreground/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-primary/[0.03] p-6 dark:bg-primary/10 dark:ring-1 dark:ring-inset dark:ring-primary/20">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                    Precision
                  </h3>
                  <ul className="mt-6 flex flex-col gap-3">
                    {[
                      "Custom formulas",
                      "Signal overlays",
                      "Historical factor tracking",
                      "Taxonomy intelligence",
                      "Team-ready workflows",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 text-sm text-foreground"
                      >
                        <Check className="h-4 w-4 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CTASection
          title="Bring institutional-grade research workflows to your investment process"
          secondaryLabel="Contact Sales"
          secondaryHref="/contact"
        />
      </main>
      <Footer />
    </div>
  )
}
