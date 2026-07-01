import type {
  PublicMarketingHub,
  PublicMarketingReleasePage,
} from "@/lib/public-marketing-api";

const ISO = "2026-04-01T12:00:00.000Z";
const ISO2 = "2026-03-15T10:00:00.000Z";

/** Static copy for `/m/formula/preview/*` — no API calls. */
export const DUMMY_MARKETING_HUB: PublicMarketingHub = {
  marketing_slug: "demo-formula",
  name: "Demo committee score (fixture)",
  key: "alpha_galangal_committee_demo_score",
  hero_image_url: "/images/marketing/formula-hub-hero.svg",
  description:
    "This hub page is loaded from in-repo fixture data. Use it to review layout and styling without a backend.",
  display_formula: "0.3 × factor_a + 0.4 × factor_b + 0.3 × factor_c",
  marketing_settings: {
    cta_key: "Get started (dummy)",
    public_ticker_limit: 5,
    default_sort: "score_desc",
  },
  current_release: {
    id: "rel-fixture-1",
    slug: "demo-release-q1-2026",
    title: "Q1 2026 published picks",
    published_at: ISO,
    as_of: ISO2,
    rows: [
      {
        ticker: "DEMO",
        name: "Demo Corp",
        rank: 1,
        score: 0.87,
        explanation: "Fixture row — not live data.",
      },
      {
        ticker: "SAMP",
        name: "Sample Industries",
        rank: 2,
        score: 0.72,
        explanation: "Another placeholder line for the table.",
      },
    ],
  },
  next_release_at: "2026-07-01T00:00:00.000Z",
  past_releases: [
    {
      slug: "demo-release-fall-2025",
      title: "Fall 2025",
      published_at: "2025-10-01T00:00:00.000Z",
      as_of: "2025-09-30T00:00:00.000Z",
    },
  ],
  extra_field_example: "Shown under “Other fields” on the real hub when the API adds keys.",
};

export const DUMMY_MARKETING_RELEASE: PublicMarketingReleasePage = {
  slug: "demo-release-q1-2026",
  title: "Q1 2026 published picks",
  subtitle: "Fixture release page — not connected to the API",
  body: "This is placeholder body text. In production, the API supplies markdown or plain copy here.\n\n• Bullet one\n• Bullet two",
  hero_image_url: "/images/marketing/formula-release-hero.svg",
  as_of: ISO2,
  published_at: ISO,
  settings_json: {
    theme: "default",
    show_ranks: true,
  },
  parent_formula: {
    name: "Demo committee score (fixture)",
    key: "alpha_galangal_committee_demo_score",
    description: "Parent join is optional; this block mirrors what the public release endpoint can return.",
    marketing_slug: "demo-formula",
  },
  rows: [
    {
      ticker: "DEMO",
      name: "Demo Corp",
      rank: 1,
      score: 0.87,
      explanation: "Fixture row — not live data.",
    },
  ],
  legacy_note: "Extra keys can appear in “Other fields” on the template.",
};
