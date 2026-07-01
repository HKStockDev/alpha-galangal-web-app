import { describe, expect, it } from 'vitest';
import { parseAssistantApiError } from './org-assistant-api-errors';

function apiError(status: number, body: Record<string, unknown>): Error & { status: number; body: Record<string, unknown> } {
  const err = new Error('request failed') as Error & {
    status: number;
    body: Record<string, unknown>;
  };
  err.status = status;
  err.body = body;
  return err;
}

describe('parseAssistantApiError subscription/credit matrix', () => {
  const cases = [
    {
      name: '402 without insufficient_credits maps to billing',
      error: apiError(402, { message: 'Subscription required' }),
      expected: { kind: 'billing', billingHref: true, creditsHref: undefined },
    },
    {
      name: '428 without insufficient_credits maps to billing',
      error: apiError(428, { message: 'Precondition required' }),
      expected: { kind: 'billing', billingHref: true, creditsHref: undefined },
    },
    {
      name: '402 with insufficient_credits maps to credits',
      error: apiError(402, {
        code: 'CAPABILITY_BLOCKED',
        reason: 'insufficient_credits',
        message: 'Not enough credits',
      }),
      expected: { kind: 'credits', billingHref: undefined, creditsHref: true },
    },
    {
      name: '428 with insufficient_credits maps to credits',
      error: apiError(428, {
        code: 'CAPABILITY_BLOCKED',
        reason: 'insufficient_credits',
      }),
      expected: { kind: 'credits', billingHref: undefined, creditsHref: true },
    },
    {
      name: '503 maps to unavailable',
      error: apiError(503, { message: 'Assistant offline' }),
      expected: { kind: 'unavailable', billingHref: undefined, creditsHref: undefined },
    },
    {
      name: 'CAPABILITY_BLOCKED blocked_by_plan maps to capability with billing link',
      error: apiError(403, {
        code: 'CAPABILITY_BLOCKED',
        reason: 'blocked_by_plan',
        message: 'Upgrade plan',
      }),
      expected: { kind: 'capability', billingHref: true, creditsHref: undefined },
    },
    {
      name: 'CAPABILITY_BLOCKED disabled_by_policy maps to capability',
      error: apiError(403, {
        code: 'CAPABILITY_BLOCKED',
        reason: 'disabled_by_policy',
        message: 'Disabled',
      }),
      expected: { kind: 'capability', billingHref: false, creditsHref: undefined },
    },
    {
      name: 'CAPABILITY_BLOCKED insufficient_credits without 402 status maps to credits',
      error: apiError(403, {
        code: 'CAPABILITY_BLOCKED',
        reason: 'insufficient_credits',
        message: 'Out of credits',
      }),
      expected: { kind: 'credits', billingHref: undefined, creditsHref: true },
    },
    {
      name: 'unknown errors map to generic',
      error: new Error('Network error'),
      expected: { kind: 'generic', billingHref: undefined, creditsHref: undefined },
    },
  ] as const;

  for (const { name, error, expected } of cases) {
    it(name, () => {
      const parsed = parseAssistantApiError(error);
      expect(parsed.kind).toBe(expected.kind);
      if (expected.billingHref === true) {
        expect(parsed.billingHref).toBe(true);
      } else if (expected.billingHref === false) {
        expect(parsed.billingHref).toBeFalsy();
      }
      if (expected.creditsHref === true) {
        expect(parsed.creditsHref).toBe(true);
      }
    });
  }
});
