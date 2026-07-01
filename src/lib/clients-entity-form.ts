import type {
  ClientAmlRiskLevel,
  ClientEntityType,
  ClientKycStatus,
  ClientOnboardingStatus,
  ClientStatus,
  ClientEntity,
  CreateClientEntityBody,
  InvestmentObjective,
  LiquidityNeeds,
  RelationshipRole,
  SpecialPreferenceTag,
  TaxAccountType,
  TimeHorizon,
} from "@/lib/api";

export type EntityFormState = {
  display_name: string;
  entity_type: ClientEntityType | "";
  legal_name: string;
  date_of_birth: string;
  incorporation_date: string;
  tax_id: string;
  national_id: string;
  passport_no: string;
  country_of_residence: string;
  country_of_incorporation: string;
  tax_residency: string;
  kyc_status: ClientKycStatus | "";
  kyc_verified_at: string;
  aml_risk_level: ClientAmlRiskLevel | "";
  pep_flag: boolean;
  sanctions_flag: boolean;
  parent_entity_id: string;
  beneficial_owner_of: string;
  ownership_percent: string;
  onboarding_status: ClientOnboardingStatus | "";
  client_status: ClientStatus | "";
  closed_at: string;
  closure_reason: string;
  source_system: string;
  source_system_id: string;
  created_by: string;
  updated_by: string;
  version: string;
  relationship_role: RelationshipRole | "";
  relationship_role_other: string;
  risk_score: string;
  risk_notes: string;
  time_horizon_category: TimeHorizon | "";
  time_horizon_detail: string;
  investment_objectives: InvestmentObjective[];
  investment_objectives_notes: string;
  liquidity_needs: LiquidityNeeds | "";
  liquidity_notes: string;
  tax_account_types: TaxAccountType[];
  tax_account_notes: string;
  special_preferences_tags: SpecialPreferenceTag[];
  special_preferences_notes: string;
  age: string;
  life_stage: string;
  notes: string;
  settings_json_text: string;
  display_order: string;
};

export function emptyEntityForm(): EntityFormState {
  return {
    display_name: "",
    entity_type: "",
    legal_name: "",
    date_of_birth: "",
    incorporation_date: "",
    tax_id: "",
    national_id: "",
    passport_no: "",
    country_of_residence: "",
    country_of_incorporation: "",
    tax_residency: "",
    kyc_status: "",
    kyc_verified_at: "",
    aml_risk_level: "",
    pep_flag: false,
    sanctions_flag: false,
    parent_entity_id: "",
    beneficial_owner_of: "",
    ownership_percent: "",
    onboarding_status: "",
    client_status: "",
    closed_at: "",
    closure_reason: "",
    source_system: "",
    source_system_id: "",
    created_by: "",
    updated_by: "",
    version: "",
    relationship_role: "",
    relationship_role_other: "",
    risk_score: "",
    risk_notes: "",
    time_horizon_category: "",
    time_horizon_detail: "",
    investment_objectives: [],
    investment_objectives_notes: "",
    liquidity_needs: "",
    liquidity_notes: "",
    tax_account_types: [],
    tax_account_notes: "",
    special_preferences_tags: [],
    special_preferences_notes: "",
    age: "",
    life_stage: "",
    notes: "",
    settings_json_text: "{}",
    display_order: "",
  };
}

export function entityToForm(entity: ClientEntity): EntityFormState {
  return {
    display_name: entity.display_name,
    entity_type: entity.entity_type ?? "",
    legal_name: entity.legal_name ?? "",
    date_of_birth: entity.date_of_birth ?? "",
    incorporation_date: entity.incorporation_date ?? "",
    tax_id: entity.tax_id ?? "",
    national_id: entity.national_id ?? "",
    passport_no: entity.passport_no ?? "",
    country_of_residence: entity.country_of_residence ?? "",
    country_of_incorporation: entity.country_of_incorporation ?? "",
    tax_residency: entity.tax_residency ?? "",
    kyc_status: entity.kyc_status ?? "",
    kyc_verified_at: entity.kyc_verified_at ?? "",
    aml_risk_level: entity.aml_risk_level ?? "",
    pep_flag: entity.pep_flag ?? false,
    sanctions_flag: entity.sanctions_flag ?? false,
    parent_entity_id: entity.parent_entity_id ?? "",
    beneficial_owner_of: entity.beneficial_owner_of ?? "",
    ownership_percent: entity.ownership_percent != null ? String(entity.ownership_percent) : "",
    onboarding_status: entity.onboarding_status ?? "",
    client_status: entity.client_status ?? "",
    closed_at: entity.closed_at ?? "",
    closure_reason: entity.closure_reason ?? "",
    source_system: entity.source_system ?? "",
    source_system_id: entity.source_system_id ?? "",
    created_by: entity.created_by ?? "",
    updated_by: entity.updated_by ?? "",
    version: entity.version != null ? String(entity.version) : "",
    relationship_role: entity.relationship_role ?? "",
    relationship_role_other: entity.relationship_role_other ?? "",
    risk_score: entity.risk_score != null ? String(entity.risk_score) : "",
    risk_notes: entity.risk_notes ?? "",
    time_horizon_category: entity.time_horizon_category ?? "",
    time_horizon_detail: entity.time_horizon_detail ?? "",
    investment_objectives: [...(entity.investment_objectives ?? [])],
    investment_objectives_notes: entity.investment_objectives_notes ?? "",
    liquidity_needs: entity.liquidity_needs ?? "",
    liquidity_notes: entity.liquidity_notes ?? "",
    tax_account_types: [...(entity.tax_account_types ?? [])],
    tax_account_notes: entity.tax_account_notes ?? "",
    special_preferences_tags: [...(entity.special_preferences_tags ?? [])],
    special_preferences_notes: entity.special_preferences_notes ?? "",
    age: entity.age != null ? String(entity.age) : "",
    life_stage: entity.life_stage ?? "",
    notes: entity.notes ?? "",
    settings_json_text: JSON.stringify(entity.settings_json ?? {}, null, 2),
    display_order: entity.display_order != null ? String(entity.display_order) : "",
  };
}

export function buildClientEntityBodyFromForm(
  form: EntityFormState,
  isUpdate: boolean
): CreateClientEntityBody {
  const displayName = form.display_name.trim();
  if (!displayName) {
    throw new Error("Entity name is required");
  }

  const parsedRisk = form.risk_score.trim() ? Number(form.risk_score) : null;
  if (parsedRisk !== null && (!Number.isInteger(parsedRisk) || parsedRisk < 1 || parsedRisk > 10)) {
    throw new Error("Risk score must be an integer from 1 to 10");
  }

  const parsedAge = form.age.trim() ? Number(form.age) : null;
  if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 130)) {
    throw new Error("Age must be an integer from 0 to 130");
  }

  const parsedOrder = form.display_order.trim() ? Number(form.display_order) : null;
  if (parsedOrder !== null && !Number.isInteger(parsedOrder)) {
    throw new Error("Display order must be an integer");
  }

  const parsedOwnership = form.ownership_percent.trim() ? Number(form.ownership_percent) : null;
  if (parsedOwnership !== null && (!Number.isFinite(parsedOwnership) || parsedOwnership < 0 || parsedOwnership > 100)) {
    throw new Error("Ownership percent must be between 0 and 100");
  }

  const parsedVersion = form.version.trim() ? Number(form.version) : null;
  if (parsedVersion !== null && (!Number.isInteger(parsedVersion) || parsedVersion < 1)) {
    throw new Error("Version must be an integer >= 1");
  }

  let settings: Record<string, unknown> = {};
  const rawSettings = form.settings_json_text.trim();
  if (rawSettings) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawSettings) as unknown;
    } catch {
      throw new Error("Settings JSON is invalid");
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Settings must be a JSON object (e.g. {})");
    }
    settings = parsed as Record<string, unknown>;
  }

  const trimOrNull = (s: string) => {
    const t = s.trim();
    return t.length > 0 ? t : null;
  };

  const trimOrUndef = (s: string) => {
    const t = s.trim();
    return t.length > 0 ? t : undefined;
  };

  const dateTimeOrNull = (s: string) => {
    const t = s.trim();
    if (!t) return null;
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) {
      throw new Error("Datetime fields must be valid date-times");
    }
    return d.toISOString();
  };

  const dateTimeOrUndef = (s: string) => {
    const t = s.trim();
    if (!t) return undefined;
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) {
      throw new Error("Datetime fields must be valid date-times");
    }
    return d.toISOString();
  };

  if (isUpdate) {
    return {
      display_name: displayName,
      entity_type: form.entity_type ? form.entity_type : null,
      legal_name: trimOrNull(form.legal_name),
      date_of_birth: trimOrNull(form.date_of_birth),
      incorporation_date: trimOrNull(form.incorporation_date),
      tax_id: trimOrNull(form.tax_id),
      national_id: trimOrNull(form.national_id),
      passport_no: trimOrNull(form.passport_no),
      country_of_residence: trimOrNull(form.country_of_residence),
      country_of_incorporation: trimOrNull(form.country_of_incorporation),
      tax_residency: trimOrNull(form.tax_residency),
      kyc_status: form.kyc_status ? form.kyc_status : null,
      kyc_verified_at: dateTimeOrNull(form.kyc_verified_at),
      aml_risk_level: form.aml_risk_level ? form.aml_risk_level : null,
      pep_flag: form.pep_flag,
      sanctions_flag: form.sanctions_flag,
      parent_entity_id: trimOrNull(form.parent_entity_id),
      beneficial_owner_of: trimOrNull(form.beneficial_owner_of),
      ownership_percent: parsedOwnership,
      onboarding_status: form.onboarding_status ? form.onboarding_status : null,
      client_status: form.client_status ? form.client_status : null,
      closed_at: dateTimeOrNull(form.closed_at),
      closure_reason: trimOrNull(form.closure_reason),
      source_system: trimOrNull(form.source_system),
      source_system_id: trimOrNull(form.source_system_id),
      created_by: trimOrNull(form.created_by),
      updated_by: trimOrNull(form.updated_by),
      version: parsedVersion,
      relationship_role: form.relationship_role ? form.relationship_role : null,
      relationship_role_other: trimOrNull(form.relationship_role_other),
      risk_score: parsedRisk,
      risk_notes: trimOrNull(form.risk_notes),
      time_horizon_category: form.time_horizon_category ? form.time_horizon_category : null,
      time_horizon_detail: trimOrNull(form.time_horizon_detail),
      investment_objectives: form.investment_objectives,
      investment_objectives_notes: trimOrNull(form.investment_objectives_notes),
      liquidity_needs: form.liquidity_needs ? form.liquidity_needs : null,
      liquidity_notes: trimOrNull(form.liquidity_notes),
      tax_account_types: form.tax_account_types,
      tax_account_notes: trimOrNull(form.tax_account_notes),
      special_preferences_tags: form.special_preferences_tags,
      special_preferences_notes: trimOrNull(form.special_preferences_notes),
      age: parsedAge,
      life_stage: trimOrNull(form.life_stage),
      notes: trimOrNull(form.notes),
      settings_json: settings,
      display_order: parsedOrder,
    };
  }

  const body: CreateClientEntityBody = { display_name: displayName };
  if (form.entity_type) body.entity_type = form.entity_type;
  const legalName = trimOrUndef(form.legal_name);
  if (legalName !== undefined) body.legal_name = legalName;
  const dob = trimOrUndef(form.date_of_birth);
  if (dob !== undefined) body.date_of_birth = dob;
  const incDate = trimOrUndef(form.incorporation_date);
  if (incDate !== undefined) body.incorporation_date = incDate;
  const taxId = trimOrUndef(form.tax_id);
  if (taxId !== undefined) body.tax_id = taxId;
  const nationalId = trimOrUndef(form.national_id);
  if (nationalId !== undefined) body.national_id = nationalId;
  const passport = trimOrUndef(form.passport_no);
  if (passport !== undefined) body.passport_no = passport;
  const countryResidence = trimOrUndef(form.country_of_residence);
  if (countryResidence !== undefined) body.country_of_residence = countryResidence;
  const countryIncorp = trimOrUndef(form.country_of_incorporation);
  if (countryIncorp !== undefined) body.country_of_incorporation = countryIncorp;
  const taxResidency = trimOrUndef(form.tax_residency);
  if (taxResidency !== undefined) body.tax_residency = taxResidency;
  if (form.kyc_status) body.kyc_status = form.kyc_status;
  const kycAt = dateTimeOrUndef(form.kyc_verified_at);
  if (kycAt !== undefined) body.kyc_verified_at = kycAt;
  if (form.aml_risk_level) body.aml_risk_level = form.aml_risk_level;
  body.pep_flag = form.pep_flag;
  body.sanctions_flag = form.sanctions_flag;
  const parent = trimOrUndef(form.parent_entity_id);
  if (parent !== undefined) body.parent_entity_id = parent;
  const beneficialOwner = trimOrUndef(form.beneficial_owner_of);
  if (beneficialOwner !== undefined) body.beneficial_owner_of = beneficialOwner;
  if (parsedOwnership !== null) body.ownership_percent = parsedOwnership;
  if (form.onboarding_status) body.onboarding_status = form.onboarding_status;
  if (form.client_status) body.client_status = form.client_status;
  const closedAt = dateTimeOrUndef(form.closed_at);
  if (closedAt !== undefined) body.closed_at = closedAt;
  const closureReason = trimOrUndef(form.closure_reason);
  if (closureReason !== undefined) body.closure_reason = closureReason;
  const sourceSystem = trimOrUndef(form.source_system);
  if (sourceSystem !== undefined) body.source_system = sourceSystem;
  const sourceSystemId = trimOrUndef(form.source_system_id);
  if (sourceSystemId !== undefined) body.source_system_id = sourceSystemId;
  const createdBy = trimOrUndef(form.created_by);
  if (createdBy !== undefined) body.created_by = createdBy;
  const updatedBy = trimOrUndef(form.updated_by);
  if (updatedBy !== undefined) body.updated_by = updatedBy;
  if (parsedVersion !== null) body.version = parsedVersion;
  if (form.relationship_role) body.relationship_role = form.relationship_role;
  const rro = trimOrUndef(form.relationship_role_other);
  if (rro !== undefined) body.relationship_role_other = rro;
  if (parsedRisk !== null) body.risk_score = parsedRisk;
  const rn = trimOrUndef(form.risk_notes);
  if (rn !== undefined) body.risk_notes = rn;
  if (form.time_horizon_category) body.time_horizon_category = form.time_horizon_category;
  const thd = trimOrUndef(form.time_horizon_detail);
  if (thd !== undefined) body.time_horizon_detail = thd;
  if (form.investment_objectives.length > 0) {
    body.investment_objectives = form.investment_objectives;
  }
  const ion = trimOrUndef(form.investment_objectives_notes);
  if (ion !== undefined) body.investment_objectives_notes = ion;
  if (form.liquidity_needs) body.liquidity_needs = form.liquidity_needs;
  const ln = trimOrUndef(form.liquidity_notes);
  if (ln !== undefined) body.liquidity_notes = ln;
  if (form.tax_account_types.length > 0) {
    body.tax_account_types = form.tax_account_types;
  }
  const tan = trimOrUndef(form.tax_account_notes);
  if (tan !== undefined) body.tax_account_notes = tan;
  if (form.special_preferences_tags.length > 0) {
    body.special_preferences_tags = form.special_preferences_tags;
  }
  const spn = trimOrUndef(form.special_preferences_notes);
  if (spn !== undefined) body.special_preferences_notes = spn;
  if (parsedAge !== null) body.age = parsedAge;
  const ls = trimOrUndef(form.life_stage);
  if (ls !== undefined) body.life_stage = ls;
  const notes = trimOrUndef(form.notes);
  if (notes !== undefined) body.notes = notes;
  if (Object.keys(settings).length > 0) {
    body.settings_json = settings;
  }
  if (parsedOrder !== null) body.display_order = parsedOrder;
  return body;
}
