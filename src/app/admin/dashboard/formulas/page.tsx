"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { ADMIN_DASHBOARD } from "@/lib/auth-routing";
import { useToast } from "@/context/toast-context";
import {
  getHedgeFundQualityScoreFormula,
  updateHedgeFundQualityScoreWeights,
  calculateHedgeFundQualityScores,
  getFundamentalConstrictionScoreFormula,
  updateFundamentalConstrictionScoreWeights,
  calculateFundamentalConstrictionScores,
  getPoliticalScoreFormula,
  updatePoliticalScoreWeights,
  calculatePoliticalScores,
  getAlphaGalangalCommitteeWeights,
  updateAlphaGalangalCommitteeWeights,
  getAlphaGalangalCommitteeActivePrompt,
  updateAlphaGalangalCommitteeActivePrompt,
  getFormulaPromptVersions,
  patchFormulaPromptVersion,
  fetchMyOrganizations,
  listOrganizationEquities,
  runMarketContentClassifierPreview,
  getTaxonomyStructuralGrowthStatus,
  testTaxonomyStructuralGrowthGemini,
  runTaxonomyStructuralGrowth,
  syncTaxonomyStructuralGrowthCagrScores,
  getStructuralGrowthCagrScoreFormula,
  updateStructuralGrowthCagrScoreWeights,
  type FormulaPromptVersionRow,
  type FormulaWeights,
  type FormulaComponent,
  type FundamentalConstrictionFormulaWeights,
  type PoliticalScoreFormulaWeights,
  type StructuralGrowthCagrFormulaWeights,
  type AlphaGalangalCommitteeWeights,
  type AlphaGalangalCommitteeActivePrompt,
  type MyOrganization,
  type OrgEquityRow,
  type MarketContentClassifierPreviewResult,
} from "@/lib/api";
import { ConfirmSaveModal } from "@/components/formulas/confirm-save-modal";
import { ConfirmUpdateScoresModal } from "@/components/formulas/confirm-update-scores-modal";
import { Spinner } from "@/components/ui/spinner";
import {
  DEFAULT_NET_EXPOSURE_DIRECTION_WEIGHTS,
  readNetExposureDirectionWeights,
  writeNetExposureDirectionWeights,
} from "@/lib/net-exposure-direction-weights";
import { InsiderPrecisionTab } from "./insider-precision-tab";

type TabId =
  | "hedge-fund-quality"
  | "fundamental-constriction"
  | "political-score"
  | "insider-precision"
  | "warren-buffett-score"
  | "burry-score"
  | "druckenmiller-score"
  | "wood-score"
  | "graham-score"
  | "lynch-score"
  | "events-news-classifier"
  | "net-exposure"
  | "alpha-galangal-weights"
  | "alpha-galangal-prompt"
  | "taxonomy-structural-growth";

const WEIGHT_ORDER: (keyof FormulaWeights)[] = [
  "hedge_fund_performance",
  "hedge_fund_risk",
  "hedge_fund_precision",
  "hedge_fund_institutional_strength",
  "hedge_fund_positioning",
];

const LABELS: Record<keyof FormulaWeights, string> = {
  hedge_fund_performance: "hedge_fund_performance",
  hedge_fund_risk: "hedge_fund_risk",
  hedge_fund_precision: "hedge_fund_precision",
  hedge_fund_institutional_strength: "hedge_fund_institutional_strength",
  hedge_fund_positioning: "hedge_fund_positioning",
};

const FC_WEIGHT_ORDER: (keyof FundamentalConstrictionFormulaWeights)[] = [
  "fc_earnings_acceleration_pct",
  "fc_margin_expansion_pct",
  "fc_roic_improvement_pct",
  "fc_valuation_compression_pct",
  "fc_balance_sheet_strength_pct",
];

const PS_WEIGHT_ORDER: (keyof PoliticalScoreFormulaWeights)[] = [
  "ps_committee_relevance_pct",
  "ps_trade_size_pct",
  "ps_recency_pct",
  "ps_influence_pct",
  "ps_cluster_pct",
];

const ALPHA_GALANGAL_WEIGHT_ORDER: (keyof AlphaGalangalCommitteeWeights)[] = [
  "buffett",
  "burry",
  "druckenmiller",
  "wood",
  "graham",
  "lynch",
];

const DEFAULT_ALPHA_GALANGAL_WEIGHTS: AlphaGalangalCommitteeWeights = {
  buffett: 0.2,
  burry: 0.15,
  druckenmiller: 0.2,
  wood: 0.1,
  graham: 0.15,
  lynch: 0.2,
};

function formatWeight(w: number): string {
  return w.toFixed(2);
}

function formulaDisplay(weights: FormulaWeights): string {
  return WEIGHT_ORDER.map(
    (k) => `${formatWeight(weights[k])} * ${LABELS[k]}`
  ).join(" + ");
}

function sumWeights(weights: FormulaWeights): number {
  return WEIGHT_ORDER.reduce((s, k) => s + weights[k], 0);
}

function sumAlphaGalangalWeights(weights: AlphaGalangalCommitteeWeights): number {
  return ALPHA_GALANGAL_WEIGHT_ORDER.reduce((s, k) => s + weights[k], 0);
}

function validateWeights(weights: FormulaWeights): string[] {
  const errors: string[] = [];
  const sum = sumWeights(weights);
  const tolerance = 0.0001;
  if (sum > 1) errors.push("Sum of weights must not exceed 1");
  if (Math.abs(sum - 1) > tolerance) errors.push("Sum of weights must equal 1");
  return errors;
}

function validateAlphaGalangalWeights(
  weights: AlphaGalangalCommitteeWeights
): string[] {
  const errors: string[] = [];
  const sum = sumAlphaGalangalWeights(weights);
  const tolerance = 0.0001;
  if (sum > 1) errors.push("Sum of weights must not exceed 1");
  if (Math.abs(sum - 1) > tolerance) errors.push("Sum of weights must equal 1");
  return errors;
}

function sumFcWeights(weights: FundamentalConstrictionFormulaWeights): number {
  return FC_WEIGHT_ORDER.reduce((s, k) => s + weights[k], 0);
}

function validateFcWeights(weights: FundamentalConstrictionFormulaWeights): string[] {
  const errors: string[] = [];
  const sum = sumFcWeights(weights);
  const tolerance = 0.0001;
  if (sum > 1) errors.push("Sum of weights must not exceed 1");
  if (Math.abs(sum - 1) > tolerance) errors.push("Sum of weights must equal 1");
  return errors;
}

function sumPsWeights(weights: PoliticalScoreFormulaWeights): number {
  return PS_WEIGHT_ORDER.reduce((s, k) => s + weights[k], 0);
}

function validatePsWeights(weights: PoliticalScoreFormulaWeights): string[] {
  const errors: string[] = [];
  const sum = sumPsWeights(weights);
  const tolerance = 0.0001;
  if (sum > 1) errors.push("Sum of weights must not exceed 1");
  if (Math.abs(sum - 1) > tolerance) errors.push("Sum of weights must equal 1");
  return errors;
}

const SG_CAGR_WEIGHT_ORDER: (keyof StructuralGrowthCagrFormulaWeights)[] = [
  "sg_cagr_score_3y",
  "sg_cagr_score_5y",
  "sg_cagr_score_10y",
];

function sumSgCagrWeights(weights: StructuralGrowthCagrFormulaWeights): number {
  return SG_CAGR_WEIGHT_ORDER.reduce((s, k) => s + weights[k], 0);
}

function validateSgCagrWeights(weights: StructuralGrowthCagrFormulaWeights): string[] {
  const errors: string[] = [];
  const sum = sumSgCagrWeights(weights);
  const tolerance = 0.0001;
  if (sum > 1) errors.push("Sum of weights must not exceed 1");
  if (Math.abs(sum - 1) > tolerance) errors.push("Sum of weights must equal 1");
  return errors;
}

function HedgeFundQualityTab({
  accessToken,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [weights, setWeights] = useState<FormulaWeights | null>(null);
  const [savedWeights, setSavedWeights] = useState<FormulaWeights | null>(null);
  const [components, setComponents] = useState<
    Record<string, FormulaComponent>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showUpdateScoresModal, setShowUpdateScoresModal] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastCalculationResult, setLastCalculationResult] = useState<{
    entitiesProcessed: number;
    top5: { filer: string; filerId: number; score: number; rank: number }[];
  } | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getHedgeFundQualityScoreFormula(accessToken)
      .then((res) => {
        if (res.formula?.definition?.weights) {
          setWeights(res.formula.definition.weights);
          setSavedWeights(res.formula.definition.weights);
        }
        setComponents(res.components ?? {});
      })
      .catch(() => showError("Failed to load formula"))
      .finally(() => setIsLoading(false));
  }, [accessToken, showError]);

  function handleWeightChange(key: keyof FormulaWeights, value: number) {
    setWeights((prev) => prev && { ...prev, [key]: value });
  }

  function handleSaveClick() {
    if (!weights) return;
    const errors = validateWeights(weights);
    if (errors.length > 0) {
      errors.forEach((e) => showError(e));
      return;
    }
    setShowConfirmModal(true);
  }

  function handleConfirm() {
    if (!weights || !accessToken) return;
    const errors = validateWeights(weights);
    if (errors.length > 0) return;
    setIsSaving(true);
    updateHedgeFundQualityScoreWeights(weights, accessToken)
      .then((updated) => {
        setSavedWeights(updated.definition.weights);
        setShowConfirmModal(false);
        setJustSaved(true);
        setLastCalculationResult(null);
        showSuccess("Formula saved successfully");
      })
      .catch((err) => {
        showError(err instanceof Error ? err.message : "Save failed");
      })
      .finally(() => setIsSaving(false));
  }

  function handleConfirmUpdateScores() {
    if (!accessToken) return;
    setIsCalculating(true);
    calculateHedgeFundQualityScores(accessToken)
      .then((data) => {
        setShowUpdateScoresModal(false);
        setJustSaved(false);
        setLastCalculationResult(data);
        showSuccess(
          `Recalculated scores for ${data.entitiesProcessed} hedge funds`
        );
      })
      .catch((err) => {
        showError(
          err instanceof Error ? err.message : "Score calculation failed"
        );
      })
      .finally(() => setIsCalculating(false));
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!weights) {
    return (
      <p className="text-muted-foreground">
        Formula not found or failed to load.
      </p>
    );
  }

  const validationErrors = validateWeights(weights);
  const hasValidationErrors = validationErrors.length > 0;
  const hasChanges =
    savedWeights &&
    WEIGHT_ORDER.some((k) => Math.abs(weights[k] - savedWeights[k]) > 0.0001);
  const canSave = hasChanges && !hasValidationErrors;
  const currentSum = sumWeights(weights);

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-foreground">
          Formula
        </h2>
        <p className="font-mono text-sm text-foreground">
          {formulaDisplay(weights)}
        </p>

        {hasValidationErrors && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Validation errors
            </p>
            <ul className="mt-1 list-inside list-disc text-sm text-red-700 dark:text-red-300">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Current sum: {currentSum.toFixed(2)}
            </p>
          </div>
        )}

        <h2 className="mt-8 mb-4 text-sm font-medium text-foreground">
          Weights
        </h2>
        <div className="space-y-6">
          {WEIGHT_ORDER.map((key) => {
            const comp = components[key];
            return (
              <div
                key={key}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor={key}
                    className="font-mono text-sm font-medium text-foreground"
                  >
                    {LABELS[key]}
                  </label>
                  <input
                    id={key}
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={weights[key]}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!Number.isNaN(v)) handleWeightChange(key, v);
                    }}
                    className={`w-24 rounded-lg border px-3 py-2 text-right text-sm dark:bg-input/30 ${
                      hasValidationErrors
                        ? "border-red-300 dark:border-red-800"
                        : "border-input"
                    } text-foreground`}
                  />
                </div>
                {comp?.display_formula && (
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    {comp.display_formula}
                  </p>
                )}
                {comp?.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {comp.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSaveClick}
          disabled={!canSave || isSaving}
          className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>

        {justSaved && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              Formula saved. Recalculate all hedge fund quality scores?
            </p>
            <button
              type="button"
              onClick={() => setShowUpdateScoresModal(true)}
              className="mt-3 flex h-9 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              Update scores
            </button>
          </div>
        )}

        {lastCalculationResult && (
          <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm font-medium text-foreground">
              Last calculation: {lastCalculationResult.entitiesProcessed} hedge
              funds processed
            </p>
            {lastCalculationResult.top5.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Top 5:{" "}
                {lastCalculationResult.top5
                  .map(
                    (t) =>
                      `${t.filer} (score: ${t.score.toFixed(1)}, rank ${t.rank})`
                  )
                  .join("; ")}
              </p>
            )}
          </div>
        )}
      </div>

      <ConfirmSaveModal
        isOpen={showConfirmModal}
        isSaving={isSaving}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirmModal(false)}
      />

      <ConfirmUpdateScoresModal
        isOpen={showUpdateScoresModal}
        isCalculating={isCalculating}
        onConfirm={handleConfirmUpdateScores}
        onCancel={() => setShowUpdateScoresModal(false)}
      />
    </>
  );
}

function FundamentalConstrictionTab({
  accessToken,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [weights, setWeights] =
    useState<FundamentalConstrictionFormulaWeights | null>(null);
  const [savedWeights, setSavedWeights] =
    useState<FundamentalConstrictionFormulaWeights | null>(null);
  const [components, setComponents] = useState<
    Record<string, FormulaComponent>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showUpdateScoresModal, setShowUpdateScoresModal] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getFundamentalConstrictionScoreFormula(accessToken)
      .then((res) => {
        const w = res.formula?.definition?.weights as
          | FundamentalConstrictionFormulaWeights
          | undefined;
        if (w) {
          setWeights(w);
          setSavedWeights(w);
        }
        setComponents(res.components ?? {});
      })
      .catch(() => showError("Failed to load formula"))
      .finally(() => setIsLoading(false));
  }, [accessToken, showError]);

  function handleWeightChange(
    key: keyof FundamentalConstrictionFormulaWeights,
    value: number
  ) {
    setWeights((prev) => prev && { ...prev, [key]: value });
  }

  function handleSaveClick() {
    if (!weights) return;
    const errors = validateFcWeights(weights);
    if (errors.length > 0) {
      errors.forEach((e) => showError(e));
      return;
    }
    setShowConfirmModal(true);
  }

  function handleConfirm() {
    if (!weights || !accessToken) return;
    setIsSaving(true);
    updateFundamentalConstrictionScoreWeights(weights, accessToken)
      .then((updated) => {
        if (updated?.definition?.weights) {
          const w = updated.definition.weights as FundamentalConstrictionFormulaWeights;
          setSavedWeights(w);
        }
        setShowConfirmModal(false);
        setJustSaved(true);
        showSuccess("Formula saved successfully");
      })
      .catch((err) => {
        showError(err instanceof Error ? err.message : "Save failed");
      })
      .finally(() => setIsSaving(false));
  }

  function handleConfirmRecalc() {
    if (!accessToken) return;
    setIsCalculating(true);
    calculateFundamentalConstrictionScores(accessToken)
      .then((data) => {
        setShowUpdateScoresModal(false);
        setJustSaved(false);
        showSuccess(
          `Recalculated fundamental constriction scores (${data.scoresWritten} written)`
        );
      })
      .catch((err) => {
        showError(
          err instanceof Error ? err.message : "Score calculation failed"
        );
      })
      .finally(() => setIsCalculating(false));
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!weights) {
    return (
      <p className="text-muted-foreground">
        Formula not found or failed to load.
      </p>
    );
  }

  const validationErrors = validateFcWeights(weights);
  const hasValidationErrors = validationErrors.length > 0;
  const hasChanges =
    savedWeights &&
    FC_WEIGHT_ORDER.some(
      (k) => Math.abs(weights[k] - savedWeights[k]) > 0.0001
    );
  const canSave = hasChanges && !hasValidationErrors;
  const currentSum = sumFcWeights(weights);

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-foreground">Formula</h2>
        <p className="font-mono text-xs leading-relaxed text-foreground">
          Percentile blend: EA (earnings acceleration), ME (margin), ROIC, VC
          (valuation compression), BS (balance sheet). Final score uses these
          weights on cross-sectional percentiles.
        </p>

        {hasValidationErrors && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Validation errors
            </p>
            <ul className="mt-1 list-inside list-disc text-sm text-red-700 dark:text-red-300">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Current sum: {currentSum.toFixed(2)}
            </p>
          </div>
        )}

        <h2 className="mt-8 mb-4 text-sm font-medium text-foreground">
          Weights
        </h2>
        <div className="space-y-6">
          {FC_WEIGHT_ORDER.map((key) => {
            const comp = components[key];
            return (
              <div
                key={key}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor={key}
                    className="font-mono text-sm font-medium text-foreground"
                  >
                    {key}
                  </label>
                  <input
                    id={key}
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={weights[key]}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!Number.isNaN(v)) handleWeightChange(key, v);
                    }}
                    className={`w-24 rounded-lg border px-3 py-2 text-right text-sm dark:bg-input/30 ${
                      hasValidationErrors
                        ? "border-red-300 dark:border-red-800"
                        : "border-input"
                    } text-foreground`}
                  />
                </div>
                {comp?.display_formula && (
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    {comp.display_formula}
                  </p>
                )}
                {comp?.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {comp.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSaveClick}
          disabled={!canSave || isSaving}
          className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>

        {justSaved && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              Formula saved. Saving also triggers a full recalculation on the
              server. Run again here if needed.
            </p>
            <button
              type="button"
              onClick={() => setShowUpdateScoresModal(true)}
              className="mt-3 flex h-9 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              Recalculate scores
            </button>
          </div>
        )}
      </div>

      <ConfirmSaveModal
        isOpen={showConfirmModal}
        isSaving={isSaving}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirmModal(false)}
      />

      <ConfirmUpdateScoresModal
        isOpen={showUpdateScoresModal}
        isCalculating={isCalculating}
        onConfirm={handleConfirmRecalc}
        onCancel={() => setShowUpdateScoresModal(false)}
        title="Recalculate fundamental constriction scores?"
        description="This runs the full fundamental constriction pipeline for active securities with entity links. It may take several minutes."
      />
    </>
  );
}

function PoliticalScoreTab({
  accessToken,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [weights, setWeights] = useState<PoliticalScoreFormulaWeights | null>(
    null
  );
  const [savedWeights, setSavedWeights] =
    useState<PoliticalScoreFormulaWeights | null>(null);
  const [components, setComponents] = useState<
    Record<string, FormulaComponent>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showUpdateScoresModal, setShowUpdateScoresModal] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getPoliticalScoreFormula(accessToken)
      .then((res) => {
        const w = res.formula?.definition?.weights as
          | PoliticalScoreFormulaWeights
          | undefined;
        if (w) {
          setWeights(w);
          setSavedWeights(w);
        }
        setComponents(res.components ?? {});
      })
      .catch(() => showError("Failed to load formula"))
      .finally(() => setIsLoading(false));
  }, [accessToken, showError]);

  function handleWeightChange(
    key: keyof PoliticalScoreFormulaWeights,
    value: number
  ) {
    setWeights((prev) => prev && { ...prev, [key]: value });
  }

  function handleSaveClick() {
    if (!weights) return;
    const errors = validatePsWeights(weights);
    if (errors.length > 0) {
      errors.forEach((e) => showError(e));
      return;
    }
    setShowConfirmModal(true);
  }

  function handleConfirm() {
    if (!weights || !accessToken) return;
    setIsSaving(true);
    updatePoliticalScoreWeights(weights, accessToken)
      .then((updated) => {
        if (updated?.definition?.weights) {
          const w = updated.definition.weights as PoliticalScoreFormulaWeights;
          setSavedWeights(w);
        }
        setShowConfirmModal(false);
        setJustSaved(true);
        showSuccess("Formula saved successfully");
      })
      .catch((err) => {
        showError(err instanceof Error ? err.message : "Save failed");
      })
      .finally(() => setIsSaving(false));
  }

  function handleConfirmRecalc() {
    if (!accessToken) return;
    setIsCalculating(true);
    calculatePoliticalScores(accessToken)
      .then((data) => {
        setShowUpdateScoresModal(false);
        setJustSaved(false);
        showSuccess(
          `Political scores recalculated (${data.scoresWritten} scores written, ${data.tradesSynced} trades synced)`
        );
      })
      .catch((err) => {
        showError(
          err instanceof Error ? err.message : "Score calculation failed"
        );
      })
      .finally(() => setIsCalculating(false));
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!weights) {
    return (
      <p className="text-muted-foreground">
        Formula not found or failed to load.
      </p>
    );
  }

  const validationErrors = validatePsWeights(weights);
  const hasValidationErrors = validationErrors.length > 0;
  const hasChanges =
    savedWeights &&
    PS_WEIGHT_ORDER.some(
      (k) => Math.abs(weights[k] - savedWeights[k]) > 0.0001
    );
  const canSave = hasChanges && !hasValidationErrors;
  const currentSum = sumPsWeights(weights);

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-foreground">Formula</h2>
        <p className="font-mono text-xs leading-relaxed text-foreground">
          Per-trade score blends CR (committee relevance), TS (trade size), R
          (recency), I (influence), C (cluster). Stock score aggregates buy vs
          sell pressure from those trade scores.
        </p>

        {hasValidationErrors && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Validation errors
            </p>
            <ul className="mt-1 list-inside list-disc text-sm text-red-700 dark:text-red-300">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Current sum: {currentSum.toFixed(2)}
            </p>
          </div>
        )}

        <h2 className="mt-8 mb-4 text-sm font-medium text-foreground">
          Weights
        </h2>
        <div className="space-y-6">
          {PS_WEIGHT_ORDER.map((key) => {
            const comp = components[key];
            return (
              <div
                key={key}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor={`ps-${key}`}
                    className="font-mono text-sm font-medium text-foreground"
                  >
                    {key}
                  </label>
                  <input
                    id={`ps-${key}`}
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={weights[key]}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!Number.isNaN(v)) handleWeightChange(key, v);
                    }}
                    className={`w-24 rounded-lg border px-3 py-2 text-right text-sm dark:bg-input/30 ${
                      hasValidationErrors
                        ? "border-red-300 dark:border-red-800"
                        : "border-input"
                    } text-foreground`}
                  />
                </div>
                {comp?.display_formula && (
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    {comp.display_formula}
                  </p>
                )}
                {comp?.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {comp.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSaveClick}
          disabled={!canSave || isSaving}
          className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>

        {justSaved && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              Formula saved. Saving also triggers a full recalculation on the
              server. Run again here if needed.
            </p>
            <button
              type="button"
              onClick={() => setShowUpdateScoresModal(true)}
              className="mt-3 flex h-9 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              Recalculate scores
            </button>
          </div>
        )}
      </div>

      <ConfirmSaveModal
        isOpen={showConfirmModal}
        isSaving={isSaving}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirmModal(false)}
      />

      <ConfirmUpdateScoresModal
        isOpen={showUpdateScoresModal}
        isCalculating={isCalculating}
        onConfirm={handleConfirmRecalc}
        onCancel={() => setShowUpdateScoresModal(false)}
        title="Recalculate political scores?"
        description="This syncs congressional trades from FMP and recomputes political scores for active securities. It may take several minutes."
      />
    </>
  );
}

const NE_DIRECTION_KEYS = [
  "beneficiary",
  "supplier",
  "customer",
  "dependent",
] as const;

type NeDirectionKey = (typeof NE_DIRECTION_KEYS)[number];

function NetExposureDirectionWeightsTab({
  showSuccess,
  showError,
}: {
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const defaults = DEFAULT_NET_EXPOSURE_DIRECTION_WEIGHTS;
  const [weightStrings, setWeightStrings] = useState(() => {
    const w = readNetExposureDirectionWeights();
    return {
      beneficiary: String(w.beneficiary),
      supplier: String(w.supplier),
      customer: String(w.customer),
      dependent: String(w.dependent),
    };
  });

  function parseWeight(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  }

  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    for (const key of NE_DIRECTION_KEYS) {
      if (parseWeight(weightStrings[key]) === null) {
        errs.push(`${key}: enter a valid number ≥ 0`);
      }
    }
    return errs;
  }, [weightStrings]);

  const hasValidationErrors = validationErrors.length > 0;
  const canSave = !hasValidationErrors;

  function handleSaveWeights() {
    const beneficiary = parseWeight(weightStrings.beneficiary);
    const supplier = parseWeight(weightStrings.supplier);
    const customer = parseWeight(weightStrings.customer);
    const dependent = parseWeight(weightStrings.dependent);
    if (
      beneficiary === null ||
      supplier === null ||
      customer === null ||
      dependent === null
    ) {
      showError("Each direction weight must be a valid number ≥ 0.");
      return;
    }
    writeNetExposureDirectionWeights({
      beneficiary,
      supplier,
      customer,
      dependent,
    });
    setWeightStrings({
      beneficiary: String(beneficiary),
      supplier: String(supplier),
      customer: String(customer),
      dependent: String(dependent),
    });
    showSuccess("Net exposure direction weights saved. They apply on the next Net exposure run.");
  }

  function handleResetDefaults() {
    writeNetExposureDirectionWeights({
      beneficiary: defaults.beneficiary!,
      supplier: defaults.supplier!,
      customer: defaults.customer!,
      dependent: defaults.dependent!,
    });
    setWeightStrings({
      beneficiary: String(defaults.beneficiary),
      supplier: String(defaults.supplier),
      customer: String(defaults.customer),
      dependent: String(defaults.dependent),
    });
    showSuccess("Reset to defaults and saved.");
  }

  const inputClass = (key: NeDirectionKey) =>
    `w-28 rounded-lg border px-3 py-2 text-right text-sm dark:bg-input/30 ${
      hasValidationErrors && parseWeight(weightStrings[key]) === null
        ? "border-red-300 dark:border-red-800"
        : "border-input"
    } text-foreground`;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-medium text-foreground">Net exposure scoring</h2>
      <p className="font-mono text-xs leading-relaxed text-foreground">
        Per <span className="font-mono">security_exposures</span> row: term = direction_weight ×
        clamp(strength) × clamp(confidence); tailwind / headwind / net follow exposure polarity.
        Weights are stored in this browser and sent on each run from Admin → Net exposure.
      </p>

      {hasValidationErrors && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Validation errors
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-red-700 dark:text-red-300">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="mt-8 mb-4 text-sm font-medium text-foreground">Weights</h2>
      <div className="space-y-6">
        {(NE_DIRECTION_KEYS as readonly NeDirectionKey[]).map((key) => (
          <div key={key} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor={`ne-dir-${key}`}
                className="font-mono text-sm font-medium text-foreground"
              >
                {key}
              </label>
              <input
                id={`ne-dir-${key}`}
                type="number"
                min={0}
                step={0.01}
                value={weightStrings[key]}
                onChange={(e) =>
                  setWeightStrings((s) => ({ ...s, [key]: e.target.value }))
                }
                className={inputClass(key)}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {key === "beneficiary" && "Primary beneficiary of the exposure theme."}
              {key === "supplier" && "Upstream / supplier relationship to the theme."}
              {key === "customer" && "Downstream / customer exposure."}
              {key === "dependent" && "Dependent or highly correlated exposure."}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSaveWeights}
          disabled={!canSave}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          Reset defaults
        </button>
      </div>
    </div>
  );
}

function AlphaGalangalWeightsTab({
  accessToken,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [weights, setWeights] = useState<AlphaGalangalCommitteeWeights | null>(
    null
  );
  const [savedWeights, setSavedWeights] =
    useState<AlphaGalangalCommitteeWeights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getAlphaGalangalCommitteeWeights(accessToken)
      .then((res) => {
        setWeights(res.weights);
        setSavedWeights(res.weights);
      })
      .catch(() => {
        setWeights(DEFAULT_ALPHA_GALANGAL_WEIGHTS);
        setSavedWeights(null);
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  function handleWeightChange(
    key: keyof AlphaGalangalCommitteeWeights,
    value: number
  ) {
    setWeights((prev) => prev && { ...prev, [key]: value });
  }

  async function handleSave() {
    if (!weights || !accessToken) return;
    const errors = validateAlphaGalangalWeights(weights);
    if (errors.length > 0) {
      errors.forEach((e) => showError(e));
      return;
    }
    setIsSaving(true);
    try {
      await updateAlphaGalangalCommitteeWeights(weights, accessToken);
      setSavedWeights(weights);
      showSuccess("Weights saved successfully");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!weights) {
    return (
      <p className="text-muted-foreground">
        Weights not found or failed to load.
      </p>
    );
  }

  const validationErrors = validateAlphaGalangalWeights(weights);
  const hasValidationErrors = validationErrors.length > 0;
  const hasChanges =
    !savedWeights ||
    ALPHA_GALANGAL_WEIGHT_ORDER.some(
      (k) => Math.abs(weights[k] - savedWeights[k]) > 0.0001
    );
  const canSave = hasChanges && !hasValidationErrors;
  const currentSum = sumAlphaGalangalWeights(weights);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="mb-6 text-sm text-muted-foreground">
        Edit the weights for the committee composite formula.
        Weights must sum to 1.
      </p>

      {hasValidationErrors && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Validation errors
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-red-700 dark:text-red-300">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            Current sum: {currentSum.toFixed(2)}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {ALPHA_GALANGAL_WEIGHT_ORDER.map((key) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-lg border border-border p-4"
          >
            <label
              htmlFor={`ag-${key}`}
              className="font-mono text-sm font-medium capitalize text-foreground"
            >
              {key}
            </label>
            <input
              id={`ag-${key}`}
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={weights[key]}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v)) handleWeightChange(key, v);
              }}
              className={`w-24 rounded-lg border px-3 py-2 text-right text-sm dark:bg-input/30 ${
                hasValidationErrors
                  ? "border-red-300 dark:border-red-800"
                  : "border-input"
              } text-foreground`}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave || isSaving}
        className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function AlphaGalangalPromptTab({
  accessToken,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [prompt, setPrompt] = useState<AlphaGalangalCommitteeActivePrompt | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getAlphaGalangalCommitteeActivePrompt(accessToken)
      .then(setPrompt)
      .catch(() => setPrompt({}))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  function handleChange<K extends keyof AlphaGalangalCommitteeActivePrompt>(
    key: K,
    value: AlphaGalangalCommitteeActivePrompt[K]
  ) {
    setPrompt((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function outputSchemaDisplay(): string {
    const v = prompt?.output_schema;
    if (v == null) return "";
    if (typeof v === "string") return v;
    return JSON.stringify(v, null, 2);
  }

  async function handleSave() {
    if (!prompt || !accessToken) return;
    const body: Partial<typeof prompt> = { ...prompt };
    if (typeof body.output_schema === "object" && body.output_schema !== null) {
      body.output_schema = JSON.stringify(body.output_schema);
    }
    setIsSaving(true);
    try {
      await updateAlphaGalangalCommitteeActivePrompt(body, accessToken);
      showSuccess("Prompt saved successfully");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!prompt) {
    return (
      <p className="text-muted-foreground">
        Prompt not found or failed to load.
      </p>
    );
  }

  const hasChanges = true;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-foreground">
          System prompt
        </h2>
        <textarea
          value={prompt.system_prompt ?? ""}
          onChange={(e) => handleChange("system_prompt", e.target.value)}
          rows={8}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
          placeholder="System prompt for the LLM"
        />

        <h2 className="mt-8 mb-4 text-sm font-medium text-foreground">
          User prompt template
        </h2>
        <textarea
          value={prompt.user_prompt_template ?? ""}
          onChange={(e) => handleChange("user_prompt_template", e.target.value)}
          rows={8}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
          placeholder="User prompt template (may include placeholders)"
        />

        <h2 className="mt-8 mb-4 text-sm font-medium text-foreground">
          Output schema
        </h2>
        <textarea
          value={outputSchemaDisplay()}
          onChange={(e) => handleChange("output_schema", e.target.value)}
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
          placeholder="JSON schema for structured output"
        />

        <h2 className="mt-8 mb-4 text-sm font-medium text-foreground">
          Notes
        </h2>
        <input
          type="text"
          value={prompt.notes ?? ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          placeholder="Optional notes"
        />

        <h2 className="mt-8 mb-4 text-sm font-medium text-foreground">
          Model settings
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="model_name"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Model name
            </label>
            <input
              id="model_name"
              type="text"
              value={prompt.model_name ?? ""}
              onChange={(e) => handleChange("model_name", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
              placeholder="e.g. gpt-4"
            />
          </div>
          <div>
            <label
              htmlFor="status"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Status
            </label>
            <input
              id="status"
              type="text"
              value={prompt.status ?? ""}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
              placeholder="e.g. active"
            />
          </div>
          <div>
            <label
              htmlFor="temperature"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Temperature
            </label>
            <input
              id="temperature"
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={prompt.temperature ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? undefined : parseFloat(e.target.value);
                handleChange("temperature", Number.isNaN(v) ? undefined : v);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
              placeholder="0–2"
            />
          </div>
          <div>
            <label
              htmlFor="top_p"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Top P
            </label>
            <input
              id="top_p"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={prompt.top_p ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? undefined : parseFloat(e.target.value);
                handleChange("top_p", Number.isNaN(v) ? undefined : v);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
              placeholder="0–1"
            />
          </div>
          <div>
            <label
              htmlFor="max_output_tokens"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Max output tokens
            </label>
            <input
              id="max_output_tokens"
              type="number"
              min={1}
              value={prompt.max_output_tokens ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                handleChange("max_output_tokens", Number.isNaN(v) ? undefined : v);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
              placeholder="e.g. 4096"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

const WARREN_BUFFETT_FORMULA_KEY = "alpha_galangal_committee_buffett_score";

function WarrenBuffettPromptTab({
  accessToken,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [prompt, setPrompt] = useState<FormulaPromptVersionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getFormulaPromptVersions(accessToken, WARREN_BUFFETT_FORMULA_KEY)
      .then((versions) => {
        const active =
          versions.find((v) => v.status === "active") ??
          versions[versions.length - 1] ??
          null;
        setPrompt(active);
      })
      .catch(() => setPrompt(null))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  function handleChange<K extends keyof FormulaPromptVersionRow>(
    key: K,
    value: FormulaPromptVersionRow[K]
  ) {
    setPrompt((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function outputSchemaDisplay(): string {
    const v = prompt?.output_schema;
    if (v == null) return "";
    if (typeof v === "string") return v;
    return JSON.stringify(v, null, 2);
  }

  async function handleSave() {
    if (!prompt?.id || !accessToken) return;
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        system_prompt: prompt.system_prompt,
        user_prompt_template: prompt.user_prompt_template,
        notes: prompt.notes,
        model_name: prompt.model_name,
        temperature: prompt.temperature,
        top_p: prompt.top_p,
        max_output_tokens: prompt.max_output_tokens,
        status: prompt.status,
      };
      const os = prompt.output_schema;
      if (typeof os === "string") {
        try {
          body.output_schema = JSON.parse(os);
        } catch {
          body.output_schema = os;
        }
      } else if (os != null) {
        body.output_schema = os;
      }
      await patchFormulaPromptVersion(accessToken, prompt.id, body);
      showSuccess("Warren Buffett prompt saved");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!prompt) {
    return (
      <p className="text-muted-foreground">
        Warren Buffett prompt not found. Apply migration{" "}
        <code className="rounded bg-muted px-1 text-xs">
          20260416130000_seed_warren_buffett_score_prompt_ske65.sql
        </code>
        .
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">
        Edit the LLM prompt and schema for the Warren Buffett score model (
        <span className="font-mono">alpha_galangal_committee_buffett_score</span>).
      </p>

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">System prompt</h2>
      <textarea
        value={prompt.system_prompt ?? ""}
        onChange={(e) => handleChange("system_prompt", e.target.value)}
        rows={6}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">User prompt template</h2>
      <textarea
        value={prompt.user_prompt_template ?? ""}
        onChange={(e) => handleChange("user_prompt_template", e.target.value)}
        rows={16}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">Output schema</h2>
      <textarea
        value={outputSchemaDisplay()}
        onChange={(e) => handleChange("output_schema", e.target.value)}
        rows={12}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Model
          </label>
          <input
            type="text"
            value={prompt.model_name ?? ""}
            onChange={(e) => handleChange("model_name", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <input
            type="text"
            value={prompt.status ?? ""}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Temperature
          </label>
          <input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={prompt.temperature ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? undefined : parseFloat(e.target.value);
              handleChange("temperature", Number.isNaN(v as number) ? undefined : v);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Max output tokens
          </label>
          <input
            type="number"
            min={1}
            value={prompt.max_output_tokens ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
              handleChange("max_output_tokens", Number.isNaN(v as number) ? undefined : v);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save prompt"}
      </button>
    </div>
  );
}

const DRUCKENMILLER_FORMULA_KEY = "alpha_galangal_committee_druckenmiller_score";

function DruckenmillerPromptTab({
  accessToken,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [prompt, setPrompt] = useState<FormulaPromptVersionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getFormulaPromptVersions(accessToken, DRUCKENMILLER_FORMULA_KEY)
      .then((versions) => {
        const active =
          versions.find((v) => v.status === "active") ??
          versions[versions.length - 1] ??
          null;
        setPrompt(active);
      })
      .catch(() => setPrompt(null))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  function handleChange<K extends keyof FormulaPromptVersionRow>(
    key: K,
    value: FormulaPromptVersionRow[K]
  ) {
    setPrompt((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function outputSchemaDisplay(): string {
    const v = prompt?.output_schema;
    if (v == null) return "";
    if (typeof v === "string") return v;
    return JSON.stringify(v, null, 2);
  }

  async function handleSave() {
    if (!prompt?.id || !accessToken) return;
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        system_prompt: prompt.system_prompt,
        user_prompt_template: prompt.user_prompt_template,
        notes: prompt.notes,
        model_name: prompt.model_name,
        temperature: prompt.temperature,
        top_p: prompt.top_p,
        max_output_tokens: prompt.max_output_tokens,
        status: prompt.status,
      };
      const os = prompt.output_schema;
      if (typeof os === "string") {
        try {
          body.output_schema = JSON.parse(os);
        } catch {
          body.output_schema = os;
        }
      } else if (os != null) {
        body.output_schema = os;
      }
      await patchFormulaPromptVersion(accessToken, prompt.id, body);
      showSuccess("Druckenmiller prompt saved");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!prompt) {
    return (
      <p className="text-muted-foreground">
        Druckenmiller prompt not found. Apply migration{" "}
        <code className="rounded bg-muted px-1 text-xs">
          20260417130000_seed_druckenmiller_score_prompt_ske67.sql
        </code>
        .
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">
        Edit the LLM prompt and schema for the Stanley Druckenmiller score model (
        <span className="font-mono">alpha_galangal_committee_druckenmiller_score</span>).
      </p>

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">System prompt</h2>
      <textarea
        value={prompt.system_prompt ?? ""}
        onChange={(e) => handleChange("system_prompt", e.target.value)}
        rows={6}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">User prompt template</h2>
      <textarea
        value={prompt.user_prompt_template ?? ""}
        onChange={(e) => handleChange("user_prompt_template", e.target.value)}
        rows={16}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">Output schema</h2>
      <textarea
        value={outputSchemaDisplay()}
        onChange={(e) => handleChange("output_schema", e.target.value)}
        rows={12}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Model
          </label>
          <input
            type="text"
            value={prompt.model_name ?? ""}
            onChange={(e) => handleChange("model_name", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <input
            type="text"
            value={prompt.status ?? ""}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Temperature
          </label>
          <input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={prompt.temperature ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? undefined : parseFloat(e.target.value);
              handleChange("temperature", Number.isNaN(v as number) ? undefined : v);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Max output tokens
          </label>
          <input
            type="number"
            min={1}
            value={prompt.max_output_tokens ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
              handleChange("max_output_tokens", Number.isNaN(v as number) ? undefined : v);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save prompt"}
      </button>
    </div>
  );
}

const WOOD_FORMULA_KEY = "alpha_galangal_committee_wood_score";

function WoodPromptTab({
  accessToken,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [prompt, setPrompt] = useState<FormulaPromptVersionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getFormulaPromptVersions(accessToken, WOOD_FORMULA_KEY)
      .then((versions) => {
        const active =
          versions.find((v) => v.status === "active") ??
          versions[versions.length - 1] ??
          null;
        setPrompt(active);
      })
      .catch(() => setPrompt(null))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  function handleChange<K extends keyof FormulaPromptVersionRow>(
    key: K,
    value: FormulaPromptVersionRow[K]
  ) {
    setPrompt((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function outputSchemaDisplay(): string {
    const v = prompt?.output_schema;
    if (v == null) return "";
    if (typeof v === "string") return v;
    return JSON.stringify(v, null, 2);
  }

  async function handleSave() {
    if (!prompt?.id || !accessToken) return;
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        system_prompt: prompt.system_prompt,
        user_prompt_template: prompt.user_prompt_template,
        notes: prompt.notes,
        model_name: prompt.model_name,
        temperature: prompt.temperature,
        top_p: prompt.top_p,
        max_output_tokens: prompt.max_output_tokens,
        status: prompt.status,
      };
      const os = prompt.output_schema;
      if (typeof os === "string") {
        try {
          body.output_schema = JSON.parse(os);
        } catch {
          body.output_schema = os;
        }
      } else if (os != null) {
        body.output_schema = os;
      }
      await patchFormulaPromptVersion(accessToken, prompt.id, body);
      showSuccess("Wood (Cathie Wood) prompt saved");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!prompt) {
    return (
      <p className="text-muted-foreground">
        Wood prompt not found. Apply migration{" "}
        <code className="rounded bg-muted px-1 text-xs">
          20260417150000_seed_wood_score_prompt_ske66.sql
        </code>
        .
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">
        Edit the LLM prompt and schema for the Cathie Wood score model (
        <span className="font-mono">alpha_galangal_committee_wood_score</span>).
      </p>

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">System prompt</h2>
      <textarea
        value={prompt.system_prompt ?? ""}
        onChange={(e) => handleChange("system_prompt", e.target.value)}
        rows={6}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">User prompt template</h2>
      <textarea
        value={prompt.user_prompt_template ?? ""}
        onChange={(e) => handleChange("user_prompt_template", e.target.value)}
        rows={16}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">Output schema</h2>
      <textarea
        value={outputSchemaDisplay()}
        onChange={(e) => handleChange("output_schema", e.target.value)}
        rows={12}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Model
          </label>
          <input
            type="text"
            value={prompt.model_name ?? ""}
            onChange={(e) => handleChange("model_name", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <input
            type="text"
            value={prompt.status ?? ""}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Temperature
          </label>
          <input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={prompt.temperature ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? undefined : parseFloat(e.target.value);
              handleChange("temperature", Number.isNaN(v as number) ? undefined : v);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Max output tokens
          </label>
          <input
            type="number"
            min={1}
            value={prompt.max_output_tokens ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
              handleChange("max_output_tokens", Number.isNaN(v as number) ? undefined : v);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save prompt"}
      </button>
    </div>
  );
}

const GRAHAM_FORMULA_KEY = "alpha_galangal_committee_graham_score";

function GrahamPromptTab({
  accessToken,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [prompt, setPrompt] = useState<FormulaPromptVersionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getFormulaPromptVersions(accessToken, GRAHAM_FORMULA_KEY)
      .then((versions) => {
        const active =
          versions.find((v) => v.status === "active") ??
          versions[versions.length - 1] ??
          null;
        setPrompt(active);
      })
      .catch(() => setPrompt(null))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  function handleChange<K extends keyof FormulaPromptVersionRow>(
    key: K,
    value: FormulaPromptVersionRow[K]
  ) {
    setPrompt((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function outputSchemaDisplay(): string {
    const v = prompt?.output_schema;
    if (v == null) return "";
    if (typeof v === "string") return v;
    return JSON.stringify(v, null, 2);
  }

  async function handleSave() {
    if (!prompt?.id || !accessToken) return;
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        system_prompt: prompt.system_prompt,
        user_prompt_template: prompt.user_prompt_template,
        notes: prompt.notes,
        model_name: prompt.model_name,
        temperature: prompt.temperature,
        top_p: prompt.top_p,
        max_output_tokens: prompt.max_output_tokens,
        status: prompt.status,
      };
      const os = prompt.output_schema;
      if (typeof os === "string") {
        try {
          body.output_schema = JSON.parse(os);
        } catch {
          body.output_schema = os;
        }
      } else if (os != null) {
        body.output_schema = os;
      }
      await patchFormulaPromptVersion(accessToken, prompt.id, body);
      showSuccess("Benjamin Graham prompt saved");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!prompt) {
    return (
      <p className="text-muted-foreground">
        Graham prompt not found. Apply migration{" "}
        <code className="rounded bg-muted px-1 text-xs">
          20260417200000_seed_graham_score_prompt_ske68.sql
        </code>
        .
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">
        Edit the LLM prompt and schema for the Benjamin Graham score model (
        <span className="font-mono">alpha_galangal_committee_graham_score</span>).
      </p>

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">System prompt</h2>
      <textarea
        value={prompt.system_prompt ?? ""}
        onChange={(e) => handleChange("system_prompt", e.target.value)}
        rows={6}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">User prompt template</h2>
      <textarea
        value={prompt.user_prompt_template ?? ""}
        onChange={(e) => handleChange("user_prompt_template", e.target.value)}
        rows={16}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">Output schema</h2>
      <textarea
        value={outputSchemaDisplay()}
        onChange={(e) => handleChange("output_schema", e.target.value)}
        rows={12}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Model
          </label>
          <input
            type="text"
            value={prompt.model_name ?? ""}
            onChange={(e) => handleChange("model_name", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <input
            type="text"
            value={prompt.status ?? ""}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Temperature
          </label>
          <input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={prompt.temperature ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? undefined : parseFloat(e.target.value);
              handleChange("temperature", Number.isNaN(v as number) ? undefined : v);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Max output tokens
          </label>
          <input
            type="number"
            min={1}
            value={prompt.max_output_tokens ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
              handleChange("max_output_tokens", Number.isNaN(v as number) ? undefined : v);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save prompt"}
      </button>
    </div>
  );
}

const LYNCH_FORMULA_KEY = "alpha_galangal_committee_lynch_score";

function LynchPromptTab({
  accessToken,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [prompt, setPrompt] = useState<FormulaPromptVersionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getFormulaPromptVersions(accessToken, LYNCH_FORMULA_KEY)
      .then((versions) => {
        const active =
          versions.find((v) => v.status === "active") ??
          versions[versions.length - 1] ??
          null;
        setPrompt(active);
      })
      .catch(() => setPrompt(null))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  function handleChange<K extends keyof FormulaPromptVersionRow>(
    key: K,
    value: FormulaPromptVersionRow[K]
  ) {
    setPrompt((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function outputSchemaDisplay(): string {
    const v = prompt?.output_schema;
    if (v == null) return "";
    if (typeof v === "string") return v;
    return JSON.stringify(v, null, 2);
  }

  async function handleSave() {
    if (!prompt?.id || !accessToken) return;
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        system_prompt: prompt.system_prompt,
        user_prompt_template: prompt.user_prompt_template,
        notes: prompt.notes,
        model_name: prompt.model_name,
        temperature: prompt.temperature,
        top_p: prompt.top_p,
        max_output_tokens: prompt.max_output_tokens,
        status: prompt.status,
      };
      const os = prompt.output_schema;
      if (typeof os === "string") {
        try {
          body.output_schema = JSON.parse(os);
        } catch {
          body.output_schema = os;
        }
      } else if (os != null) {
        body.output_schema = os;
      }
      await patchFormulaPromptVersion(accessToken, prompt.id, body);
      showSuccess("Peter Lynch prompt saved");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!prompt) {
    return (
      <p className="text-muted-foreground">
        Lynch prompt not found. Apply migration{" "}
        <code className="rounded bg-muted px-1 text-xs">
          20260417220000_seed_lynch_score_prompt_ske69.sql
        </code>
        .
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">
        Edit the LLM prompt and schema for the Peter Lynch score model (
        <span className="font-mono">alpha_galangal_committee_lynch_score</span>).
      </p>

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">System prompt</h2>
      <textarea
        value={prompt.system_prompt ?? ""}
        onChange={(e) => handleChange("system_prompt", e.target.value)}
        rows={6}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">User prompt template</h2>
      <textarea
        value={prompt.user_prompt_template ?? ""}
        onChange={(e) => handleChange("user_prompt_template", e.target.value)}
        rows={16}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">Output schema</h2>
      <textarea
        value={outputSchemaDisplay()}
        onChange={(e) => handleChange("output_schema", e.target.value)}
        rows={12}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Model
          </label>
          <input
            type="text"
            value={prompt.model_name ?? ""}
            onChange={(e) => handleChange("model_name", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <input
            type="text"
            value={prompt.status ?? ""}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Temperature
          </label>
          <input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={prompt.temperature ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? undefined : parseFloat(e.target.value);
              handleChange("temperature", Number.isNaN(v as number) ? undefined : v);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Max output tokens
          </label>
          <input
            type="number"
            min={1}
            value={prompt.max_output_tokens ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
              handleChange("max_output_tokens", Number.isNaN(v as number) ? undefined : v);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save prompt"}
      </button>
    </div>
  );
}

const BURRY_FORMULA_KEY = "alpha_galangal_committee_burry_score";

function BurryPromptTab({
  accessToken,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [prompt, setPrompt] = useState<FormulaPromptVersionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getFormulaPromptVersions(accessToken, BURRY_FORMULA_KEY)
      .then((versions) => {
        const active =
          versions.find((v) => v.status === "active") ??
          versions[versions.length - 1] ??
          null;
        setPrompt(active);
      })
      .catch(() => setPrompt(null))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  function handleChange<K extends keyof FormulaPromptVersionRow>(
    key: K,
    value: FormulaPromptVersionRow[K]
  ) {
    setPrompt((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function outputSchemaDisplay(): string {
    const v = prompt?.output_schema;
    if (v == null) return "";
    if (typeof v === "string") return v;
    return JSON.stringify(v, null, 2);
  }

  async function handleSave() {
    if (!prompt?.id || !accessToken) return;
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        system_prompt: prompt.system_prompt,
        user_prompt_template: prompt.user_prompt_template,
        notes: prompt.notes,
        model_name: prompt.model_name,
        temperature: prompt.temperature,
        top_p: prompt.top_p,
        max_output_tokens: prompt.max_output_tokens,
        status: prompt.status,
      };
      const os = prompt.output_schema;
      if (typeof os === "string") {
        try {
          body.output_schema = JSON.parse(os);
        } catch {
          body.output_schema = os;
        }
      } else if (os != null) {
        body.output_schema = os;
      }
      await patchFormulaPromptVersion(accessToken, prompt.id, body);
      showSuccess("Michael Burry prompt saved");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!prompt) {
    return (
      <p className="text-muted-foreground">
        Burry prompt not found. Apply migration{" "}
        <code className="rounded bg-muted px-1 text-xs">
          20260417180000_seed_burry_score_prompt_ske64.sql
        </code>
        .
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">
        Edit the LLM prompt and schema for the Michael Burry score model (
        <span className="font-mono">alpha_galangal_committee_burry_score</span>).
      </p>

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">System prompt</h2>
      <textarea
        value={prompt.system_prompt ?? ""}
        onChange={(e) => handleChange("system_prompt", e.target.value)}
        rows={6}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">User prompt template</h2>
      <textarea
        value={prompt.user_prompt_template ?? ""}
        onChange={(e) => handleChange("user_prompt_template", e.target.value)}
        rows={16}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">Output schema</h2>
      <textarea
        value={outputSchemaDisplay()}
        onChange={(e) => handleChange("output_schema", e.target.value)}
        rows={12}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Model
          </label>
          <input
            type="text"
            value={prompt.model_name ?? ""}
            onChange={(e) => handleChange("model_name", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <input
            type="text"
            value={prompt.status ?? ""}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Temperature
          </label>
          <input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={prompt.temperature ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? undefined : parseFloat(e.target.value);
              handleChange("temperature", Number.isNaN(v as number) ? undefined : v);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Max output tokens
          </label>
          <input
            type="number"
            min={1}
            value={prompt.max_output_tokens ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
              handleChange("max_output_tokens", Number.isNaN(v as number) ? undefined : v);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save prompt"}
      </button>
    </div>
  );
}

const TAXONOMY_STRUCTURAL_FORMULA_KEYS = {
  "3y": "taxonomy_structural_growth_3y",
  "5y": "taxonomy_structural_growth_5y",
  "10y": "taxonomy_structural_growth_10y",
} as const;

type StructuralHorizon = keyof typeof TAXONOMY_STRUCTURAL_FORMULA_KEYS;

function TaxonomyStructuralGrowthTab({
  accessToken,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [horizon, setHorizon] = useState<StructuralHorizon>("3y");
  const [prompt, setPrompt] = useState<FormulaPromptVersionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [geminiOk, setGeminiOk] = useState<boolean | null>(null);
  const [runLimit, setRunLimit] = useState<string>("");
  const [runDelayMs, setRunDelayMs] = useState<string>("");
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncingCagr, setIsSyncingCagr] = useState(false);
  const [lastRun, setLastRun] = useState<{
    entitiesProcessed: number;
    llmCalls: number;
    errors: string[];
  } | null>(null);
  const [cagrWeights, setCagrWeights] = useState<StructuralGrowthCagrFormulaWeights | null>(
    null
  );
  const [savedCagrWeights, setSavedCagrWeights] =
    useState<StructuralGrowthCagrFormulaWeights | null>(null);
  const [cagrComponents, setCagrComponents] = useState<
    Record<string, FormulaComponent>
  >({});
  const [cagrLoading, setCagrLoading] = useState(true);
  const [cagrSaving, setCagrSaving] = useState(false);
  const [showCagrConfirmModal, setShowCagrConfirmModal] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getTaxonomyStructuralGrowthStatus(accessToken)
      .then((s) => setGeminiOk(s.geminiConfigured))
      .catch(() => setGeminiOk(null));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    setPrompt(null);
    const formulaKey = TAXONOMY_STRUCTURAL_FORMULA_KEYS[horizon];
    getFormulaPromptVersions(accessToken, formulaKey)
      .then((versions) => {
        const active =
          versions.find((v) => v.status === "active") ?? versions[versions.length - 1] ?? null;
        setPrompt(active);
      })
      .catch(() => setPrompt(null))
      .finally(() => setIsLoading(false));
  }, [accessToken, horizon]);

  useEffect(() => {
    if (!accessToken) return;
    setCagrLoading(true);
    getStructuralGrowthCagrScoreFormula(accessToken)
      .then((res) => {
        const w = res.formula?.definition?.weights as
          | StructuralGrowthCagrFormulaWeights
          | undefined;
        if (w) {
          setCagrWeights(w);
          setSavedCagrWeights(w);
        }
        setCagrComponents(res.components ?? {});
      })
      .catch(() => showError("Failed to load CAGR composite formula"))
      .finally(() => setCagrLoading(false));
  }, [accessToken, showError]);

  function handleChange<K extends keyof FormulaPromptVersionRow>(
    key: K,
    value: FormulaPromptVersionRow[K]
  ) {
    setPrompt((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function outputSchemaDisplay(): string {
    const v = prompt?.output_schema;
    if (v == null) return "";
    if (typeof v === "string") return v;
    return JSON.stringify(v, null, 2);
  }

  async function handleSave() {
    if (!prompt?.id || !accessToken) return;
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        system_prompt: prompt.system_prompt,
        user_prompt_template: prompt.user_prompt_template,
        notes: prompt.notes,
        model_name: prompt.model_name,
        temperature: prompt.temperature,
        top_p: prompt.top_p,
        max_output_tokens: prompt.max_output_tokens,
        status: prompt.status,
      };
      const os = prompt.output_schema;
      if (typeof os === "string") {
        try {
          body.output_schema = JSON.parse(os);
        } catch {
          body.output_schema = os;
        }
      } else if (os != null) {
        body.output_schema = os;
      }
      await patchFormulaPromptVersion(accessToken, prompt.id, body);
      showSuccess("Prompt saved successfully");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRun() {
    if (!accessToken) return;
    const n = runLimit.trim() === "" ? undefined : parseInt(runLimit, 10);
    if (runLimit.trim() !== "" && (Number.isNaN(n) || (n ?? 0) < 1)) {
      showError("Limit must be a positive integer or empty");
      return;
    }
    const d =
      runDelayMs.trim() === "" ? undefined : parseInt(runDelayMs.trim(), 10);
    if (runDelayMs.trim() !== "" && (Number.isNaN(d!) || (d ?? 0) < 0)) {
      showError("Delay (ms) must be a non-negative integer or empty");
      return;
    }
    setIsRunning(true);
    setLastRun(null);
    try {
      const res = await runTaxonomyStructuralGrowth(accessToken, {
        limit: n,
        ...(typeof d === "number" ? { delayMs: d } : {}),
      });
      setLastRun(res);
      const regionBlocked = res.errors.some((e) =>
        e.toLowerCase().includes("location is not supported")
      );
      const rateLimited = res.errors.some((e) => {
        const x = e.toLowerCase();
        return (
          x.includes("resource exhausted") ||
          x.includes("429") ||
          x.includes("quota")
        );
      });
      const baseMsg = `Done: ${res.entitiesProcessed} taxonomy nodes, ${res.llmCalls} LLM calls`;
      if (regionBlocked) {
        showError(
          `${baseMsg}. Gemini region policy blocked this run. Use Data sync → Run taxonomy CAGR sync (from stored payloads), or run backend from a supported Gemini region.`
        );
      } else if (rateLimited) {
        showError(
          `${baseMsg}. Hit Gemini rate limits (429 / quota). The API now retries automatically; try a smaller batch, set a higher “Delay between calls”, wait a few minutes, or raise limits in Google AI Studio / Cloud console.`
        );
      } else if (res.llmCalls === 0) {
        showError(
          `${baseMsg}. Google Gemini was not called. ${res.errors[0] ?? "Use “Test Gemini API” and confirm taxonomy entities exist."}`
        );
      } else if (res.errors.length > 0) {
        showError(`${baseMsg}. Completed with ${res.errors.length} error(s).`);
      } else {
        showSuccess(baseMsg);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleTestGemini() {
    if (!accessToken) return;
    setIsTestingGemini(true);
    try {
      const r = await testTaxonomyStructuralGrowthGemini(accessToken);
      if (r.ok) {
        showSuccess(
          `Gemini API responded OK in ${r.latencyMs}ms (${r.model}). Check usage in Google AI Studio → API keys (not the Vertex-only console).`
        );
      } else {
        showError(r.error ?? "Gemini test failed");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gemini test failed");
    } finally {
      setIsTestingGemini(false);
    }
  }

  async function handleSyncCagrScores() {
    if (!accessToken) return;
    setIsSyncingCagr(true);
    try {
      const res = await syncTaxonomyStructuralGrowthCagrScores(accessToken);
      const msg = `CAGR sync done: scanned ${res.entitiesScanned}, horizon upserts ${res.horizonScoresUpserted}, composite upserts ${res.compositesUpserted}, missing horizon ${res.entitiesMissingAnyHorizon}.`;
      if (res.errors.length > 0) {
        showError(`${msg} Error sample: ${res.errors.slice(0, 5).join("; ")}`);
      } else {
        showSuccess(msg);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "CAGR sync failed");
    } finally {
      setIsSyncingCagr(false);
    }
  }

  function handleCagrWeightChange(
    key: keyof StructuralGrowthCagrFormulaWeights,
    value: number
  ) {
    setCagrWeights((prev) => prev && { ...prev, [key]: value });
  }

  function handleCagrSaveClick() {
    if (!cagrWeights) return;
    const errors = validateSgCagrWeights(cagrWeights);
    if (errors.length > 0) {
      errors.forEach((e) => showError(e));
      return;
    }
    setShowCagrConfirmModal(true);
  }

  function handleCagrConfirm() {
    if (!cagrWeights || !accessToken) return;
    setCagrSaving(true);
    updateStructuralGrowthCagrScoreWeights(cagrWeights, accessToken)
      .then(({ formula: updated, recalc }) => {
        if (updated?.definition?.weights) {
          const w = updated.definition.weights as StructuralGrowthCagrFormulaWeights;
          setSavedCagrWeights(w);
        }
        setShowCagrConfirmModal(false);
        const n = recalc?.entitiesUpdated;
        showSuccess(
          typeof n === "number"
            ? `CAGR composite weights saved. Recomputed ${n} taxonomy composite score(s).`
            : "CAGR composite weights saved. Server recomputed taxonomy composite scores where horizon scores exist."
        );
      })
      .catch((err) => {
        showError(err instanceof Error ? err.message : "Save failed");
      })
      .finally(() => setCagrSaving(false));
  }

  const cagrValidationErrors = cagrWeights ? validateSgCagrWeights(cagrWeights) : [];
  const hasCagrValidationErrors = cagrValidationErrors.length > 0;
  const hasCagrChanges =
    savedCagrWeights &&
    cagrWeights &&
    SG_CAGR_WEIGHT_ORDER.some(
      (k) => Math.abs(cagrWeights[k] - savedCagrWeights[k]) > 0.0001
    );
  const canSaveCagr = hasCagrChanges && !hasCagrValidationErrors && !!cagrWeights;
  const cagrSum = cagrWeights ? sumSgCagrWeights(cagrWeights) : 0;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-foreground">
          CAGR composite score (weights)
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Blends 3y / 5y / 10y bucket scores (
          <span className="font-mono">sg_cagr_score_*</span>) into{" "}
          <span className="font-mono">sg_cagr_composite_score</span>. Defaults:
          0.2 / 0.3 / 0.5. Saving updates the formula and recomputes composites
          from existing horizon scores.
        </p>
        {cagrLoading ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <Spinner />
          </div>
        ) : !cagrWeights ? (
          <p className="text-sm text-muted-foreground">
            Formula not found. Apply migration{" "}
            <span className="font-mono">20260409120000_structural_growth_cagr_score_factors_formula</span>
            .
          </p>
        ) : (
          <>
            {hasCagrValidationErrors && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Validation errors
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-red-700 dark:text-red-300">
                  {cagrValidationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  Current sum: {cagrSum.toFixed(2)}
                </p>
              </div>
            )}
            <div className="space-y-4">
              {SG_CAGR_WEIGHT_ORDER.map((key) => {
                const comp = cagrComponents[key];
                return (
                  <div key={key} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <label
                        htmlFor={`sg-${key}`}
                        className="font-mono text-sm font-medium text-foreground"
                      >
                        {key}
                      </label>
                      <input
                        id={`sg-${key}`}
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={cagrWeights[key]}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!Number.isNaN(v)) handleCagrWeightChange(key, v);
                        }}
                        className={`w-24 rounded-lg border px-3 py-2 text-right text-sm dark:bg-input/30 ${
                          hasCagrValidationErrors
                            ? "border-red-300 dark:border-red-800"
                            : "border-input"
                        } text-foreground`}
                      />
                    </div>
                    {comp?.display_formula && (
                      <p className="mt-2 font-mono text-xs text-muted-foreground">
                        {comp.display_formula}
                      </p>
                    )}
                    {comp?.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{comp.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleCagrSaveClick}
              disabled={!canSaveCagr || cagrSaving}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {cagrSaving ? "Saving…" : "Save weights"}
            </button>
          </>
        )}
      </div>

      {isLoading && !prompt ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : !prompt ? (
        <p className="text-muted-foreground">
          No prompt version found. Apply the SKE-71 migration and ensure formulas
          and prompts exist for this horizon.
        </p>
      ) : (
        <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Edit LLM prompts for forward-looking structural growth (CAGR buckets,
          regime, confidence) per taxonomy node. Factors:{" "}
          <span className="font-mono text-foreground">
            sector / industry / sub_industry structural growth
          </span>
          .
        </p>
        {geminiOk !== null && (
          <p className="mt-2 text-sm">
            Gemini API key:{" "}
            <span className={geminiOk ? "text-green-600" : "text-amber-600"}>
              {geminiOk ? "configured" : "not configured"}
            </span>
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {(["3y", "5y", "10y"] as StructuralHorizon[]).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHorizon(h)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                horizon === h
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          These tabs only choose which horizon&apos;s <strong>prompt</strong> you are
          viewing and saving.{" "}
          <span className="font-medium text-foreground">Run structural growth</span>{" "}
          always runs <span className="font-mono">3y</span>,{" "}
          <span className="font-mono">5y</span>, and <span className="font-mono">10y</span>{" "}
          for each entity (three Gemini calls per entity unless a call fails).
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-foreground">System prompt</h2>
        <textarea
          value={prompt.system_prompt ?? ""}
          onChange={(e) => handleChange("system_prompt", e.target.value)}
          rows={10}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
        />

        <h2 className="mt-8 mb-4 text-sm font-medium text-foreground">
          User prompt template
        </h2>
        <p className="mb-2 text-xs text-muted-foreground">
          Placeholders: {"{{level}}"}, {"{{name}}"}, {"{{code}}"}, {"{{description}}"}
        </p>
        <textarea
          value={prompt.user_prompt_template ?? ""}
          onChange={(e) => handleChange("user_prompt_template", e.target.value)}
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
        />

        <h2 className="mt-8 mb-4 text-sm font-medium text-foreground">Output schema (JSON)</h2>
        <textarea
          value={outputSchemaDisplay()}
          onChange={(e) => handleChange("output_schema", e.target.value)}
          rows={8}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
        />

        <h2 className="mt-8 mb-4 text-sm font-medium text-foreground">Notes</h2>
        <input
          type="text"
          value={prompt.notes ?? ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Model
            </label>
            <input
              type="text"
              value={prompt.model_name ?? ""}
              onChange={(e) => handleChange("model_name", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Status
            </label>
            <input
              type="text"
              value={prompt.status ?? ""}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Temperature
            </label>
            <input
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={prompt.temperature ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? undefined : parseFloat(e.target.value);
                handleChange("temperature", Number.isNaN(v as number) ? undefined : v);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Max output tokens
            </label>
            <input
              type="number"
              min={1}
              value={prompt.max_output_tokens ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                handleChange("max_output_tokens", Number.isNaN(v as number) ? undefined : v);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save prompt"}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-foreground">
          Run (platform admin)
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Uses the{" "}
          <span className="font-mono text-foreground">GEMINI_API_KEY</span> on the
          API server (Google AI /{" "}
          <span className="font-mono">generativelanguage.googleapis.com</span>
          ). Usage shows in{" "}
          <a
            className="text-primary underline"
            href="https://aistudio.google.com/"
            target="_blank"
            rel="noreferrer"
          >
            Google AI Studio
          </a>
          , not only in Vertex metrics. If a full run shows 0 LLM calls, there may
          be no taxonomy entities yet—use{" "}
          <span className="font-medium text-foreground">Test Gemini API</span> to
          confirm the key works.
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Calls Gemini for each taxonomy entity (sector / industry / sub-industry)
          for 3y, 5y, and 10y (three API calls per entity). If you see rate-limit
          errors, use a higher delay or a lower max entities. Writes LLM JSON to{" "}
          <span className="font-mono">entity_factor_values</span>, maps{" "}
          <span className="font-mono">cagr_bucket</span> to numeric scores (
          <span className="font-mono">sg_cagr_score_*</span>), then writes the
          weighted composite to <span className="font-mono">sg_cagr_composite_score</span>
          .
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Max entities (optional)
            </label>
            <input
              type="number"
              min={1}
              placeholder="All"
              value={runLimit}
              onChange={(e) => setRunLimit(e.target.value)}
              className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-input/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Delay between calls (ms, optional)
            </label>
            <input
              type="number"
              min={0}
              placeholder="Server default (2500)"
              value={runDelayMs}
              onChange={(e) => setRunDelayMs(e.target.value)}
              className="w-48 rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-input/30"
            />
          </div>
          <button
            type="button"
            onClick={handleTestGemini}
            disabled={isTestingGemini || !accessToken}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {isTestingGemini ? "Testing…" : "Test Gemini API"}
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
          >
            {isRunning ? "Running…" : "Run structural growth"}
          </button>
          <button
            type="button"
            onClick={handleSyncCagrScores}
            disabled={isSyncingCagr}
            className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
          >
            {isSyncingCagr ? "Syncing…" : "Run taxonomy CAGR sync"}
          </button>
        </div>
        {lastRun && (
          <div className="mt-4 text-sm">
            <p>
              Entities completed: {lastRun.entitiesProcessed}, LLM calls:{" "}
              {lastRun.llmCalls}
            </p>
            {lastRun.errors.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-amber-700 dark:text-amber-400">
                {lastRun.errors.slice(0, 20).map((e, idx) => (
                  <li key={`${idx}-${e.slice(0, 40)}`} className="font-mono text-xs">
                    {e}
                  </li>
                ))}
                {lastRun.errors.length > 20 && (
                  <li className="text-xs">…and more</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
        </>
      )}
      <ConfirmSaveModal
        isOpen={showCagrConfirmModal}
        isSaving={cagrSaving}
        onConfirm={handleCagrConfirm}
        onCancel={() => setShowCagrConfirmModal(false)}
      />
    </div>
  );
}

const MARKET_CONTENT_CLASSIFIER_FORMULA_KEY = "market_content_classifier";

function MarketContentClassifierPromptTab({
  accessToken,
  showSuccess,
  showError,
}: {
  accessToken: string | null;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [prompt, setPrompt] = useState<FormulaPromptVersionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [orgs, setOrgs] = useState<MyOrganization[]>([]);
  const [organizationId, setOrganizationId] = useState<string>("");
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [equities, setEquities] = useState<OrgEquityRow[]>([]);
  const [equitiesLoading, setEquitiesLoading] = useState(false);
  const [cycleHorizon, setCycleHorizon] = useState<"6m" | "12m" | "24m">("24m");
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [maxNews, setMaxNews] = useState(40);
  const [classifyCount, setClassifyCount] = useState(1);
 
  const [persistToDatabase, setPersistToDatabase] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isRunningPreview, setIsRunningPreview] = useState(false);
  const [lastPreview, setLastPreview] = useState<MarketContentClassifierPreviewResult | null>(null);

  
  const [con51_aggregateWindows, setCon51_aggregateWindows] = useState<"30d" | "90d" | "both">("both");

  useEffect(() => {
    if (!accessToken) return;
    setOrgsLoading(true);
    fetchMyOrganizations(accessToken)
      .then((list) => {
        setOrgs(list);
        if (list.length > 0) {
          setOrganizationId((prev) => prev || list[0].id);
        }
      })
      .catch(() => {
        setOrgs([]);
      })
      .finally(() => setOrgsLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !organizationId) {
      setEquities([]);
      return;
    }
    setEquitiesLoading(true);
    listOrganizationEquities(accessToken, organizationId, {
      limit: 500,
      offset: 0,
      only_with_entity: true,
      from_securities: true,
      cycle_horizon: cycleHorizon,
    })
      .then((res) => setEquities(res.items))
      .catch(() => setEquities([]))
      .finally(() => setEquitiesLoading(false));
  }, [accessToken, organizationId, cycleHorizon]);

  useEffect(() => {
    setSelectedTickers([]);
  }, [organizationId, cycleHorizon]);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getFormulaPromptVersions(accessToken, MARKET_CONTENT_CLASSIFIER_FORMULA_KEY)
      .then((versions) => {
        const active =
          versions.find((v) => v.status === "active") ??
          versions[versions.length - 1] ??
          null;
        setPrompt(active);
      })
      .catch(() => setPrompt(null))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  function handleChange<K extends keyof FormulaPromptVersionRow>(
    key: K,
    value: FormulaPromptVersionRow[K]
  ) {
    setPrompt((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function outputSchemaDisplay(): string {
    const v = prompt?.output_schema;
    if (v == null) return "";
    if (typeof v === "string") return v;
    return JSON.stringify(v, null, 2);
  }

  async function handleSave() {
    if (!prompt?.id || !accessToken) return;
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        system_prompt: prompt.system_prompt,
        user_prompt_template: prompt.user_prompt_template,
        notes: prompt.notes,
        model_name: prompt.model_name,
        temperature: prompt.temperature,
        top_p: prompt.top_p,
        max_output_tokens: prompt.max_output_tokens,
        status: prompt.status,
      };
      const os = prompt.output_schema;
      if (typeof os === "string") {
        try {
          body.output_schema = JSON.parse(os);
        } catch {
          body.output_schema = os;
        }
      } else if (os != null) {
        body.output_schema = os;
      }
      await patchFormulaPromptVersion(accessToken, prompt.id, body);
      showSuccess("Events / news classifier prompt saved");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleTicker(ticker: string) {
    setSelectedTickers((prev) =>
      prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker]
    );
  }

  async function handleRunFmpGeminiPreview() {
    if (!accessToken || !organizationId) {
      showError("Choose an organization.");
      return;
    }
    const pool =
      selectedTickers.length > 0
        ? selectedTickers
        : equities.map((e) => e.ticker).filter(Boolean);
    const unique = [...new Set(pool.map((t) => t.toUpperCase()))].slice(0, 40);
    if (unique.length === 0) {
      showError("No tickers available. Load org equities or select symbols.");
      return;
    }
    setIsRunningPreview(true);
    setLastPreview(null);
    try {
      const res = await runMarketContentClassifierPreview(accessToken, {
        organization_id: organizationId,
        ticker_symbols: unique,
        cycle_horizon: cycleHorizon,
        from: fromDate.trim() || undefined,
        to: toDate.trim() || undefined,
        max_news: maxNews,
        classify_count: classifyCount,
        persist: persistToDatabase,
        con51_aggregate_windows: con51_aggregateWindows,
      });
      setLastPreview(res);
      showSuccess("FMP → Gemini preview finished");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setIsRunningPreview(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!prompt) {
    return (
      <p className="text-muted-foreground">
        Events / news classifier prompt not found. Apply migration{" "}
        <code className="rounded bg-muted px-1 text-xs">
          20260421140000_seed_market_content_classifier_prompt_con83.sql
        </code>
        .
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">Events / news</h2>
        {/* <p className="mt-2 text-sm text-muted-foreground">
          Linear{" "}
          <a
            className="text-primary underline"
            href="https://linear.app/precisionai/issue/CON-83/eventsnews-prompts"
            target="_blank"
            rel="noreferrer"
          >
            CON-83
          </a>{" "}
          — system prompt and user template on one active version. Downstream
          ingestion:{" "}
          <a
            className="text-primary underline"
            href="https://linear.app/precisionai/issue/CON-53/eventsnews-schema-updatemigration"
            target="_blank"
            rel="noreferrer"
          >
            CON-53
          </a>
          . Formula key{" "}
          <span className="font-mono text-foreground">{MARKET_CONTENT_CLASSIFIER_FORMULA_KEY}</span>
          .
        </p> */}
        <p className="mt-2 text-xs text-muted-foreground">
          Active row: version {prompt.version}, status{" "}
          <span className="font-mono text-foreground">{prompt.status}</span>.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-2 text-sm font-medium text-foreground">User template placeholders</h2>
        <p className="mb-2 text-xs text-muted-foreground">
          content fills these when calling the model (empty string or null if FMP has no value).
        </p>
        <ul className="list-inside list-disc font-mono text-xs text-foreground">
          <li>{"{{source}}"}</li>
          <li>{"{{content_type}}"}</li>
          <li>{"{{title}}"}</li>
          <li>{"{{summary}}"}</li>
          <li>{"{{body}}"}</li>
          <li>{"{{url}}"}</li>
          <li>{"{{published_at}}"}</li>
          <li>{"{{occurred_at}}"}</li>
          <li>{"{{entity_list}}"}</li>
        </ul>

        <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">System prompt</h2>
        <textarea
          value={prompt.system_prompt ?? ""}
          onChange={(e) => handleChange("system_prompt", e.target.value)}
          rows={14}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
        />

        <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">User prompt template</h2>
        <textarea
          value={prompt.user_prompt_template ?? ""}
          onChange={(e) => handleChange("user_prompt_template", e.target.value)}
          rows={16}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
        />

        <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">Output schema (contract)</h2>
        <textarea
          value={outputSchemaDisplay()}
          onChange={(e) => handleChange("output_schema", e.target.value)}
          rows={14}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground dark:bg-input/30"
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Model</label>
            <input
              type="text"
              value={prompt.model_name ?? ""}
              onChange={(e) => handleChange("model_name", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
            <input
              type="text"
              value={prompt.status ?? ""}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Temperature</label>
            <input
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={prompt.temperature ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? undefined : parseFloat(e.target.value);
                handleChange("temperature", Number.isNaN(v as number) ? undefined : v);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Max output tokens</label>
            <input
              type="number"
              min={1}
              value={prompt.max_output_tokens ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                handleChange("max_output_tokens", Number.isNaN(v as number) ? undefined : v);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save prompt"}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">FMP fetch and Gemini normalization (preview)</h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Uses your organization&apos;s active equity universe (same list as the org screener). Leave all
          tickers unchecked to use every symbol currently shown below (up to 40 sent to FMP). By default,
          validated Gemini JSON is written to <span className="font-mono">market_content</span> and{" "}
          <span className="font-mono">market_content_entities</span> (same{" "}
          <span className="font-mono">source</span> + <span className="font-mono">url</span> replaces an
          existing row). Uncheck &quot;Save to database&quot; for a dry run only. Requires platform admin and
          server <span className="font-mono">FMP_API_KEY</span> / <span className="font-mono">GEMINI_API_KEY</span>{" "}
          and Supabase service role (or anon with insert policies if you add them).
        </p>

        <div className="mt-5 rounded-lg border border-dashed border-border/90 bg-muted/20 p-4">
          <h3 className="text-xs font-semibold text-foreground">
            event formulas — rollup controls
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Defaults chosen to match the spec: positive/negative counts use polarity +1 / −1 with{" "}
            <span className="font-mono">should_display = true</span> and{" "}
            <span className="font-mono">published_at</span> in the window; pressure sums{" "}
            <span className="font-mono">polarity × severity × materiality_score</span> over the same
            eligibility; trend will be <span className="font-mono">event_pressure_30d − event_pressure_90d</span>.
          </p>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-default items-start gap-2 text-xs text-foreground">
              <input type="checkbox" checked disabled className="mt-0.5 rounded border-input" />
              <span>
                Only include events where <span className="font-mono">should_display = true</span>{" "}
                <span className="text-muted-foreground">(required)</span>
              </span>
            </label>
            <label className="flex cursor-default items-start gap-2 text-xs text-foreground">
              <input type="checkbox" checked disabled className="mt-0.5 rounded border-input" />
              <span>
                Positive / negative counts use polarity <span className="font-mono">+1</span> and{" "}
                <span className="font-mono">−1</span> only{" "}
                <span className="text-muted-foreground">(neutral excluded from count metrics)</span>
              </span>
            </label>
            <label className="flex cursor-default items-start gap-2 text-xs text-foreground">
              <input type="checkbox" checked disabled className="mt-0.5 rounded border-input" />
              <span>
                Pressure sum includes every displayable event in-window (polarity{" "}
                <span className="font-mono">−1</span>, <span className="font-mono">0</span>,{" "}
                <span className="font-mono">+1</span>; neutral contributes 0 to the sum)
              </span>
            </label>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Aggregate time windows (counts + pressure)
            </label>
            <select
              value={con51_aggregateWindows}
              onChange={(e) =>
                setCon51_aggregateWindows(e.target.value as "30d" | "90d" | "both")
              }
              className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            >
              <option value="both">Both 30d and 90d (default — full set)</option>
              <option value="30d">30d only</option>
              <option value="90d">90d only</option>
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Default <span className="font-medium text-foreground">both</span> so{" "}
              <span className="font-mono">event_pressure_trend</span> (30d − 90d) remains defined when those
              metrics exist.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Organization</label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              disabled={orgsLoading || orgs.length === 0}
              className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            >
              {orgs.length === 0 ? (
                <option value="">No organizations</option>
              ) : (
                orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[11px] text-muted-foreground">
              Showing organization equities where <span className="font-mono">securities.active = true</span>{" "}
              and <span className="font-mono">entity_id IS NOT NULL</span>.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Cycle horizon</label>
            <select
              value={cycleHorizon}
              onChange={(e) => setCycleHorizon(e.target.value as "6m" | "12m" | "24m")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            >
              <option value="24m">24m</option>
              <option value="12m">12m</option>
              <option value="6m">6m</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">FMP news cap</label>
            <input
              type="number"
              min={5}
              max={200}
              value={maxNews}
              onChange={(e) => setMaxNews(Math.min(200, Math.max(5, parseInt(e.target.value, 10) || 40)))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Articles to classify (Gemini)
            </label>
            <input
              type="number"
              min={1}
              value={classifyCount}
              onChange={(e) => setClassifyCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={persistToDatabase}
                onChange={(e) => setPersistToDatabase(e.target.checked)}
                className="mt-0.5 rounded border-input"
              />
              <span>
                Save to database (<span className="font-mono">market_content</span> +{" "}
                <span className="font-mono">market_content_entities</span>) after each successful classification
              </span>
            </label>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">FMP from (optional)</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">FMP to (optional)</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:bg-input/30"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedTickers([])}
            className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted"
          >
            Clear ticker selection
          </button>
          <span className="text-xs text-muted-foreground">
            {selectedTickers.length === 0
              ? "Using all loaded symbols when you run (max 40 to FMP)."
              : `${selectedTickers.length} ticker(s) selected for FMP.`}
          </span>
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">
          Rows below are{" "}
          <span className="font-medium text-foreground">active US listings</span> from{" "}
          <span className="font-mono">list_organization_equities_v2</span>{" "}
          <span className="font-mono">(securities.active = true)</span> with{" "}
          <span className="font-mono">entity_id IS NOT NULL</span>. Each row uses a checkbox for
          selection.
        </p>

        <div className="mt-3 max-h-72 overflow-y-auto rounded-md border border-border/80 p-2">
          {equitiesLoading ? (
            <p className="p-2 text-xs text-muted-foreground">Loading equities…</p>
          ) : equities.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">
              No equities found for this org (active stocks with non-null entity_id).
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {equities.map((row) => {
                const checked = selectedTickers.includes(row.ticker);
                return (
                  <li key={row.id}>
                    <label
                      htmlFor={`mcc-t-${row.id}`}
                      className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-xs transition-colors ${
                        checked
                          ? "border-primary/60 bg-primary/5"
                          : "border-border/80 bg-background hover:bg-muted/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={`mcc-t-${row.id}`}
                        checked={checked}
                        onChange={() => toggleTicker(row.ticker)}
                        className="size-4 shrink-0 rounded border-input"
                      />
                      <span className="font-mono text-sm font-medium text-foreground">{row.ticker}</span>
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">{row.name}</span>
                      <span className="shrink-0 rounded border border-border/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        active
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={handleRunFmpGeminiPreview}
          disabled={isRunningPreview || !accessToken || !organizationId}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-secondary px-5 text-sm font-medium text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
        >
          {isRunningPreview ? "Running FMP → Gemini…" : "Fetch FMP news and run Gemini classifier"}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">Process log and results</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Step-by-step trace (FMP request, row counts, each Gemini call). Parsed JSON appears under
          results when the model returns valid JSON.
        </p>
        {lastPreview == null ? (
          <p className="mt-4 text-sm text-muted-foreground">Run the preview above to populate this section.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Summary</p>
              <p className="mt-1 font-mono text-xs text-foreground">
                tickers_used: {lastPreview.tickers_used.join(", ") || "(none)"} — FMP rows:{" "}
                {lastPreview.fmp_articles_considered} — Gemini articles: {lastPreview.results.length}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Steps</p>
              <div className="max-h-72 overflow-y-auto rounded-md border border-border/80 bg-muted/30 p-3 font-mono text-[11px] leading-relaxed">
                {lastPreview.steps.map((s, i) => (
                  <div
                    key={`${s.ts}-${i}`}
                    className={
                      s.level === "error"
                        ? "text-red-600 dark:text-red-400"
                        : s.level === "warn"
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-foreground"
                    }
                  >
                    <span className="text-muted-foreground">{s.ts}</span> [{s.level}] {s.message}
                    {s.detail != null ? (
                      <pre className="mt-1 whitespace-pre-wrap break-all text-muted-foreground">
                        {JSON.stringify(s.detail, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Classifier output (per article)</p>
              <div className="space-y-3">
                {lastPreview.results.map((r, idx) => (
                  <div
                    key={`${r.symbol ?? "x"}-${idx}`}
                    className="rounded-md border border-border/80 bg-muted/20 p-3"
                  >
                    <p className="font-mono text-xs text-foreground">
                      {r.symbol ?? "?"} — {r.title ?? "(no title)"}
                    </p>
                    {r.error ? (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">{r.error}</p>
                    ) : null}
                    {r.gemini_usage != null && Object.keys(r.gemini_usage).length > 0 ? (
                      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                        tokens: prompt {r.gemini_usage.promptTokenCount ?? "—"} · candidates{" "}
                        {r.gemini_usage.candidatesTokenCount ?? "—"} · total{" "}
                        {r.gemini_usage.totalTokenCount ?? "—"}
                        {typeof r.gemini_attempts === "number" && r.gemini_attempts > 1
                          ? ` · HTTP attempts: ${r.gemini_attempts}`
                          : null}
                      </p>
                    ) : null}
                    {r.persisted_market_content_id ? (
                      <p className="mt-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                        Supabase: market_content.id = {r.persisted_market_content_id}
                        {r.persist_replaced_existing ? " (replaced existing same source+url)" : ""}
                      </p>
                    ) : null}
                    {r.persist_error ? (
                      <p className="mt-2 font-mono text-[11px] text-amber-800 dark:text-amber-300">
                        Persist: {r.persist_error}
                      </p>
                    ) : null}
                    {r.llm_json != null ? (
                      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] text-foreground">
                        {JSON.stringify(r.llm_json, null, 2)}
                      </pre>
                    ) : r.llm_raw_text ? (
                      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] text-muted-foreground">
                        {r.llm_raw_text}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const TABS: { id: TabId; label: string }[] = [
  { id: "hedge-fund-quality", label: "Hedge Fund Quality" },
  { id: "fundamental-constriction", label: "Fundamental constriction" },
  { id: "political-score", label: "Political score" },
  { id: "insider-precision", label: "Insider precision" },
  { id: "warren-buffett-score", label: "Warren Buffett Score" },
  { id: "burry-score", label: "Burry Score" },
  { id: "druckenmiller-score", label: "Druckenmiller Score" },
  { id: "wood-score", label: "Wood Score" },
  { id: "graham-score", label: "Graham Score" },
  { id: "lynch-score", label: "Lynch Score" },
  { id: "events-news-classifier", label: "Events / news" },
  { id: "net-exposure", label: "Net exposure" },
  { id: "alpha-galangal-weights", label: "Committee Weights" },
  { id: "alpha-galangal-prompt", label: "Committee Prompts" },
  { id: "taxonomy-structural-growth", label: "Taxonomy structural growth" },
];

export default function FormulasPage() {
  const { accessToken } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("hedge-fund-quality");

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Formulas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
          Edit formula weights and LLM prompts for the scoring system.
          </p>
        </header>

        <div
          className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground"
          role="note"
        >
          <p className="font-medium">Formula & factor governance</p>
          <p className="mt-1 text-muted-foreground">
            Super admins manage <strong>origin</strong>, <strong>visibility</strong>, and{" "}
            <strong>lock</strong> on database formulas and factors under{" "}
            <Link
              href={`${ADMIN_DASHBOARD}/configuration?tab=ai-assistant&assistant=governance&gov=formulas`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Configuration → AI assistant → Formula / factor governance
            </Link>
            .
          </p>
        </div>

        <div className="flex items-start gap-6">
          <nav className="w-52 shrink-0 rounded-lg border border-border bg-muted/40 p-1.5">
            <ul className="space-y-0.5">
              {TABS.map((tab) => (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 flex-1">
            {activeTab === "hedge-fund-quality" && (
              <HedgeFundQualityTab
                accessToken={accessToken}
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
            {activeTab === "fundamental-constriction" && (
              <FundamentalConstrictionTab
                accessToken={accessToken}
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
            {activeTab === "political-score" && (
              <PoliticalScoreTab
                accessToken={accessToken}
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
            {activeTab === "insider-precision" && (
              <InsiderPrecisionTab
                accessToken={accessToken}
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
            {activeTab === "warren-buffett-score" && (
              <WarrenBuffettPromptTab
                accessToken={accessToken}
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
            {activeTab === "burry-score" && (
              <BurryPromptTab
                accessToken={accessToken}
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
            {activeTab === "druckenmiller-score" && (
              <DruckenmillerPromptTab
                accessToken={accessToken}
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
            {activeTab === "wood-score" && (
              <WoodPromptTab
                accessToken={accessToken}
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
            {activeTab === "graham-score" && (
              <GrahamPromptTab
                accessToken={accessToken}
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
            {activeTab === "lynch-score" && (
              <LynchPromptTab
                accessToken={accessToken}
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
            {activeTab === "events-news-classifier" && (
              <MarketContentClassifierPromptTab
                accessToken={accessToken}
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
            {activeTab === "net-exposure" && (
              <NetExposureDirectionWeightsTab
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
            {activeTab === "alpha-galangal-weights" && (
              <AlphaGalangalWeightsTab
                accessToken={accessToken}
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
            {activeTab === "alpha-galangal-prompt" && (
              <AlphaGalangalPromptTab
                accessToken={accessToken}
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
            {activeTab === "taxonomy-structural-growth" && (
              <TaxonomyStructuralGrowthTab
                accessToken={accessToken}
                showSuccess={showSuccess}
                showError={showError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
