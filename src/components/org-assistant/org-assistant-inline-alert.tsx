"use client";

import Link from "next/link";
import { ORG_BILLING_SETTINGS_PATH } from "@/lib/billing-plans";
import type { AssistantSendErrorKind } from "./org-assistant-api-errors";

type Props = {
  kind: AssistantSendErrorKind | null;
  message: string | null;
};

export function OrgAssistantInlineAlert({ kind, message }: Props) {
  if (!message || !kind || kind === "generic") {
    if (!message) return null;
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
        {message}
      </p>
    );
  }

  const showBilling = kind === "billing";
  const showCredits = kind === "credits";

  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
    >
      <p>{message}</p>
      <div className="mt-2 flex flex-wrap gap-3">
        {showBilling ? (
          <Link href={ORG_BILLING_SETTINGS_PATH} className="font-medium underline">
            Billing settings
          </Link>
        ) : null}
        {showCredits ? (
          <Link
            href={`${ORG_BILLING_SETTINGS_PATH}`}
            className="font-medium underline"
          >
            Buy credits
          </Link>
        ) : null}
      </div>
    </div>
  );
}
