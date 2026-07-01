"use client";

import Script from "next/script";
import { useConsent } from "./consent-provider";
import { useIsAppHost } from "@/lib/use-is-app-host";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

/**
 * Loads non-essential analytics scripts only after the visitor has granted
 * consent for the relevant category. Strictly necessary cookies — and any
 * first-party/cookieless metrics handled elsewhere — are not gated here.
 *
 * GA4 and Clarity are marketing-site tools; we don't fire them inside the
 * authenticated app even if the env vars are set.
 */
export function AnalyticsScripts() {
  const { hydrated, isEnabled } = useConsent();
  const isApp = useIsAppHost();
  if (!hydrated || isApp) return null;

  const allowAnalytics = isEnabled("analytics");
  const allowSessionReplay = isEnabled("session_replay");

  return (
    <>
      {allowAnalytics && GA_ID ? (
        <>
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}

      {allowSessionReplay && CLARITY_ID ? (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}
        </Script>
      ) : null}
    </>
  );
}
