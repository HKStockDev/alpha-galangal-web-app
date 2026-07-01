"use client";

import * as React from "react";
import {
  ACCEPT_ALL_CHOICES,
  CONSENT_CHANGE_EVENT,
  type ConsentCategory,
  type ConsentChoices,
  type ConsentState,
  DEFAULT_CHOICES,
  REJECT_NON_ESSENTIAL_CHOICES,
  defaultConsentState,
  detectGPC,
  readConsent,
  writeConsent,
} from "@/lib/consent";

type ConsentContextValue = {
  state: ConsentState;
  /** Has the user (or GPC) made an explicit decision yet? */
  decided: boolean;
  /** True while we hydrate from localStorage on mount; avoids SSR flash. */
  hydrated: boolean;
  /** True when the visitor's browser is sending Global Privacy Control. */
  gpcActive: boolean;
  /** Banner visibility. The dialog can also force-open it via `openManageDialog`. */
  isBannerOpen: boolean;
  isManageOpen: boolean;
  openManageDialog: () => void;
  closeManageDialog: () => void;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePartial: (next: ConsentChoices) => void;
  /** Convenience accessor for a single category. */
  isEnabled: (category: ConsentCategory) => boolean;
};

const ConsentContext = React.createContext<ConsentContextValue | null>(null);

export function useConsent(): ConsentContextValue {
  const ctx = React.useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return ctx;
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConsentState>(() => defaultConsentState());
  const [hydrated, setHydrated] = React.useState(false);
  const [gpcActive, setGpcActive] = React.useState(false);
  const [isManageOpen, setIsManageOpen] = React.useState(false);

  React.useEffect(() => {
    const stored = readConsent();
    const gpc = detectGPC();
    setGpcActive(gpc);

    if (stored.decidedAt) {
      setState(stored);
    } else if (gpc) {
      // Respect GPC: treat as a "reject non-essential" decision without nagging.
      const auto: ConsentState = {
        decidedAt: new Date().toISOString(),
        fromGPC: true,
        choices: { ...REJECT_NON_ESSENTIAL_CHOICES },
      };
      writeConsent(auto);
      setState(auto);
    } else {
      setState({ ...defaultConsentState(), choices: { ...DEFAULT_CHOICES } });
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    function onExternalChange(event: Event) {
      const detail = (event as CustomEvent<ConsentState>).detail;
      if (detail) setState(detail);
    }
    window.addEventListener(CONSENT_CHANGE_EVENT, onExternalChange);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onExternalChange);
  }, []);

  const persist = React.useCallback((next: ConsentState) => {
    setState(next);
    writeConsent(next);
  }, []);

  const acceptAll = React.useCallback(() => {
    persist({
      decidedAt: new Date().toISOString(),
      fromGPC: false,
      choices: { ...ACCEPT_ALL_CHOICES },
    });
    setIsManageOpen(false);
  }, [persist]);

  const rejectNonEssential = React.useCallback(() => {
    persist({
      decidedAt: new Date().toISOString(),
      fromGPC: false,
      choices: { ...REJECT_NON_ESSENTIAL_CHOICES },
    });
    setIsManageOpen(false);
  }, [persist]);

  const savePartial = React.useCallback(
    (next: ConsentChoices) => {
      persist({
        decidedAt: new Date().toISOString(),
        fromGPC: false,
        choices: { ...next, necessary: true },
      });
      setIsManageOpen(false);
    },
    [persist]
  );

  const value = React.useMemo<ConsentContextValue>(
    () => ({
      state,
      decided: state.decidedAt != null,
      hydrated,
      gpcActive,
      isBannerOpen: hydrated && state.decidedAt == null,
      isManageOpen,
      openManageDialog: () => setIsManageOpen(true),
      closeManageDialog: () => setIsManageOpen(false),
      acceptAll,
      rejectNonEssential,
      savePartial,
      isEnabled: (category) => state.choices[category] === true,
    }),
    [state, hydrated, gpcActive, isManageOpen, acceptAll, rejectNonEssential, savePartial]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}
