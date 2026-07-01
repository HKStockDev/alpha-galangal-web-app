export const INVESTOR_SCORE_SLUGS = [
  "buffett",
  "burry",
  "druckenmiller",
  "wood",
  "graham",
  "lynch",
] as const;

export type InvestorScoreSlug = (typeof INVESTOR_SCORE_SLUGS)[number];

export function isInvestorScoreSlug(s: string): s is InvestorScoreSlug {
  return (INVESTOR_SCORE_SLUGS as readonly string[]).includes(s);
}

/**
 * `formulas.key` for admin formula-marketing list — aligned with
 * `WARREN_BUFFETT_FORMULA_KEY` / `BURRY_FORMULA_KEY` / … in
 * `app/admin/dashboard/formulas/page.tsx` (alpha galangal committee score formulas).
 */
export const INVESTOR_SCORE_FORMULA_KEY: Record<InvestorScoreSlug, string> = {
  buffett: "alpha_galangal_committee_buffett_score",
  burry: "alpha_galangal_committee_burry_score",
  druckenmiller: "alpha_galangal_committee_druckenmiller_score",
  wood: "alpha_galangal_committee_wood_score",
  graham: "alpha_galangal_committee_graham_score",
  lynch: "alpha_galangal_committee_lynch_score",
};

type Meta = {
  label: string;
  shortLabel: string;
  iconSrc?: string;
  tintClass: string;
};

export const INVESTOR_META: Record<InvestorScoreSlug, Meta> = {
  buffett: {
    label: "Buffett",
    shortLabel: "WB",
    iconSrc: "/images/investors/buffett.png",
    tintClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  },
  burry: {
    label: "Burry",
    shortLabel: "MB",
    iconSrc: "/images/investors/burry.png",
    tintClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  },
  druckenmiller: {
    label: "Druckenmiller",
    shortLabel: "SD",
    iconSrc: "/images/investors/druckenmiller.png",
    tintClass: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  },
  wood: {
    label: "Wood",
    shortLabel: "CW",
    iconSrc: "/images/investors/wood.png",
    tintClass: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  },
  graham: {
    label: "Graham",
    shortLabel: "BG",
    iconSrc: "/images/investors/graham.png",
    tintClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  lynch: {
    label: "Lynch",
    shortLabel: "PL",
    iconSrc: "/images/investors/lynch.png",
    tintClass: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  },
};
