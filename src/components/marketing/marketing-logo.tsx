import Image from "next/image";
import Link from "next/link";

const LOGO_LIGHT = "/logos/conviction-light-full.svg";
const LOGO_DARK = "/logos/conviction-dark-full.svg";

export function MarketingLogoLink({ className }: { className?: string }) {
  return (
    <Link href="/" className={className}>
      <Image
        src={LOGO_LIGHT}
        alt="Conviction"
        width={220}
        height={46}
        className="h-8 w-auto max-w-[200px] dark:hidden"
        priority
      />
      <Image
        src={LOGO_DARK}
        alt="Conviction"
        width={220}
        height={46}
        className="hidden h-8 w-auto max-w-[200px] dark:block"
        priority
      />
    </Link>
  );
}
