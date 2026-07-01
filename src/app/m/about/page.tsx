import { type Metadata } from "next"
import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import { CTASection } from "@/components/marketing/cta-section"
import { Badge } from "@/components/ui/badge"
import { Eye, Sliders, Lightbulb, Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "About",
  description:
    "Serious investing requires structured research. Learn about our mission to bring institutional-grade workflows to focused investment teams.",
}

const principles = [
  {
    icon: Eye,
    title: "Clarity over noise",
    description:
      "Focus on signal-driven insights rather than information overload. Every data point should serve your research process.",
  },
  {
    icon: Sliders,
    title: "Flexibility over rigid ratings",
    description:
      "Your investment philosophy is unique. Build custom models instead of relying on one-size-fits-all scores.",
  },
  {
    icon: Lightbulb,
    title: "Explainability over black boxes",
    description:
      "Understand exactly why a company ranks the way it does. No hidden algorithms or opaque methodologies.",
  },
  {
    icon: Shield,
    title: "Precision over chatter",
    description:
      "Support deep research and considered positions rather than reactive trading or noise-driven decisions.",
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/40 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-4">
                About Us
              </Badge>
              <h1 className="font-display text-balance text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl">
                Serious investing requires structured research
              </h1>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg prose-slate mx-auto">
              <p className="text-lg leading-relaxed text-muted-foreground">
                Most independent investment teams rely on fragmented tools that
                were never designed to work together. Screening happens in one
                place, signal monitoring in another, and thesis documentation in
                spreadsheets that quickly become unmaintainable.
              </p>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                This platform exists to give focused investors the same
                structured idea-generation workflows traditionally available only
                inside large institutions — without the overhead, complexity, or
                cost of enterprise terminal products.
              </p>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                We believe that independent RIAs, research firms, and boutique
                managers deserve research infrastructure that adapts to their
                process, not the other way around. Custom factor models,
                explainable scoring, and signal overlays should be accessible to
                every serious investor.
              </p>
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="border-y border-border/40 bg-muted/20 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Our principles
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                The values that guide how we build research infrastructure.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2">
              {principles.map((principle) => {
                const Icon = principle.icon
                return (
                  <div
                    key={principle.title}
                    className="flex gap-5 rounded-lg border border-border/60 bg-card p-6"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {principle.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {principle.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <CTASection
          title="Join the focused investors using structured research"
          primaryLabel="Book a Demo"
          primaryHref="/demo"
          secondaryLabel="Contact Us"
          secondaryHref="/contact"
        />
      </main>
      <Footer />
    </div>
  )
}
