import { type Metadata } from "next"
import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import { PricingCard } from "@/components/marketing/pricing-card"
import { CTASection } from "@/components/marketing/cta-section"
import { ORG_BILLING_SETTINGS_PATH } from "@/lib/billing-plans"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for research teams of all sizes. Professional, Team, and Enterprise plans available.",
}

const billingHref = ORG_BILLING_SETTINGS_PATH

const plans = [
  {
    name: "Professional",
    description: "Single-user research workflows for independent analysts.",
    features: [
      "Single-user access",
      "Custom factor formulas",
      "Saved screens and watchlists",
      "Insider activity signals",
      "Political activity signals",
      "13F positioning overlays",
      "Email support",
    ],
    highlighted: false,
    ctaLabel: "Start free trial",
    ctaHref: billingHref,
  },
  {
    name: "Team",
    description: "Multi-user workspace for collaborative research teams.",
    features: [
      "Up to 10 users",
      "Everything in Professional",
      "Shared watchlists and models",
      "Organization-level tagging",
      "Collaboration features",
      "Team activity dashboard",
      "Priority support",
    ],
    highlighted: true,
    ctaLabel: "Subscribe in app",
    ctaHref: `${billingHref}?plan=team_annual`,
  },
  {
    name: "Enterprise",
    description: "Advanced capabilities for institutional research operations.",
    features: [
      "Unlimited users",
      "Everything in Team",
      "Advanced signal layers",
      "API access (coming soon)",
      "Priority onboarding",
      "Custom integrations",
      "Dedicated success manager",
    ],
    highlighted: false,
    ctaLabel: "Contact sales",
    ctaHref: "/contact",
  },
]

const faqs = [
  {
    question: "How does pricing work?",
    answer:
      "We offer annual subscriptions with transparent, seat-based pricing. Contact our team for a custom quote based on your team size and requirements.",
  },
  {
    question: "Can I try the platform before committing?",
    answer:
      "Yes. We offer personalized demos where you can see the platform in action with your specific research use cases. We can also arrange a trial period for qualified teams.",
  },
  {
    question: "What data sources are included?",
    answer:
      "All plans include access to our core data layers: fundamental metrics, insider activity signals, political trading activity, 13F positioning data, and industry taxonomy intelligence.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer:
      "Yes. You can upgrade at any time, and we will prorate the difference. Downgrades take effect at your next renewal date.",
  },
  {
    question: "Is there an API available?",
    answer:
      "API access is coming soon for Enterprise customers. Contact us to join the waitlist and provide input on the API design.",
  },
  {
    question: "What kind of support is included?",
    answer:
      "Professional plans include email support. Team plans include priority support with faster response times. Enterprise plans include a dedicated success manager and custom onboarding.",
  },
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/40 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-4">
                Pricing
              </Badge>
              <h1 className="font-display text-balance text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl">
                Simple, transparent pricing
              </h1>
              <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
                Choose the plan that fits your research workflow. All plans
                include our core screening and signal intelligence features.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-3">
              {plans.map((plan) => (
                <PricingCard
                  key={plan.name}
                  name={plan.name}
                  description={plan.description}
                  features={plan.features}
                  highlighted={plan.highlighted}
                  ctaLabel={plan.ctaLabel}
                  ctaHref={plan.ctaHref}
                />
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              All prices are billed annually. Contact us for monthly billing
              options.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border/40 bg-muted/20 py-20 lg:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Frequently asked questions
              </h2>
              <p className="mt-4 text-muted-foreground">
                Have a different question? Contact our team.
              </p>
            </div>
            <Accordion type="single" collapsible className="mt-12">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-foreground">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <CTASection
          title="Ready to get started?"
          primaryLabel="Start free trial"
          primaryHref={billingHref}
          secondaryLabel="Contact Sales"
          secondaryHref="/contact"
        />
      </main>
      <Footer />
    </div>
  )
}
