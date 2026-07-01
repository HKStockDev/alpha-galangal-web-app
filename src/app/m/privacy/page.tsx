import { type Metadata } from "next"
import { Navbar } from "@/components/marketing/navbar"
import { Footer } from "@/components/marketing/footer"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for the Precision platform, websites, and related services operated by Precision AI LLC.",
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <article className="py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <header className="mb-12">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Privacy Policy
              </h1>
              <p className="mt-4 text-sm text-muted-foreground">
                Effective Date: May 12, 2026
                <br />
                Last Updated: May 12, 2026
              </p>
            </header>

            <div className="prose prose-slate max-w-none">
              <section className="mb-10" id="who-we-are">
                <h2 className="text-2xl font-semibold text-foreground">
                  1. Who We Are
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Precision AI LLC (&quot;Precision,&quot; &quot;we,&quot;
                  &quot;our,&quot; or &quot;us&quot;) operates the Precision
                  platform, the websites at withprecision.ai and
                  app.withprecision.ai, and related services (collectively, the
                  &quot;Service&quot;). This Privacy Policy describes how we
                  collect, use, and share personal information when you visit
                  our websites, use the Service, or otherwise interact with us.
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Our mailing address is Precision AI LLC, 8401 Mayland Dr,
                  Ste A, Richmond, Henrico County, VA 23294, United States. You
                  can reach us about any privacy-related question at{" "}
                  <a
                    href="mailto:alex@withprecision.ai"
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    alex@withprecision.ai
                  </a>
                  .
                </p>
              </section>

              <section className="mb-10" id="scope">
                <h2 className="text-2xl font-semibold text-foreground">
                  2. Scope
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  This Policy applies to:
                </p>
                <ul className="mt-4 list-disc pl-6 text-muted-foreground">
                  <li>
                    Visitors to our marketing websites at withprecision.ai (the
                    &quot;Marketing Site&quot;).
                  </li>
                  <li>
                    Organizations that subscribe to the Service
                    (&quot;Customers&quot;) and their authorized end users
                    (&quot;End Users&quot;).
                  </li>
                  <li>
                    Individuals who contact us, complete forms, or otherwise
                    communicate with us.
                  </li>
                </ul>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Customers use the Service to provide certain data and content
                  to the platform (&quot;Customer Data&quot;). With respect to
                  Customer Data, the Customer is the &quot;controller&quot; and
                  Precision is the &quot;processor&quot; — meaning the Customer
                  determines what data is processed and Precision processes
                  Customer Data on the Customer&apos;s behalf under our
                  subscription agreement. For all other personal information
                  described in this Policy (e.g., billing, account, and
                  marketing data), Precision is the controller.
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  If you are an End User of a Customer organization, your use
                  of the Service is also governed by your organization&apos;s
                  policies. Direct requests about Customer Data (e.g., to
                  access, correct, or delete it) to your organization&apos;s
                  administrator.
                </p>
              </section>

              <section className="mb-10" id="information-we-collect">
                <h2 className="text-2xl font-semibold text-foreground">
                  3. Information We Collect
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  We collect the following categories of personal information:
                </p>
                <ul className="mt-4 list-disc pl-6 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">
                      Account and identity information
                    </strong>{" "}
                    — name, work email, organization, role, password (stored as
                    a salted hash), profile photo, and any authentication
                    factors you enable.
                  </li>
                  <li>
                    <strong className="text-foreground">Customer Data</strong> —
                    content you, your organization, or your End Users create or
                    upload while using the Service, including chat assistant
                    messages, saved workflows, formulas, marketing release
                    drafts, exposure/tag rules, and uploaded files.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Third-party integration data
                    </strong>{" "}
                    — when you connect a third-party service (e.g., LinkedIn,
                    Meta/Facebook, or market-data providers), we store the
                    tokens and metadata needed to perform the connection
                    (account label, external account name and identifier,
                    access and refresh tokens, token expiry, and connection
                    status). Today these integrations are used for social
                    accounts that Precision operates for its own outbound
                    communications; we may expand integration capabilities to
                    Customers in the future.
                  </li>
                  <li>
                    <strong className="text-foreground">Billing data</strong> —
                    billing contact, billing address, last four digits of the
                    payment card, and transaction history. Card numbers and
                    full payment details are collected and processed directly
                    by our payment processor, Stripe, and are not stored on our
                    servers.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Usage and device data
                    </strong>{" "}
                    — IP address, browser type and version, device type,
                    operating system, language, time zone, referring page,
                    pages viewed, links clicked, session timestamps, and error
                    logs.
                  </li>
                  <li>
                    <strong className="text-foreground">Communications</strong>{" "}
                    — the contents of messages you send us via email, contact
                    forms, or support requests.
                  </li>
                  <li>
                    <strong className="text-foreground">Marketing data</strong>{" "}
                    — information you provide if you sign up for marketing
                    communications.
                  </li>
                </ul>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  We do not knowingly collect special categories of personal
                  data, biometric data, or precise geolocation data. We do not
                  knowingly collect personal information from children; the
                  Service is not directed to individuals under 18.
                </p>
              </section>

              <section className="mb-10" id="sources">
                <h2 className="text-2xl font-semibold text-foreground">
                  4. Sources of Personal Information
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  We collect information:
                </p>
                <ul className="mt-4 list-disc pl-6 text-muted-foreground">
                  <li>Directly from you (e.g., registration, support, forms).</li>
                  <li>
                    From your organization (e.g., when an administrator invites
                    you to the Service).
                  </li>
                  <li>
                    Automatically through cookies, analytics, and server logs.
                  </li>
                  <li>
                    From third-party services you or your organization connect,
                    such as OAuth providers and market-data providers.
                  </li>
                </ul>
              </section>

              <section className="mb-10" id="how-we-use">
                <h2 className="text-2xl font-semibold text-foreground">
                  5. How We Use Your Information
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  We use personal information to:
                </p>
                <ul className="mt-4 list-disc pl-6 text-muted-foreground">
                  <li>Provide, operate, secure, and improve the Service.</li>
                  <li>
                    Authenticate users and protect against fraud, abuse, and
                    unauthorized access.
                  </li>
                  <li>
                    Process subscriptions, invoices, and tax obligations
                    through Stripe.
                  </li>
                  <li>
                    Send service-related communications, including
                    notifications, alerts, support, and material policy or
                    security updates.
                  </li>
                  <li>Respond to inquiries and provide customer support.</li>
                  <li>Analyze usage and product performance.</li>
                  <li>
                    Operate Precision&apos;s own marketing channels (including
                    social posts from Precision-managed accounts).
                  </li>
                  <li>
                    Comply with applicable laws and enforce our agreements.
                  </li>
                </ul>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  We do not sell your personal information in exchange for
                  monetary consideration. To the extent that our use of
                  analytics or session-replay tools could be considered
                  &quot;sharing&quot; under California law, you may opt out at
                  any time by emailing alex@withprecision.ai or by enabling
                  the Global Privacy Control (GPC) signal in your browser.
                </p>
              </section>

              <section className="mb-10" id="ai-processing">
                <h2 className="text-2xl font-semibold text-foreground">
                  6. Artificial Intelligence and Machine-Learning Processing
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  The Service uses artificial intelligence and machine-learning
                  systems, including large language models, to generate
                  research outputs, summaries, suggestions, and chat-assistant
                  responses. We currently use:
                </p>
                <ul className="mt-4 list-disc pl-6 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">OpenAI</strong> (GPT and
                    related models) under OpenAI&apos;s API terms.
                  </li>
                  <li>
                    <strong className="text-foreground">Google Gemini</strong>{" "}
                    under Google&apos;s API terms.
                  </li>
                </ul>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  When you submit a prompt or content to a feature that uses
                  these systems, the relevant inputs and outputs are
                  transmitted to and processed by the AI provider so the
                  feature can return a response. Each provider has its own
                  privacy and data-retention policies, which we encourage you
                  to review.
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  We do not use Customer Data to train foundation models, and
                  we configure our integrations with these providers to disable
                  provider-side training on our API traffic where the provider
                  supports such controls. We may use aggregated, de-identified,
                  or anonymized data derived from use of the Service to improve
                  our own product features.
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  AI outputs may be inaccurate, incomplete, or biased. Outputs
                  are not investment advice and should be independently
                  verified before being used to make any decision.
                </p>
              </section>

              <section className="mb-10" id="cookies">
                <h2 className="text-2xl font-semibold text-foreground">
                  7. Cookies and Similar Tracking Technologies
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  We and our service providers use cookies, pixels, local
                  storage, and similar technologies to operate the Service and
                  understand how it is used.
                </p>
                <ul className="mt-4 list-disc pl-6 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">
                      Strictly necessary
                    </strong>{" "}
                    — session cookies, CSRF tokens, and local storage used to
                    authenticate you, remember your preferences, and maintain
                    security.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Vercel Analytics and Web Analytics
                    </strong>{" "}
                    — first-party or cookieless metrics (depending on
                    configuration) for page views and performance.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Google Analytics 4
                    </strong>{" "}
                    — page views, sessions, and event analytics. Sets cookies
                    prefixed with <code>_ga</code>.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Microsoft Clarity
                    </strong>{" "}
                    — heatmaps and session-replay recordings of how visitors
                    interact with the Marketing Site. Clarity captures
                    interactions such as clicks, scrolls, and keystrokes. Input
                    fields are masked by default. See Microsoft&apos;s Clarity
                    privacy documentation for additional detail.
                  </li>
                </ul>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  You can control cookies through your browser settings.
                  Disabling strictly-necessary cookies may impair functionality
                  of the Service. Most browsers also support &quot;Do Not
                  Track&quot; or Global Privacy Control signals; we treat the
                  GPC signal as a valid opt-out of &quot;sharing&quot; under
                  California law.
                </p>
              </section>

              <section className="mb-10" id="sharing">
                <h2 className="text-2xl font-semibold text-foreground">
                  8. How We Share and Disclose Information
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  We share personal information only in the following
                  circumstances:
                </p>
                <ul className="mt-4 list-disc pl-6 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">
                      Service providers and sub-processors
                    </strong>{" "}
                    — third parties that provide infrastructure or services on
                    our behalf and are contractually obligated to safeguard
                    personal information. Current sub-processors include:
                    <ul className="mt-2 list-[circle] pl-6">
                      <li>
                        <strong className="text-foreground">Vercel</strong> —
                        hosting, content delivery, analytics, and
                        observability.
                      </li>
                      <li>
                        <strong className="text-foreground">Stripe</strong> —
                        payment processing.
                      </li>
                      <li>
                        <strong className="text-foreground">OpenAI</strong> —
                        AI model inference.
                      </li>
                      <li>
                        <strong className="text-foreground">Google</strong> —
                        AI model inference (Gemini) and analytics (Google
                        Analytics 4).
                      </li>
                      <li>
                        <strong className="text-foreground">Microsoft</strong>{" "}
                        — product analytics and session replay (Clarity).
                      </li>
                      <li>
                        <strong className="text-foreground">
                          LinkedIn (Microsoft)
                        </strong>{" "}
                        and{" "}
                        <strong className="text-foreground">Meta</strong> —
                        only when connected via OAuth to operate
                        Precision-managed social accounts.
                      </li>
                      <li>
                        <strong className="text-foreground">
                          Financial Modeling Prep
                        </strong>{" "}
                        and similar market-data providers — to ingest market
                        data into the platform.
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Within your organization
                    </strong>{" "}
                    — End User content within the Service is accessible to your
                    organization&apos;s administrators and other authorized
                    users as permitted by your organization.
                  </li>
                  <li>
                    <strong className="text-foreground">Business transfers</strong>{" "}
                    — in connection with a merger, acquisition, financing,
                    reorganization, or sale of all or part of our assets,
                    subject to standard confidentiality protections.
                  </li>
                  <li>
                    <strong className="text-foreground">Legal and safety</strong>{" "}
                    — to comply with applicable law, lawful requests from
                    public authorities, valid court orders or subpoenas, or to
                    protect our rights, property, and the safety of users or
                    the public.
                  </li>
                  <li>
                    <strong className="text-foreground">With your consent</strong>{" "}
                    — for any other purpose disclosed to you at the time we
                    request your consent.
                  </li>
                </ul>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  We may add or change sub-processors from time to time.
                  Customers can request the current list by emailing
                  alex@withprecision.ai.
                </p>
              </section>

              <section className="mb-10" id="your-rights">
                <h2 className="text-2xl font-semibold text-foreground">
                  9. Your Privacy Rights (U.S. State Laws)
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Depending on where you live, you may have the following
                  rights with respect to personal information that Precision
                  holds as a controller. The Service is currently offered to
                  U.S. residents only.
                </p>
                <ul className="mt-4 list-disc pl-6 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">
                      Right to know / access
                    </strong>{" "}
                    — request confirmation of whether we process personal
                    information about you and a copy of that information.
                  </li>
                  <li>
                    <strong className="text-foreground">Right to correct</strong>{" "}
                    — request correction of inaccurate personal information.
                  </li>
                  <li>
                    <strong className="text-foreground">Right to delete</strong>{" "}
                    — request deletion of personal information.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Right to portability
                    </strong>{" "}
                    — receive a copy of certain information in a portable
                    format.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Right to opt out of &quot;sale&quot; or &quot;sharing&quot;
                    </strong>{" "}
                    — we do not sell personal information for monetary
                    consideration; you may opt out of any activity that could
                    be considered &quot;sharing&quot; at any time.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Right to limit use of sensitive personal information
                    </strong>{" "}
                    — we do not knowingly use sensitive personal information
                    for purposes beyond what is permitted under California law
                    without notice.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Right to non-discrimination
                    </strong>{" "}
                    — we will not discriminate against you for exercising your
                    rights.
                  </li>
                  <li>
                    <strong className="text-foreground">Right to appeal</strong>{" "}
                    — if we deny a request, residents of states that provide an
                    appeal right (e.g., Virginia, Colorado, Connecticut) may
                    appeal by replying to our response with the word
                    &quot;Appeal.&quot;
                  </li>
                </ul>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  To exercise any of these rights, email
                  alex@withprecision.ai with your request and the email
                  associated with your account so we can verify your identity.
                  We will respond within the time required by applicable law
                  (generally up to 45 days). We may need additional information
                  to verify your identity before fulfilling a request.
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  If you are an End User of a Customer organization, requests
                  relating to Customer Data should be directed to your
                  organization&apos;s administrator; we will support our
                  Customers in responding to such requests under our
                  subscription agreement.
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  You may use an authorized agent to submit a request on your
                  behalf, subject to our verification of the agent&apos;s
                  authority.
                </p>
              </section>

              <section className="mb-10" id="retention">
                <h2 className="text-2xl font-semibold text-foreground">
                  10. Data Retention
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  We retain personal information for as long as needed to
                  provide the Service and for the legitimate business purposes
                  described in this Policy, unless a longer retention period is
                  required or permitted by law. Typical categories:
                </p>
                <ul className="mt-4 list-disc pl-6 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Active account data</strong>{" "}
                    — for as long as the account is active.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Closed account data
                    </strong>{" "}
                    — generally deleted or de-identified within 90 days of
                    account closure, except as noted below.
                  </li>
                  <li>
                    <strong className="text-foreground">Customer Data</strong> —
                    retained per the subscription agreement; on termination,
                    deleted or returned within approximately 30 days unless
                    otherwise required by law.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Server and security logs
                    </strong>{" "}
                    — typically retained for up to 12 months.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Billing and tax records
                    </strong>{" "}
                    — retained for at least 7 years for tax and audit purposes.
                  </li>
                  <li>
                    <strong className="text-foreground">Backups</strong> — may
                    persist in encrypted form for a limited additional period
                    and will be overwritten in the ordinary course.
                  </li>
                </ul>
              </section>

              <section className="mb-10" id="security">
                <h2 className="text-2xl font-semibold text-foreground">
                  11. Data Security
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  We use commercially reasonable administrative, technical, and
                  organizational safeguards designed to protect personal
                  information, including encryption in transit, role-based
                  access controls, audit logging, and vendor due diligence. No
                  system is perfectly secure, however, and we cannot guarantee
                  the absolute security of any information.
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  If you discover a potential security issue, please contact us
                  promptly at alex@withprecision.ai.
                </p>
              </section>

              <section className="mb-10" id="international">
                <h2 className="text-2xl font-semibold text-foreground">
                  12. International Users
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  The Service is operated in the United States and is intended
                  for users in the United States. If you access the Service
                  from outside the United States, you understand that your
                  personal information will be transferred to, processed, and
                  stored in the United States, where data-protection laws may
                  differ from those in your country.
                </p>
              </section>

              <section className="mb-10" id="children">
                <h2 className="text-2xl font-semibold text-foreground">
                  13. Children&apos;s Privacy
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  The Service is intended for business users and is not
                  directed to children under the age of 18. We do not knowingly
                  collect personal information from children. If you believe we
                  have inadvertently collected such information, contact us at
                  alex@withprecision.ai and we will delete it.
                </p>
              </section>

              <section className="mb-10" id="third-party">
                <h2 className="text-2xl font-semibold text-foreground">
                  14. Third-Party Links and Services
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  The Service may contain links to or integrations with
                  third-party websites, services, or content. We are not
                  responsible for the privacy practices or content of those
                  third parties. We encourage you to review their privacy
                  policies.
                </p>
              </section>

              <section className="mb-10" id="public-content">
                <h2 className="text-2xl font-semibold text-foreground">
                  15. Publicly Visible Content
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Certain parts of the Service may be publicly available,
                  including marketing hub pages, release pages, and related SEO
                  content that we publish on the Marketing Site. This content
                  is intended to be public and may be indexed by search
                  engines. Do not place confidential information in fields you
                  intend to be public.
                </p>
              </section>

              <section className="mb-10" id="changes">
                <h2 className="text-2xl font-semibold text-foreground">
                  16. Changes to This Policy
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  We may update this Policy from time to time. The &quot;Last
                  Updated&quot; date above reflects the most recent revision.
                  If we make material changes, we will provide notice (for
                  example, by email to Customer administrators or by an
                  in-product notification) before the changes take effect.
                </p>
              </section>

              <section id="contact">
                <h2 className="text-2xl font-semibold text-foreground">
                  17. Contact Us
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  If you have questions or requests regarding this Policy,
                  contact us at:
                </p>
                <address className="mt-4 not-italic leading-relaxed text-muted-foreground">
                  Precision AI LLC
                  <br />
                  8401 Mayland Dr, Ste A
                  <br />
                  Richmond, Henrico County, VA 23294
                  <br />
                  United States
                  <br />
                  <a
                    href="mailto:alex@withprecision.ai"
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    alex@withprecision.ai
                  </a>
                </address>
              </section>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
