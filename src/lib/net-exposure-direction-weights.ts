import type { NetExposureDirectionWeightsInput } from "@/lib/api";

const STORAGE_KEY = "ag_net_exposure_direction_weights_v1";

export const DEFAULT_NET_EXPOSURE_DIRECTION_WEIGHTS: NetExposureDirectionWeightsInput = {
  beneficiary: 1.0,
  supplier: 0.7,
  customer: 0.5,
  dependent: 0.5,
};

function isValidWeight(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

/** Reads persisted direction weights for net exposure scoring (browser only). */
export function readNetExposureDirectionWeights(): NetExposureDirectionWeightsInput {
  if (typeof window === "undefined") {
    return { ...DEFAULT_NET_EXPOSURE_DIRECTION_WEIGHTS };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NET_EXPOSURE_DIRECTION_WEIGHTS };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      beneficiary: isValidWeight(parsed.beneficiary)
        ? parsed.beneficiary
        : DEFAULT_NET_EXPOSURE_DIRECTION_WEIGHTS.beneficiary!,
      supplier: isValidWeight(parsed.supplier)
        ? parsed.supplier
        : DEFAULT_NET_EXPOSURE_DIRECTION_WEIGHTS.supplier!,
      customer: isValidWeight(parsed.customer)
        ? parsed.customer
        : DEFAULT_NET_EXPOSURE_DIRECTION_WEIGHTS.customer!,
      dependent: isValidWeight(parsed.dependent)
        ? parsed.dependent
        : DEFAULT_NET_EXPOSURE_DIRECTION_WEIGHTS.dependent!,
    };
  } catch {
    return { ...DEFAULT_NET_EXPOSURE_DIRECTION_WEIGHTS };
  }
}

export function writeNetExposureDirectionWeights(
  weights: NetExposureDirectionWeightsInput
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
}
