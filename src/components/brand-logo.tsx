import { cn } from "@/lib/utils";
import { brandLogoSrc, type BrandLogoVariant } from "@/lib/brand-logos";

export function BrandLogo({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  const variant: BrandLogoVariant = collapsed ? "collapsed" : "full";

  return (
    <>
      <img
        src={brandLogoSrc("light", variant)}
        alt="Precision"
        className={cn(
          "h-auto w-auto max-w-none dark:hidden",
          collapsed ? "max-h-7" : "max-h-10",
          className
        )}
        width={collapsed ? 28 : 220}
        height={collapsed ? 28 : 46}
        loading="eager"
        decoding="async"
      />
      <img
        src={brandLogoSrc("dark", variant)}
        alt="Precision"
        className={cn(
          "hidden h-auto w-auto max-w-none dark:block",
          collapsed ? "max-h-7" : "max-h-10",
          className
        )}
        width={collapsed ? 28 : 220}
        height={collapsed ? 28 : 46}
        loading="eager"
        decoding="async"
      />
    </>
  );
}
