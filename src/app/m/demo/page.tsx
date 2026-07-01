import { type Metadata } from "next"
import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import { ContactForm } from "@/components/marketing/contact-form"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

export const metadata: Metadata = {
  title: "Request a Demo",
  description:
    "See how the platform fits your research workflow. Schedule a personalized demo with our team.",
}

const demoIncludes = [
  "Personalized walkthrough of the platform",
  "Signal layer overview and data sources",
  "Custom formula builder demonstration",
  "Workflow examples for your use case",
  "Q&A with our research team",
]

export default function DemoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/40 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-4">
                Request Demo
              </Badge>
              <h1 className="font-display text-balance text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl">
                See how the platform fits your research workflow
              </h1>
              <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
                Schedule a personalized demo to explore how structured research
                workflows can improve your investment process.
              </p>
            </div>
          </div>
        </section>

        {/* Demo Form */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              {/* What's Included */}
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  What&apos;s included in the demo
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Get a comprehensive overview of the platform tailored to your
                  specific research needs and investment process.
                </p>
                <ul className="mt-8 flex flex-col gap-4">
                  {demoIncludes.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Testimonial-style quote */}
                <div className="mt-12 rounded-lg border border-border/60 bg-muted/20 p-6">
                  <p className="text-sm italic leading-relaxed text-muted-foreground">
                    &quot;The demo was incredibly thorough. The team understood
                    our research process and showed us exactly how to build the
                    workflows we needed. We were up and running within a
                    week.&quot;
                  </p>
                  <p className="mt-4 text-sm font-medium text-foreground">
                    — Investment Analyst, RIA
                  </p>
                </div>
              </div>

              {/* Form */}
              <div>
                <div className="rounded-lg border border-border/60 bg-card p-6 shadow-sm lg:p-8">
                  <h3 className="text-xl font-semibold text-foreground">
                    Schedule your demo
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Fill out the form and we&apos;ll reach out to schedule a time
                    that works for you.
                  </p>
                  <div className="mt-6">
                    <ContactForm
                      submitLabel="Request Demo"
                      messagePlaceholder="Tell us about your research workflow, the size of your team, and anything you'd like to see in the demo."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
