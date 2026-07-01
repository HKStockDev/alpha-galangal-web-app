export type AssistantSendErrorKind =
  | "generic"
  | "billing"
  | "credits"
  | "capability"
  | "unavailable";

export type ParsedAssistantError = {
  kind: AssistantSendErrorKind;
  message: string;
  billingHref?: boolean;
  creditsHref?: boolean;
};

type ErrorBody = {
  message?: string;
  code?: string;
  reason?: string;
  statusCode?: number;
};

export function parseAssistantApiError(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): ParsedAssistantError {
  const err = error as Error & { status?: number; body?: ErrorBody };
  const status = err.status;
  const body = err.body ?? {};
  const code = body.code;
  const reason = body.reason;
  const message =
    (typeof body.message === "string" && body.message) ||
    (error instanceof Error ? error.message : fallback);

  if (status === 402 || status === 428) {
    if (code === "CAPABILITY_BLOCKED" && reason === "insufficient_credits") {
      return {
        kind: "credits",
        message: message || "You do not have enough credits for this message.",
        creditsHref: true,
      };
    }
    return {
      kind: "billing",
      message:
        message ||
        "An active subscription or trial is required to use the assistant.",
      billingHref: true,
    };
  }

  if (status === 503) {
    return {
      kind: "unavailable",
      message: message || "The AI assistant is temporarily unavailable.",
    };
  }

  if (code === "CAPABILITY_BLOCKED") {
    if (reason === "insufficient_credits") {
      return {
        kind: "credits",
        message: message || "You do not have enough credits for this message.",
        creditsHref: true,
      };
    }
    return {
      kind: "capability",
      message: message || "This action is not included in your current plan.",
      billingHref: reason === "blocked_by_plan",
      creditsHref: reason === "insufficient_credits",
    };
  }

  return { kind: "generic", message };
}
