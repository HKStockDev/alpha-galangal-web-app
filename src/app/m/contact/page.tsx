import { type Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"
import { ContactForm } from "@/components/marketing/contact-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, MessageSquare } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with our team. We are here to answer questions about the platform and help you get started.",
}

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/40 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-4">
                Contact
              </Badge>
              <h1 className="font-display text-balance text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl">
                Get in touch
              </h1>
              <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
                Have questions about the platform? Want to discuss how it fits
                your research workflow? We&apos;re here to help.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
              {/* Form */}
              <div className="lg:col-span-3">
                <h2 className="text-2xl font-semibold text-foreground">
                  Send us a message
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Fill out the form below and we&apos;ll get back to you within
                  one business day.
                </p>
                <div className="mt-8">
                  <ContactForm />
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-2">
                <div className="flex flex-col gap-8">
                  {/* Book Demo Card */}
                  <div className="rounded-lg border border-border/60 bg-card p-6">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Book a demo
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      See the platform in action with a personalized walkthrough
                      tailored to your research workflow.
                    </p>
                    <Button asChild className="mt-4 w-full">
                      <Link href="/demo">Schedule Demo</Link>
                    </Button>
                  </div>

                  {/* Email Card */}
                  <div className="rounded-lg border border-border/60 bg-card p-6">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-secondary/60">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Email us directly
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Prefer email? Reach out directly and we&apos;ll respond
                      within one business day.
                    </p>
                    <a
                      href="mailto:alex@withconviction.ai"
                      className="mt-4 inline-flex text-sm font-medium text-primary hover:text-primary/80"
                    >
                      alex@withconviction.ai
                    </a>
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
