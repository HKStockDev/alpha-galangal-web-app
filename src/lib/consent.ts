/**
 * Cookie / tracking consent model. Persisted in localStorage under a versioned key
 * so we can re-prompt users automatically if categories or material policy change.
 */

export const CONSENT_STORAGE_KEY = "conviction.consent.v1";
export const CONSENT_CHANGE_EVENT = "conviction:consent-change";

export type ConsentCategory = "necessary" | "analytics" | "session_replay";

export type ConsentChoices = Record<ConsentCategory, boolean>;

export type ConsentState = {
  /** ISO timestamp of the user's decision; `null` if no decision has been made. */
  decidedAt: string | null;
  /** True when the decision was forced/derived from the Global Privacy Control signal. */
  fromGPC: boolean;
  choices: ConsentChoices;
};

export const ALL_CATEGORIES: ConsentCategory[] = [
  "necessary",
  "analytics",
  "session_replay",
];

export const CATEGORY_LABELS: Record<
  ConsentCategory,
  { title: string; description: string }
> = {
  necessary: {
    title: "Strictly necessary",
    description:
      "Required for the site and app to function — authentication, security, and preference storage. Cannot be disabled.",
  },
  analytics: {
    title: "Analytics",
    description:
      "Helps us understand how visitors use the site so we can improve it. Includes Google Analytics 4 and Vercel Analytics.",
  },
  session_replay: {
    title: "Session replay",
    description:
      "Records anonymized interactions (clicks, scrolls, keystrokes with input masking) to help us debug usability issues. Microsoft Clarity.",
  },
};

export const DEFAULT_CHOICES: ConsentChoices = {
  necessary: true,
  analytics: false,
  session_replay: false,
};

export const ACCEPT_ALL_CHOICES: ConsentChoices = {
  necessary: true,
  analytics: true,
  session_replay: true,
};

export const REJECT_NON_ESSENTIAL_CHOICES: ConsentChoices = {
  necessary: true,
  analytics: false,
  session_replay: false,
};

export function defaultConsentState(): ConsentState {
  return {
    decidedAt: null,
    fromGPC: false,
    choices: { ...DEFAULT_CHOICES },
  };
}

/** True when the visitor's browser is signalling Global Privacy Control. */
export function detectGPC(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true;
}

export function readConsent(): ConsentState {
  if (typeof window === "undefined") return defaultConsentState();
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return defaultConsentState();
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return {
      decidedAt: parsed.decidedAt ?? null,
      fromGPC: parsed.fromGPC === true,
      choices: { ...DEFAULT_CHOICES, ...(parsed.choices ?? {}) },
    };
  } catch {
    return defaultConsentState();
  }
}

export function writeConsent(state: ConsentState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(
      new CustomEvent<ConsentState>(CONSENT_CHANGE_EVENT, { detail: state })
    );
  } catch {
    // Storage may be disabled in private mode; swallow silently — consent stays
    // session-only and the banner will reappear next load.
  }
}
