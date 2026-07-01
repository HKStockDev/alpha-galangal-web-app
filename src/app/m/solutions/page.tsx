import { type Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import { CTASection } from "@/components/marketing/cta-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, Search, Briefcase, Check } from "lucide-react"

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Structured research workflows for RIAs, independent research firms, and boutique asset managers.",
}

const solutions = [
  {
    id: "rias",
    icon: Shield,
    badge: "For RIAs",
    title: "Support portfolio decisions with structured research",
    description:
      "Generate differentiated ideas faster, document investment reasoning, and build internal repeatable workflows — all without relying on fragmented tools.",
    benefits: [
      "Generate differentiated ideas faster",
      "Document investment reasoning with explainable scores",
      "Build internal repeatable research workflows",
      "Reduce reliance on fragmented tools and spreadsheets",
      "Support compliance documentation with audit trails",
    ],
  },
  {
    id: "research-firms",
    icon: Search,
    badge: "For Research Firms",
    title: "Scale research without scaling infrastructure",
    description:
      "Build repeatable screening workflows and custom factor models without maintaining internal data pipelines or engineering resources.",
    benefits: [
      "Custom formulas aligned with your research methodology",
      "Taxonomy intelligence for industry-level analysis",
      "Signal overlays for insider and political activity",
      "Organized watchlists and tagging systems",
      "Reusable templates across research coverage",
    ],
  },
  {
    id: "boutique-managers",
    icon: Briefcase,
    badge: "For Boutique Managers",
    title: "Build conviction around concentrated positions",
    description:
      "Overlay political, insider, and thematic signals into concentrated conviction strategies. Detect dislocations and track factor alignment over time.",
    benefits: [
      "Detect dislocations when fundamentals diverge from price",
      "Track insider alignment across your portfolio",
      "Monitor industry momentum and sector rotations",
      "Apply thematic overlays for catalyst tracking",
      "Build conviction with explainable scoring models",
    ],
  },
]

export default function SolutionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/40 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-4">
                Solutions
              </Badge>
              <h1 className="font-display text-balance text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl">
                Research workflows for every investment team
              </h1>
              <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
                Whether you manage client portfolios, publish independent
                research, or run concentrated strategies — the platform adapts to
                your process.
              </p>
            </div>
          </div>
        </section>

        {/* Solutions */}
        {solutions.map((solution, index) => {
          const Icon = solution.icon
          const isEven = index % 2 === 0
          return (
            <section
              key={solution.id}
              className={
                isEven
                  ? "py-20 lg:py-28"
                  : "border-y border-border/40 bg-muted/20 py-20 lg:py-28"
              }
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                  <div className={isEven ? "order-1" : "order-1 lg:order-2"}>
                    <Badge variant="secondary" className="mb-4">
                      {solution.badge}
                    </Badge>
                    <h2 className="font-display text-balance text-4xl font-normal leading-tight tracking-tight text-foreground sm:text-5xl">
                      {solution.title}
                    </h2>
                    <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                      {solution.description}
                    </p>
                    <ul className="mt-8 flex flex-col gap-3">
                      {solution.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-start gap-3 text-sm text-foreground"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8">
                      <Button asChild>
                        <Link href="/demo">See How It Works</Link>
                      </Button>
                    </div>
                  </div>
                  <div className={isEven ? "order-2" : "order-2 lg:order-1"}>
                    {/* Solution Visual */}
                    <div className="overflow-hidden rounded-lg border border-border/60 bg-card p-8 shadow-sm">
                      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <div className="space-y-4">
                        {solution.benefits.slice(0, 3).map((benefit, i) => (
                          <div
                            key={benefit}
                            className="flex items-center gap-4 rounded-md bg-muted/40 p-3"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {i + 1}
                            </div>
                            <span className="text-sm text-foreground">
                              {benefit.split(" ").slice(0, 4).join(" ")}...
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )
        })}

        {/* CTA */}
        <CTASection
          title="Find the right solution for your team"
          primaryLabel="Book a Demo"
          primaryHref="/demo"
          secondaryLabel="View Pricing"
          secondaryHref="/pricing"
        />
      </main>
      <Footer />
    </div>
  )
}
