import { type Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import { CTASection } from "@/components/marketing/cta-section"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  TrendingUp,
  Briefcase,
  LineChart,
  Search,
  Target,
  ArrowRight,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "Use Cases",
  description:
    "Explore research workflows: political activity scores, insider alignment, industry momentum, and more.",
}

interface UseCase {
  icon: LucideIcon
  title: string
  description: string
  workflow: string[]
}

const useCases: UseCase[] = [
  {
    icon: Building2,
    title: "Build a Political Activity Score",
    description:
      "Combine congressional trading signals, committee membership exposures, and legislative risk factors into a composite political activity score.",
    workflow: [
      "Define political signal factors",
      "Weight by relevance to your thesis",
      "Screen for high-activity companies",
      "Track score changes over time",
    ],
  },
  {
    icon: TrendingUp,
    title: "Identify Dislocated Compounders",
    description:
      "Find quality companies where strong fundamentals have diverged from recent price action, creating potential entry points.",
    workflow: [
      "Screen for high ROE and revenue growth",
      "Filter by negative price momentum",
      "Overlay insider buying signals",
      "Rank by dislocation magnitude",
    ],
  },
  {
    icon: Briefcase,
    title: "Screen Insider-Aligned Opportunities",
    description:
      "Identify companies where executive buying aligns with improving fundamentals and positive momentum signals.",
    workflow: [
      "Filter by recent Form 4 buying activity",
      "Layer fundamental improvement metrics",
      "Add momentum confirmation filters",
      "Rank by insider alignment score",
    ],
  },
  {
    icon: LineChart,
    title: "Track Industry Momentum Cycles",
    description:
      "Monitor sector rotation patterns using taxonomy-based momentum signals to identify emerging industry trends.",
    workflow: [
      "Select industry taxonomy level",
      "Calculate cross-sector momentum",
      "Identify rotation inflection points",
      "Drill down to company-level opportunities",
    ],
  },
  {
    icon: Search,
    title: "Create Thematic Watchlists",
    description:
      "Organize research coverage by thematic exposures like AI infrastructure, energy transition, or reshoring catalysts.",
    workflow: [
      "Define thematic criteria and tags",
      "Screen for exposure signals",
      "Build persistent watchlists",
      "Track thematic performance over time",
    ],
  },
  {
    icon: Target,
    title: "Rank Companies Using House Models",
    description:
      "Apply your firm's proprietary evaluation methodology as a reusable scoring model across your entire coverage universe.",
    workflow: [
      "Translate your thesis into factors",
      "Build weighted scoring formula",
      "Apply across coverage universe",
      "Refine based on historical results",
    ],
  },
]

export default function UseCasesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/40 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-4">
                Use Cases
              </Badge>
              <h1 className="font-display text-balance text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl">
                Research workflows in action
              </h1>
              <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
                Explore how investment teams use the platform to build
                repeatable, signal-driven research processes.
              </p>
            </div>
          </div>
        </section>

        {/* Use Cases Grid */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {useCases.map((useCase) => {
                const Icon = useCase.icon
                return (
                  <div
                    key={useCase.title}
                    className="group flex flex-col rounded-lg border border-border/60 bg-card p-6 transition-all hover:border-border hover:shadow-sm"
                  >
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-secondary/60">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {useCase.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {useCase.description}
                    </p>
                    <div className="mt-6 border-t border-border/40 pt-4">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Workflow Steps
                      </p>
                      <ol className="flex flex-col gap-2">
                        {useCase.workflow.map((step, i) => (
                          <li
                            key={step}
                            className="flex items-center gap-2 text-sm text-foreground"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <Link
                      href="/demo"
                      className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      See this in action
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <CTASection
          title="Ready to build your own research workflows?"
          primaryLabel="Book a Demo"
          primaryHref="/demo"
          secondaryLabel="View Platform"
          secondaryHref="/platform"
        />
      </main>
      <Footer />
    </div>
  )
}
