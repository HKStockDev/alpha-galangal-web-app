import {
  M_FORMULA_PREVIEW_HUB,
  M_FORMULA_PREVIEW_RELEASE,
} from "@/components/marketing/formula/routes";
import { absolutePublicMarketingUrl } from "@/lib/public-marketing-base-url";
import { SecondaryButton } from "@/components/ui-kit/buttons";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function FormulaMarketingPreviewButtons({ className }: Props) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <SecondaryButton
        type="button"
        size="sm"
        onClick={() => {
          window.open(
            absolutePublicMarketingUrl(M_FORMULA_PREVIEW_HUB),
            "_blank",
            "noopener,noreferrer"
          );
        }}
      >
        Preview public page
      </SecondaryButton>
      <SecondaryButton
        type="button"
        size="sm"
        onClick={() => {
          window.open(
            absolutePublicMarketingUrl(M_FORMULA_PREVIEW_RELEASE),
            "_blank",
            "noopener,noreferrer"
          );
        }}
      >
        Preview release
      </SecondaryButton>
    </div>
  );
}
