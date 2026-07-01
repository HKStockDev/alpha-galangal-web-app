"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  changeOrganizationSubscriptionPlan,
  createOrganizationBillingCheckout,
  createOrganizationBillingPortal,
  endOrganizationTrialEarly,
  fetchMyOrganizations,
  fetchOrganizationBillingPlans,
  fetchOrganizationBillingStatus,
  type BillingPlanCatalogItem,
  type OrganizationBillingStatus,
} from "@/lib/api";
import type { BillingCycle } from "@/lib/billing-plan-catalog";
import {
  DEFAULT_TRIAL_DAYS,
  TEAM_PLAN_MAX_SEATS,
  TRIAL_PLAN_KEY,
  type BillingPortalFlow,
} from "@/lib/billing-plans";
import { OrgBillingPricing } from "@/components/billing/org-billing-pricing";
import { SecondaryButton } from "@/components/ui-kit/buttons";
import { FormHelperText } from "@/components/ui-kit/forms";
import { SectionCard } from "@/components/ui-kit/cards";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

function billingCycleFromPlanKey(planKey: string | null | undefined): BillingCycle {
  if (!planKey) return "yearly";
  if (planKey.includes("_annual") || planKey.includes("_year")) return "yearly";
  return "monthly";
}

const PORTAL_RETURN_MESSAGES: Record<string, string> = {
  canceled: "Subscription cancellation was submitted in Stripe.",
  updated: "Your plan change was submitted in Stripe.",
  payment_updated: "Your payment method was updated in Stripe.",
  invoices: "Returned from Stripe billing history.",
};

export function OrgBillingSettings() {
  const { accessToken, user } = useAuth();
  const isPlatformAdmin = Boolean(user?.is_platform_admin);
  const { showError, showSuccess } = useToast();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [billingStatus, setBillingStatus] = useState<OrganizationBillingStatus | null>(null);
  const [planCatalog, setPlanCatalog] = useState<BillingPlanCatalogItem[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [teamSeats, setTeamSeats] = useState(2);
  const [busyPlanKey, setBusyPlanKey] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);
  const [portalFlowLoading, setPortalFlowLoading] = useState<BillingPortalFlow | null>(null);

  const reloadBilling = useCallback(async () => {
    if (!accessToken || !organizationId) return;
    const [status, catalog] = await Promise.all([
      fetchOrganizationBillingStatus(accessToken, organizationId),
      fetchOrganizationBillingPlans(accessToken, organizationId),
    ]);
    setBillingStatus(status);
    setPlanCatalog(catalog);
    if (status.subscription?.seat_quantity) {
      setTeamSeats(status.subscription.seat_quantity);
    }
    setBillingCycle(billingCycleFromPlanKey(status.subscription?.plan_key));
  }, [accessToken, organizationId]);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    if (isPlatformAdmin) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const orgs = await fetchMyOrganizations(accessToken);
        if (cancelled) return;
        if (orgs.length === 0) {
          setOrganizationId(null);
          setIsOrgAdmin(false);
          setOrganizationName(null);
          setBillingStatus(null);
          setPlanCatalog([]);
        } else {
          const first = orgs[0];
          setOrganizationId(first.id);
          setOrganizationName(first.name);
          setIsOrgAdmin(first.role === "org_admin");
          if (first.role === "org_admin") {
            const [status, catalog] = await Promise.all([
              fetchOrganizationBillingStatus(accessToken, first.id),
              fetchOrganizationBillingPlans(accessToken, first.id),
            ]);
            if (!cancelled) {
              setBillingStatus(status);
              setPlanCatalog(catalog);
              if (status.subscription?.seat_quantity) {
                setTeamSeats(status.subscription.seat_quantity);
              }
              setBillingCycle(billingCycleFromPlanKey(status.subscription?.plan_key));
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          showError(err instanceof Error ? err.message : "Failed to load billing");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isPlatformAdmin, showError]);

  useEffect(() => {
    const flag = searchParams.get("billing");
    if (!flag || !PORTAL_RETURN_MESSAGES[flag]) return;
    if (isPlatformAdmin) return;
    showSuccess(PORTAL_RETURN_MESSAGES[flag]);
    if (accessToken && organizationId && isOrgAdmin) {
      void reloadBilling().catch((err) => {
        showError(err instanceof Error ? err.message : "Failed to refresh billing status");
      });
    }
  }, [
    searchParams,
    showSuccess,
    showError,
    accessToken,
    organizationId,
    isOrgAdmin,
    isPlatformAdmin,
    reloadBilling,
  ]);

  const startCheckout = useCallback(
    async (planKey: string, perSeat: boolean, startTrial?: boolean) => {
      if (!accessToken || !organizationId) return;
      setBusyPlanKey(startTrial ? TRIAL_PLAN_KEY : planKey);
      try {
        const { url } = await createOrganizationBillingCheckout(accessToken, organizationId, {
          plan_key: planKey,
          ...(perSeat ? { seat_quantity: teamSeats } : {}),
          ...(startTrial ? { start_trial: true } : {}),
        });
        window.location.assign(url);
      } catch (err) {
        showError(err instanceof Error ? err.message : "Could not start checkout");
        setBusyPlanKey(null);
      }
    },
    [accessToken, organizationId, teamSeats, showError]
  );

  const changePlan = useCallback(
    async (planKey: string, perSeat: boolean) => {
      if (!accessToken || !organizationId) return;
      setBusyPlanKey(planKey);
      setChangingPlan(true);
      try {
        await changeOrganizationSubscriptionPlan(accessToken, organizationId, {
          plan_key: planKey,
          ...(perSeat ? { seat_quantity: teamSeats } : {}),
        });
        showSuccess(
          billingStatus?.subscription?.status === "trialing"
            ? "Plan updated and billing started. Your trial ended."
            : "Plan updated. Billing changes may take a moment to appear."
        );
        await reloadBilling();
      } catch (err) {
        showError(err instanceof Error ? err.message : "Could not change plan");
      } finally {
        setBusyPlanKey(null);
        setChangingPlan(false);
      }
    },
    [accessToken, organizationId, teamSeats, showError, showSuccess, reloadBilling]
  );

  const onSelectPlan = useCallback(
    (planKey: string, perSeat: boolean) => {
      const hasSubscription = billingStatus?.subscription != null;
      if (hasSubscription) {
        void changePlan(planKey, perSeat);
      } else {
        void startCheckout(planKey, perSeat);
      }
    },
    [billingStatus?.subscription, changePlan, startCheckout]
  );

  const startTrialCheckout = useCallback(async () => {
    await startCheckout(TRIAL_PLAN_KEY, false, true);
  }, [startCheckout]);

  const endTrialEarly = useCallback(async () => {
    if (!accessToken || !organizationId) return;
    setBusyPlanKey("end_trial");
    try {
      await endOrganizationTrialEarly(accessToken, organizationId);
      showSuccess("Subscription started. Your trial ended and billing is active.");
      await reloadBilling();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not start subscription");
    } finally {
      setBusyPlanKey(null);
    }
  }, [accessToken, organizationId, showError, showSuccess, reloadBilling]);

  const openPortal = useCallback(
    async (flow: BillingPortalFlow) => {
      if (!accessToken || !organizationId) return;
      setPortalFlowLoading(flow);
      try {
        const { url } = await createOrganizationBillingPortal(accessToken, organizationId, { flow });
        window.location.assign(url);
      } catch (err) {
        showError(err instanceof Error ? err.message : "Could not open billing portal");
        setPortalFlowLoading(null);
      }
    },
    [accessToken, organizationId, showError]
  );

  useEffect(() => {
    if (isPlatformAdmin) return;
    const planHint = searchParams.get("plan");
    if (!planHint) return;
    const el = document.getElementById(`plan-card-${planHint}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [searchParams, planCatalog, isPlatformAdmin]);

  const initialCycleFromUrl = useMemo(() => {
    const planHint = searchParams.get("plan");
    return billingCycleFromPlanKey(planHint);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("plan")) {
      setBillingCycle(initialCycleFromUrl);
    }
  }, [searchParams, initialCycleFromUrl]);

  if (loading) {
    return (
      <SectionCard id="billing">
        <LoadingSkeleton variant="card" lines={4} />
      </SectionCard>
    );
  }

  if (isPlatformAdmin) {
    return (
      <SectionCard id="billing">
        <h2 className="text-base font-semibold text-foreground">Billing</h2>
        <FormHelperText className="mt-2">
          Platform administrators have full access to all product features and entitlements
          without an organization subscription. Plan selection and Stripe billing are not
          required for your account.
        </FormHelperText>
      </SectionCard>
    );
  }

  if (!organizationId) {
    return null;
  }

  if (!isOrgAdmin) {
    return (
      <SectionCard id="billing">
        <h2 className="text-base font-semibold text-foreground">Billing</h2>
        <FormHelperText className="mt-1">
          Only organization admins can manage subscriptions for{" "}
          {organizationName ?? "your organization"}.
        </FormHelperText>
      </SectionCard>
    );
  }

  const subscription = billingStatus?.subscription ?? null;
  const hasActiveSubscription = subscription != null;
  const isTrialing = subscription?.status === "trialing";
  const trialEndLabel = formatDate(subscription?.trial_end ?? null);
  const canManageInStripe = billingStatus?.can_manage_in_stripe ?? false;
  const portalBusy = portalFlowLoading !== null;
  const anyBusy = busyPlanKey !== null || portalBusy;

  return (
    <div id="billing" className="space-y-6">
      <SectionCard>
        <h2 className="text-base font-semibold text-foreground">Billing &amp; subscription</h2>
        {organizationName ? (
          <FormHelperText className="mt-1">Organization: {organizationName}</FormHelperText>
        ) : null}

        {hasActiveSubscription ? (
          <SubscriptionSummary subscription={subscription} />
        ) : (
          <p className="mt-4 text-sm text-foreground">No active subscription yet.</p>
        )}

        {canManageInStripe ? (
          <BillingStripeActions
            subscription={subscription}
            hasActiveSubscription={hasActiveSubscription}
            portalFlowLoading={portalFlowLoading}
            anyBusy={anyBusy}
            onOpenPortal={openPortal}
          />
        ) : null}
      </SectionCard>

      <SectionCard>
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-lg font-semibold text-foreground">
            {hasActiveSubscription ? "Change your plan" : "Choose a plan"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isTrialing
              ? `Your free trial runs until ${trialEndLabel ?? "the trial end date"}. You can keep using the product until then — billing starts automatically when the trial ends. To pay sooner, use Start subscription now on your current plan or Subscribe now on another plan.`
              : hasActiveSubscription
                ? "Select a plan below to switch billing cycle or tier. Upgrades and monthly/yearly changes are prorated; downgrades take effect without proration credit."
                : `Compare plans below. Start a ${DEFAULT_TRIAL_DAYS}-day trial on Professional (monthly) or subscribe directly. Checkout uses Stripe's secure payment page.`}
          </p>
        </div>

        {planCatalog.length > 0 ? (
          <div className="mt-8">
            <OrgBillingPricing
              catalog={planCatalog}
              billingCycle={billingCycle}
              onBillingCycleChange={setBillingCycle}
              currentPlanKey={subscription?.plan_key ?? null}
              teamSeats={teamSeats}
              onTeamSeatsChange={setTeamSeats}
              teamSeatsMax={TEAM_PLAN_MAX_SEATS}
              freeTrialAvailable={billingStatus?.free_trial_available ?? false}
              hasActiveSubscription={hasActiveSubscription}
              isTrialing={isTrialing}
              busyPlanKey={busyPlanKey}
              changingPlan={changingPlan}
              anyBusy={anyBusy}
              onSelectPlan={onSelectPlan}
              onStartTrial={() => void startTrialCheckout()}
              onEndTrial={() => void endTrialEarly()}
            />
          </div>
        ) : (
          <LoadingSkeleton variant="card" lines={3} className="mt-6" />
        )}
      </SectionCard>
    </div>
  );
}

function SubscriptionSummary({
  subscription,
}: {
  subscription: NonNullable<OrganizationBillingStatus["subscription"]>;
}) {
  const periodEnd = formatDate(subscription.current_period_end);
  const trialEnd = formatDate(subscription.trial_end);

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-sm">
      <ul className="space-y-1 text-muted-foreground">
        <li>
          Plan:{" "}
          <span className="font-medium text-foreground">
            {subscription.plan_display_name ?? subscription.plan_key}
          </span>
        </li>
        <li>
          Status:{" "}
          <span className="capitalize font-medium text-foreground">
            {formatStatus(subscription.status)}
          </span>
        </li>
        {subscription.plan_key.startsWith("team_") ? (
          <li>
            Seats:{" "}
            <span className="font-medium text-foreground">
              {subscription.seat_quantity}
            </span>
            <span className="text-muted-foreground">
              {" "}
              (billed seats follow active team members after invites are accepted)
            </span>
          </li>
        ) : subscription.seat_quantity > 1 ? (
          <li>
            Seats:{" "}
            <span className="font-medium text-foreground">{subscription.seat_quantity}</span>
          </li>
        ) : null}
        {subscription.status === "trialing" && trialEnd ? (
          <li>
            Trial ends: <span className="font-medium text-foreground">{trialEnd}</span>
            <span className="text-muted-foreground">
              {" "}
              — full access until then; subscribe below only if you want to pay earlier.
            </span>
          </li>
        ) : null}
        {periodEnd ? (
          <li>
            Current period ends:{" "}
            <span className="font-medium text-foreground">{periodEnd}</span>
          </li>
        ) : null}
        {subscription.cancel_at_period_end ? (
          <li className="text-amber-700 dark:text-amber-400">
            Cancellation scheduled — access continues until the period ends.
          </li>
        ) : null}
        {subscription.status === "past_due" ? (
          <li className="text-destructive font-medium">
            Payment failed — update your payment method below.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

/** CON-154: subscription actions + payment history (Stripe portal; history available without active sub). */
function BillingStripeActions({
  subscription,
  hasActiveSubscription,
  portalFlowLoading,
  anyBusy,
  onOpenPortal,
}: {
  subscription: OrganizationBillingStatus["subscription"];
  hasActiveSubscription: boolean;
  portalFlowLoading: BillingPortalFlow | null;
  anyBusy: boolean;
  onOpenPortal: (flow: BillingPortalFlow) => void;
}) {
  const isPastDue = subscription?.status === "past_due";

  return (
    <div className="mt-4 space-y-2">
      {hasActiveSubscription && subscription ? (
        <div className="flex flex-wrap gap-2">
          {!subscription.cancel_at_period_end ? (
            <PortalButton
              label={
                subscription.status === "trialing" ? "Cancel trial" : "Cancel subscription"
              }
              flow="subscription_cancel"
              loadingFlow={portalFlowLoading}
              disabled={anyBusy}
              onOpen={onOpenPortal}
            />
          ) : null}
          <PortalButton
            label="Update payment method"
            flow="payment_method_update"
            loadingFlow={portalFlowLoading}
            disabled={anyBusy}
            onOpen={onOpenPortal}
          />
          {isPastDue ? (
            <FormHelperText className="w-full">
              Past-due subscriptions: update your card in Stripe, then payment will retry
              automatically.
            </FormHelperText>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <PortalButton
          label="View payment history"
          flow="invoice_history"
          loadingFlow={portalFlowLoading}
          disabled={anyBusy}
          onOpen={onOpenPortal}
        />
      </div>
      <FormHelperText>
        {hasActiveSubscription
          ? "Payment history opens in Stripe’s secure billing portal."
          : "No active subscription. You can still view past invoices and payments in Stripe."}
      </FormHelperText>
    </div>
  );
}

function PortalButton({
  label,
  flow,
  loadingFlow,
  disabled,
  onOpen,
}: {
  label: string;
  flow: BillingPortalFlow;
  loadingFlow: BillingPortalFlow | null;
  disabled: boolean;
  onOpen: (flow: BillingPortalFlow) => void;
}) {
  const busy = loadingFlow === flow;
  return (
    <SecondaryButton
      type="button"
      disabled={disabled}
      onClick={() => void onOpen(flow)}
    >
      {busy ? "Opening Stripe…" : label}
    </SecondaryButton>
  );
}
