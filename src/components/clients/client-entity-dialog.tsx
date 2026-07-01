"use client";

import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import {
  CLIENT_AML_RISK_LEVEL_LABELS,
  CLIENT_AML_RISK_LEVELS,
  CLIENT_ENTITY_TYPE_LABELS,
  CLIENT_ENTITY_TYPES,
  CLIENT_KYC_STATUS_LABELS,
  CLIENT_KYC_STATUSES,
  CLIENT_ONBOARDING_STATUS_LABELS,
  CLIENT_ONBOARDING_STATUSES,
  CLIENT_STATUS_LABELS,
  CLIENT_STATUSES,
  INVESTMENT_OBJECTIVE_LABELS,
  INVESTMENT_OBJECTIVES,
  LIQUIDITY_NEEDS,
  LIQUIDITY_NEEDS_LABELS,
  RELATIONSHIP_ROLE_LABELS,
  RELATIONSHIP_ROLES,
  SPECIAL_PREFERENCE_TAG_LABELS,
  SPECIAL_PREFERENCE_TAGS,
  TAX_ACCOUNT_TYPE_LABELS,
  TAX_ACCOUNT_TYPES,
  TIME_HORIZON_LABELS,
  TIME_HORIZONS,
  type LiquidityNeeds,
  type ClientAmlRiskLevel,
  type ClientEntityType,
  type ClientKycStatus,
  type ClientOnboardingStatus,
  type ClientStatus,
  type RelationshipRole,
  type SpecialPreferenceTag,
  type TaxAccountType,
  type TimeHorizon,
} from "@/lib/api";
import type { EntityFormState } from "@/lib/clients-entity-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrimaryButton, SecondaryButton } from "@/components/ui-kit/buttons";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";

type ClientEntityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientDisplayName: string;
  editingEntityId: string | null;
  entityForm: EntityFormState;
  setEntityForm: Dispatch<SetStateAction<EntityFormState>>;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function ClientEntityDialog({
  open,
  onOpenChange,
  clientDisplayName,
  editingEntityId,
  entityForm,
  setEntityForm,
  onSubmit,
}: ClientEntityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,800px)] flex-col gap-0 overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingEntityId ? "Edit entity" : "New entity"}</DialogTitle>
          <DialogDescription>
            {editingEntityId
              ? `Update this entity for ${clientDisplayName}.`
              : `Add an entity for ${clientDisplayName}.`}
          </DialogDescription>
        </DialogHeader>
        <form
          id="entity-form-modal"
          className="grid min-h-0 flex-1 gap-4 overflow-y-auto py-2 pr-1"
          onSubmit={onSubmit}
        >
          <div className="space-y-2">
            <FormLabel htmlFor="entity-modal-display-name">Display name</FormLabel>
            <FormInput
              id="entity-modal-display-name"
              value={entityForm.display_name}
              onChange={(e) => setEntityForm((f) => ({ ...f, display_name: e.target.value }))}
              placeholder="Display name"
              autoComplete="name"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-entity-type">Entity type</FormLabel>
              <select
                id="entity-modal-entity-type"
                value={entityForm.entity_type}
                onChange={(e) =>
                  setEntityForm((f) => ({
                    ...f,
                    entity_type: e.target.value as ClientEntityType | "",
                  }))
                }
                className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Not set</option>
                {CLIENT_ENTITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {CLIENT_ENTITY_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-legal-name">Legal name</FormLabel>
              <FormInput
                id="entity-modal-legal-name"
                value={entityForm.legal_name}
                onChange={(e) => setEntityForm((f) => ({ ...f, legal_name: e.target.value }))}
                placeholder="Optional legal name"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-dob">Date of birth</FormLabel>
              <FormInput
                id="entity-modal-dob"
                type="date"
                value={entityForm.date_of_birth}
                onChange={(e) => setEntityForm((f) => ({ ...f, date_of_birth: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-inc-date">Incorporation date</FormLabel>
              <FormInput
                id="entity-modal-inc-date"
                type="date"
                value={entityForm.incorporation_date}
                onChange={(e) =>
                  setEntityForm((f) => ({ ...f, incorporation_date: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-tax-id">Tax ID</FormLabel>
              <FormInput
                id="entity-modal-tax-id"
                value={entityForm.tax_id}
                onChange={(e) => setEntityForm((f) => ({ ...f, tax_id: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-national-id">National ID</FormLabel>
              <FormInput
                id="entity-modal-national-id"
                value={entityForm.national_id}
                onChange={(e) => setEntityForm((f) => ({ ...f, national_id: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-passport">Passport no</FormLabel>
              <FormInput
                id="entity-modal-passport"
                value={entityForm.passport_no}
                onChange={(e) => setEntityForm((f) => ({ ...f, passport_no: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-country-residence">Country of residence</FormLabel>
              <FormInput
                id="entity-modal-country-residence"
                value={entityForm.country_of_residence}
                onChange={(e) =>
                  setEntityForm((f) => ({ ...f, country_of_residence: e.target.value }))
                }
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-country-inc">Country of incorporation</FormLabel>
              <FormInput
                id="entity-modal-country-inc"
                value={entityForm.country_of_incorporation}
                onChange={(e) =>
                  setEntityForm((f) => ({ ...f, country_of_incorporation: e.target.value }))
                }
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-tax-residency">Tax residency</FormLabel>
              <FormInput
                id="entity-modal-tax-residency"
                value={entityForm.tax_residency}
                onChange={(e) => setEntityForm((f) => ({ ...f, tax_residency: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-kyc-status">KYC status</FormLabel>
              <select
                id="entity-modal-kyc-status"
                value={entityForm.kyc_status}
                onChange={(e) =>
                  setEntityForm((f) => ({ ...f, kyc_status: e.target.value as ClientKycStatus | "" }))
                }
                className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Not set</option>
                {CLIENT_KYC_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {CLIENT_KYC_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-kyc-verified-at">KYC verified at</FormLabel>
              <FormInput
                id="entity-modal-kyc-verified-at"
                type="datetime-local"
                value={entityForm.kyc_verified_at}
                onChange={(e) => setEntityForm((f) => ({ ...f, kyc_verified_at: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-aml-risk">AML risk level</FormLabel>
              <select
                id="entity-modal-aml-risk"
                value={entityForm.aml_risk_level}
                onChange={(e) =>
                  setEntityForm((f) => ({
                    ...f,
                    aml_risk_level: e.target.value as ClientAmlRiskLevel | "",
                  }))
                }
                className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Not set</option>
                {CLIENT_AML_RISK_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {CLIENT_AML_RISK_LEVEL_LABELS[level]}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={entityForm.pep_flag}
                onChange={(e) => setEntityForm((f) => ({ ...f, pep_flag: e.target.checked }))}
              />
              PEP flag
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={entityForm.sanctions_flag}
                onChange={(e) =>
                  setEntityForm((f) => ({ ...f, sanctions_flag: e.target.checked }))
                }
              />
              Sanctions flag
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-parent-entity">Parent entity ID</FormLabel>
              <FormInput
                id="entity-modal-parent-entity"
                value={entityForm.parent_entity_id}
                onChange={(e) => setEntityForm((f) => ({ ...f, parent_entity_id: e.target.value }))}
                placeholder="UUID"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-beneficial-owner">Beneficial owner of</FormLabel>
              <FormInput
                id="entity-modal-beneficial-owner"
                value={entityForm.beneficial_owner_of}
                onChange={(e) =>
                  setEntityForm((f) => ({ ...f, beneficial_owner_of: e.target.value }))
                }
                placeholder="UUID"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-ownership-percent">Ownership %</FormLabel>
              <FormInput
                id="entity-modal-ownership-percent"
                inputMode="decimal"
                value={entityForm.ownership_percent}
                onChange={(e) => setEntityForm((f) => ({ ...f, ownership_percent: e.target.value }))}
                placeholder="0-100"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-onboarding-status">Onboarding status</FormLabel>
              <select
                id="entity-modal-onboarding-status"
                value={entityForm.onboarding_status}
                onChange={(e) =>
                  setEntityForm((f) => ({
                    ...f,
                    onboarding_status: e.target.value as ClientOnboardingStatus | "",
                  }))
                }
                className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Not set</option>
                {CLIENT_ONBOARDING_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {CLIENT_ONBOARDING_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-client-status">Client status</FormLabel>
              <select
                id="entity-modal-client-status"
                value={entityForm.client_status}
                onChange={(e) =>
                  setEntityForm((f) => ({ ...f, client_status: e.target.value as ClientStatus | "" }))
                }
                className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Not set</option>
                {CLIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {CLIENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-closed-at">Closed at</FormLabel>
              <FormInput
                id="entity-modal-closed-at"
                type="datetime-local"
                value={entityForm.closed_at}
                onChange={(e) => setEntityForm((f) => ({ ...f, closed_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-version">Version</FormLabel>
              <FormInput
                id="entity-modal-version"
                inputMode="numeric"
                value={entityForm.version}
                onChange={(e) => setEntityForm((f) => ({ ...f, version: e.target.value }))}
                placeholder="Optional integer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="entity-modal-closure-reason">Closure reason</FormLabel>
            <textarea
              id="entity-modal-closure-reason"
              value={entityForm.closure_reason}
              onChange={(e) => setEntityForm((f) => ({ ...f, closure_reason: e.target.value }))}
              rows={2}
              placeholder="Optional"
              className="flex min-h-[72px] w-full border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-source-system">Source system</FormLabel>
              <FormInput
                id="entity-modal-source-system"
                value={entityForm.source_system}
                onChange={(e) => setEntityForm((f) => ({ ...f, source_system: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-source-system-id">Source system ID</FormLabel>
              <FormInput
                id="entity-modal-source-system-id"
                value={entityForm.source_system_id}
                onChange={(e) =>
                  setEntityForm((f) => ({ ...f, source_system_id: e.target.value }))
                }
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-created-by">Created by (UUID)</FormLabel>
              <FormInput
                id="entity-modal-created-by"
                value={entityForm.created_by}
                onChange={(e) => setEntityForm((f) => ({ ...f, created_by: e.target.value }))}
                placeholder="Optional UUID"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-updated-by">Updated by (UUID)</FormLabel>
              <FormInput
                id="entity-modal-updated-by"
                value={entityForm.updated_by}
                onChange={(e) => setEntityForm((f) => ({ ...f, updated_by: e.target.value }))}
                placeholder="Optional UUID"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-relationship">Relationship role</FormLabel>
              <select
                id="entity-modal-relationship"
                value={entityForm.relationship_role}
                onChange={(e) =>
                  setEntityForm((f) => ({
                    ...f,
                    relationship_role: e.target.value as RelationshipRole | "",
                  }))
                }
                className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Not set</option>
                {RELATIONSHIP_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {RELATIONSHIP_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-relationship-other">Role detail (if other)</FormLabel>
              <FormInput
                id="entity-modal-relationship-other"
                value={entityForm.relationship_role_other}
                onChange={(e) =>
                  setEntityForm((f) => ({ ...f, relationship_role_other: e.target.value }))
                }
                placeholder="Describe relationship when role is Other"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-risk">Risk score (1–10)</FormLabel>
              <FormInput
                id="entity-modal-risk"
                inputMode="numeric"
                value={entityForm.risk_score}
                onChange={(e) => setEntityForm((f) => ({ ...f, risk_score: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <FormLabel htmlFor="entity-modal-risk-notes">Risk notes</FormLabel>
              <textarea
                id="entity-modal-risk-notes"
                value={entityForm.risk_notes}
                onChange={(e) => setEntityForm((f) => ({ ...f, risk_notes: e.target.value }))}
                rows={2}
                placeholder="Optional"
                className="flex min-h-[72px] w-full border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-time-horizon">Time horizon</FormLabel>
              <select
                id="entity-modal-time-horizon"
                value={entityForm.time_horizon_category}
                onChange={(e) =>
                  setEntityForm((f) => ({
                    ...f,
                    time_horizon_category: e.target.value as TimeHorizon | "",
                  }))
                }
                className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Not set</option>
                {TIME_HORIZONS.map((h) => (
                  <option key={h} value={h}>
                    {TIME_HORIZON_LABELS[h]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-time-horizon-detail">Time horizon detail</FormLabel>
              <FormInput
                id="entity-modal-time-horizon-detail"
                value={entityForm.time_horizon_detail}
                onChange={(e) =>
                  setEntityForm((f) => ({ ...f, time_horizon_detail: e.target.value }))
                }
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel>Investment objectives</FormLabel>
            <div className="grid max-h-40 gap-2 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">
              {INVESTMENT_OBJECTIVES.map((obj) => (
                <label
                  key={obj}
                  className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 rounded border-input"
                    checked={entityForm.investment_objectives.includes(obj)}
                    onChange={() =>
                      setEntityForm((f) => ({
                        ...f,
                        investment_objectives: f.investment_objectives.includes(obj)
                          ? f.investment_objectives.filter((x) => x !== obj)
                          : [...f.investment_objectives, obj],
                      }))
                    }
                  />
                  <span>{INVESTMENT_OBJECTIVE_LABELS[obj]}</span>
                </label>
              ))}
            </div>
            <textarea
              id="entity-modal-investment-notes"
              value={entityForm.investment_objectives_notes}
              onChange={(e) =>
                setEntityForm((f) => ({ ...f, investment_objectives_notes: e.target.value }))
              }
              rows={2}
              placeholder="Notes on objectives (optional)"
              className="flex min-h-[72px] w-full border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-liquidity">Liquidity needs</FormLabel>
              <select
                id="entity-modal-liquidity"
                value={entityForm.liquidity_needs}
                onChange={(e) =>
                  setEntityForm((f) => ({
                    ...f,
                    liquidity_needs: e.target.value as LiquidityNeeds | "",
                  }))
                }
                className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Not set</option>
                {LIQUIDITY_NEEDS.map((ln) => (
                  <option key={ln} value={ln}>
                    {LIQUIDITY_NEEDS_LABELS[ln]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <FormLabel htmlFor="entity-modal-liquidity-notes">Liquidity notes</FormLabel>
              <textarea
                id="entity-modal-liquidity-notes"
                value={entityForm.liquidity_notes}
                onChange={(e) => setEntityForm((f) => ({ ...f, liquidity_notes: e.target.value }))}
                rows={2}
                placeholder="Optional"
                className="flex min-h-[72px] w-full border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel>Tax account types</FormLabel>
            <div className="grid max-h-36 gap-2 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">
              {TAX_ACCOUNT_TYPES.map((t) => (
                <label
                  key={t}
                  className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 rounded border-input"
                    checked={entityForm.tax_account_types.includes(t)}
                    onChange={() =>
                      setEntityForm((f) => ({
                        ...f,
                        tax_account_types: f.tax_account_types.includes(t)
                          ? f.tax_account_types.filter((x) => x !== t)
                          : [...f.tax_account_types, t],
                      }))
                    }
                  />
                  <span>{TAX_ACCOUNT_TYPE_LABELS[t]}</span>
                </label>
              ))}
            </div>
            <textarea
              id="entity-modal-tax-notes"
              value={entityForm.tax_account_notes}
              onChange={(e) => setEntityForm((f) => ({ ...f, tax_account_notes: e.target.value }))}
              rows={2}
              placeholder="Tax account notes (optional)"
              className="flex min-h-[72px] w-full border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Special preferences</FormLabel>
            <div className="grid max-h-36 gap-2 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">
              {SPECIAL_PREFERENCE_TAGS.map((tag) => (
                <label
                  key={tag}
                  className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 rounded border-input"
                    checked={entityForm.special_preferences_tags.includes(tag)}
                    onChange={() =>
                      setEntityForm((f) => ({
                        ...f,
                        special_preferences_tags: f.special_preferences_tags.includes(tag)
                          ? f.special_preferences_tags.filter((x) => x !== tag)
                          : [...f.special_preferences_tags, tag],
                      }))
                    }
                  />
                  <span>{SPECIAL_PREFERENCE_TAG_LABELS[tag]}</span>
                </label>
              ))}
            </div>
            <textarea
              id="entity-modal-special-pref-notes"
              value={entityForm.special_preferences_notes}
              onChange={(e) =>
                setEntityForm((f) => ({ ...f, special_preferences_notes: e.target.value }))
              }
              rows={2}
              placeholder="Special preferences notes (optional)"
              className="flex min-h-[72px] w-full border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-age">Age</FormLabel>
              <FormInput
                id="entity-modal-age"
                inputMode="numeric"
                value={entityForm.age}
                onChange={(e) => setEntityForm((f) => ({ ...f, age: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-life-stage">Life stage</FormLabel>
              <FormInput
                id="entity-modal-life-stage"
                value={entityForm.life_stage}
                onChange={(e) => setEntityForm((f) => ({ ...f, life_stage: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="entity-modal-notes">General notes</FormLabel>
            <textarea
              id="entity-modal-notes"
              value={entityForm.notes}
              onChange={(e) => setEntityForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Optional"
              className="flex min-h-[80px] w-full border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FormLabel htmlFor="entity-modal-display-order">Display order</FormLabel>
              <FormInput
                id="entity-modal-display-order"
                inputMode="numeric"
                value={entityForm.display_order}
                onChange={(e) => setEntityForm((f) => ({ ...f, display_order: e.target.value }))}
                placeholder="Optional sort order"
              />
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="entity-modal-settings-json">Settings (JSON object)</FormLabel>
            <textarea
              id="entity-modal-settings-json"
              value={entityForm.settings_json_text}
              onChange={(e) =>
                setEntityForm((f) => ({ ...f, settings_json_text: e.target.value }))
              }
              rows={6}
              spellCheck={false}
              placeholder="{}"
              className="flex min-h-[120px] w-full border border-input bg-transparent px-3 py-2 font-mono text-xs leading-relaxed shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
            />
          </div>
        </form>
        <DialogFooter className="gap-3 sm:justify-end sm:gap-4">
          <SecondaryButton
            type="button"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" form="entity-form-modal">
            {editingEntityId ? "Update entity" : "Create entity"}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
