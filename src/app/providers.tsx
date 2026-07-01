"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/auth-context";
import { ToastProvider } from "@/context/toast-context";
import { ConsentProvider } from "@/components/consent/consent-provider";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { AnalyticsScripts } from "@/components/consent/analytics-scripts";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <AuthProvider>
        <ToastProvider>
          <ConsentProvider>
            {children}
            <CookieBanner />
            <AnalyticsScripts />
            <Toaster />
          </ConsentProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
