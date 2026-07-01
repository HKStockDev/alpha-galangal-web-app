import Image from "next/image";
import Link from "next/link";
import { MARKETING_LOGO } from "@/lib/brand-logos";

export function MarketingLogoLink({ className }: { className?: string }) {
  return (
    <Link href="/" className={className}>
      <Image
        src={MARKETING_LOGO.light}
        alt="Precision"
        width={220}
        height={46}
        className="h-8 w-auto max-w-[200px] dark:hidden"
        priority
      />
      <Image
        src={MARKETING_LOGO.dark}
        alt="Precision"
        width={220}
        height={46}
        className="hidden h-8 w-auto max-w-[200px] dark:block"
        priority
      />
    </Link>
  );
}
