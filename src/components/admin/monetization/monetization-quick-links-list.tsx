import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MONETIZATION_QUICK_LINKS } from "@/components/admin/monetization/monetization-quick-links";

export function MonetizationQuickLinksList() {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {MONETIZATION_QUICK_LINKS.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="flex items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/60"
          >
            <span>
              <span className="block text-sm font-medium text-foreground">{item.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{item.description}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
