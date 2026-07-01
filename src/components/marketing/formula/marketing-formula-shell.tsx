import { Footer } from "@/components/marketing/footer";
import { Navbar } from "@/components/marketing/navbar";

export function MarketingFormulaShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 border-t border-border/40 bg-background">{children}</main>
      <Footer />
    </div>
  );
}
