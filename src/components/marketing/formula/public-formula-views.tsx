import type { ReactNode } from "react";
import Link from "next/link";
import { getPublicAppBaseUrl } from "@/lib/public-app-url";
import {
  formatMarketingDate,
  type PublicMarketingHub,
  type PublicMarketingReleasePage,
} from "@/lib/public-marketing-api";
import { FormulaShareSection } from "./formula-share-section";
import { marketingHubPath, marketingReleasePath } from "./routes";
import { TickerTable } from "./ticker-table";

const HUB_TOP_KEYS = new Set([
  "marketing_slug",
  "name",
  "hero_image_url",
  "description",
  "display_formula",
  "marketing_settings",
  "key",
  "id",
  "current_release",
  "next_release_at",
  "past_releases",
]);

const RELEASE_TOP_KEYS = new Set([
  "title",
  "subtitle",
  "body",
  "hero_image_url",
  "as_of",
  "published_at",
  "settings_json",
  "rows",
  "parent_formula",
  "slug",
  "id",
]);

function extraFromRecord(
  o: object,
  known: Set<string>
): Record<string, unknown> {
  const e: Record<string, unknown> = {};
  for (const k of Object.keys(o)) {
    if (!known.has(k)) e[k] = (o as Record<string, unknown>)[k];
  }
  return e;
}

function JsonDetails({
  label,
  value,
}: {
  label: string;
  value: Record<string, unknown> | null;
}) {
  if (!value || Object.keys(value).length === 0) return null;
  return (
    <details className="rounded-xl border border-border bg-card p-4 text-sm open:shadow-sm">
      <summary className="cursor-pointer text-sm font-medium text-foreground">{label}</summary>
      <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-foreground/90">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
      {children}
    </h2>
  );
}

function Container({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">{children}</div>;
}

function ReadOnlyFormula({ value }: { value: string | null | undefined }) {
  if (value == null || value === "") return <p className="text-sm text-muted-foreground">—</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono text-sm text-foreground">
      {value}
    </div>
  );
}

export function PublicFormulaHubView({
  data,
  marketingSlug,
}: {
  data: PublicMarketingHub;
  marketingSlug: string;
}) {
  const settings = data.marketing_settings ?? {};
  const cta = typeof settings.cta_key === "string" ? settings.cta_key : null;
  const app = getPublicAppBaseUrl();
  const extra = extraFromRecord(data, HUB_TOP_KEYS);
  const cr = data.current_release;

  return (
    <Container>
      {data.hero_image_url ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element -- public URLs from API */}
          <img
            src={data.hero_image_url}
            alt=""
            className="max-h-80 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Marketing hub · {marketingSlug}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {data.name || "Unnamed model"}
        </h1>
        {data.key ? (
          <p className="font-mono text-sm text-muted-foreground">{data.key}</p>
        ) : null}
        {data.description ? (
          <p className="text-pretty text-base text-muted-foreground leading-relaxed">
            {data.description}
          </p>
        ) : null}
        {cta ? (
          <p className="pt-1">
            <a
              href={app}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {cta}
            </a>
          </p>
        ) : null}
      </div>

      {data.display_formula != null && data.display_formula !== "" ? (
        <div>
          <SectionTitle>Display formula</SectionTitle>
          <ReadOnlyFormula value={data.display_formula} />
        </div>
      ) : null}

      <JsonDetails label="Marketing settings" value={data.marketing_settings} />

      <div>
        <SectionTitle>Next release</SectionTitle>
        <p className="text-sm text-muted-foreground">
          {data.next_release_at
            ? formatMarketingDate(data.next_release_at)
            : "Not scheduled in API response (add next_release_at to the hub payload to show a date)."}
        </p>
      </div>

      {cr && cr.rows && cr.rows.length > 0 ? (
        <div>
          <SectionTitle>Current published tickers</SectionTitle>
          <p className="mb-3 text-sm text-muted-foreground">
            Latest published release
            {cr.title ? ` — ${cr.title}` : ""} · as of {formatMarketingDate(cr.as_of)} ·
            published {formatMarketingDate(cr.published_at)}
            {cr.slug ? (
              <>
                {" "}
                (
                <Link
                  className="text-primary underline-offset-2 hover:underline"
                  href={marketingReleasePath(cr.slug)}
                >
                  view as release
                </Link>
                )
              </>
            ) : null}
          </p>
          <TickerTable rows={cr.rows} />
        </div>
      ) : (
        <div>
          <SectionTitle>Current published tickers</SectionTitle>
          <p className="text-sm text-muted-foreground">
            No current release with rows returned for this model.
          </p>
        </div>
      )}

      {data.past_releases && data.past_releases.length > 0 ? (
        <div>
          <SectionTitle>Past releases</SectionTitle>
          <ul className="space-y-2">
            {data.past_releases.map((r) => (
              <li key={r.slug}>
                <Link
                  href={marketingReleasePath(r.slug)}
                  className="block rounded-xl border border-border/80 bg-card px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium text-foreground">{r.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {r.slug} · as of {formatMarketingDate(r.as_of)} · published{" "}
                    {formatMarketingDate(r.published_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <SectionTitle>Past releases</SectionTitle>
          <p className="text-sm text-muted-foreground">No past releases in this response.</p>
        </div>
      )}

      {Object.keys(extra).length > 0 ? <JsonDetails label="Other fields (raw)" value={extra} /> : null}

      <FormulaShareSection shareTitle={data.name || "Conviction model"} className="mt-2" />
    </Container>
  );
}

export function PublicFormulaReleaseView({ data }: { data: PublicMarketingReleasePage }) {
  const parent = data.parent_formula;
  const extra = extraFromRecord(data, RELEASE_TOP_KEYS);
  return (
    <Container>
      {data.hero_image_url ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.hero_image_url}
            alt=""
            className="max-h-80 w-full object-cover"
          />
        </div>
      ) : null}

      <header className="space-y-2">
        <p className="text-xs text-muted-foreground">Marketing release {data.slug ? `· ${data.slug}` : null}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {data.title || "Release"}
        </h1>
        {data.subtitle ? (
          <p className="text-lg text-muted-foreground">{data.subtitle}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          as of {formatMarketingDate(data.as_of)} · published {formatMarketingDate(data.published_at)}
        </p>
      </header>

      {parent ? (
        <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground">Formula</p>
          <p className="mt-1 font-medium text-foreground">{parent.name}</p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{parent.key}</p>
          {parent.description ? (
            <p className="mt-2 text-muted-foreground">{parent.description}</p>
          ) : null}
          {parent.marketing_slug ? (
            <p className="mt-2">
              <Link
                className="text-sm text-primary underline-offset-2 hover:underline"
                href={marketingHubPath(parent.marketing_slug)}
              >
                Open hub
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      {data.body != null && data.body !== "" ? (
        <div>
          <SectionTitle>Body</SectionTitle>
          <div className="prose prose-neutral dark:prose-invert max-w-none text-base text-foreground/90 [white-space:pre-wrap]">
            {data.body}
          </div>
        </div>
      ) : null}

      <JsonDetails label="Settings (settings_json)" value={data.settings_json} />

      <div>
        <SectionTitle>Tickers</SectionTitle>
        <TickerTable rows={data.rows ?? []} />
      </div>

      {Object.keys(extra).length > 0 ? <JsonDetails label="Other fields (raw)" value={extra} /> : null}

      <FormulaShareSection
        shareTitle={data.title || "Marketing release"}
        className="mt-2"
      />
    </Container>
  );
}
