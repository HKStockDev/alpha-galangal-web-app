"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  type AiPromptTemplateRow,
  type FactorGovernanceRow,
  type FormulaGovernanceRow,
  fetchAdminAiAssistantCoreConfig,
  fetchAdminAiFormulaDisclosurePolicy,
  fetchAdminAiPromptTemplates,
  fetchAdminAiScopePolicy,
  listAdminAiFactorsGovernance,
  listAdminAiFormulasGovernance,
  patchAdminAiFactorGovernance,
  patchAdminAiFormulaDisclosurePolicy,
  patchAdminAiFormulaGovernance,
  patchAdminAiPromptTemplate,
} from "@/lib/api";

type MainSection = "prompts" | "governance" | "summary";
type GovSection = "disclosure" | "formulas" | "factors";

const PAGE = 40;

function parseAssistantParam(value: string | null): MainSection | null {
  if (value === "prompts" || value === "governance" || value === "summary") return value;
  return null;
}

function parseGovParam(value: string | null): GovSection | null {
  if (value === "disclosure" || value === "formulas" || value === "factors") return value;
  return null;
}

const selectClass =
  "h-9 max-w-[11rem] rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

export function AiAssistantConfigurationPanel() {
  const { accessToken } = useAuth();
  const { showSuccess, showError } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [main, setMain] = useState<MainSection>("prompts");
  const [gov, setGov] = useState<GovSection>("disclosure");
  const [loading, setLoading] = useState(true);

  const [templates, setTemplates] = useState<AiPromptTemplateRow[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [disclosure, setDisclosure] = useState<Record<string, unknown> | null>(null);
  const [savingDisclosure, setSavingDisclosure] = useState(false);

  const [coreConfig, setCoreConfig] = useState<Record<string, unknown> | null>(null);
  const [scopePolicy, setScopePolicy] = useState<Record<string, unknown> | null>(null);

  const [formulas, setFormulas] = useState<FormulaGovernanceRow[]>([]);
  const [formulasTotal, setFormulasTotal] = useState(0);
  const [formulasOffset, setFormulasOffset] = useState(0);
  const [factors, setFactors] = useState<FactorGovernanceRow[]>([]);
  const [factorsTotal, setFactorsTotal] = useState(0);
  const [factorsOffset, setFactorsOffset] = useState(0);
  const [savingFormulaId, setSavingFormulaId] = useState<string | null>(null);
  const [savingFactorId, setSavingFactorId] = useState<string | null>(null);

  const replaceAssistantQuery = useCallback(
    (nextMain: MainSection, nextGov: GovSection) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "ai-assistant");
      params.set("assistant", nextMain);
      if (nextMain === "governance") params.set("gov", nextGov);
      else params.delete("gov");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const m = parseAssistantParam(searchParams.get("assistant"));
    const g = parseGovParam(searchParams.get("gov"));
    if (m != null) setMain(m);
    if (searchParams.get("assistant") === "governance" && g != null) setGov(g);
  }, [searchParams]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;

  const loadPrompts = useCallback(async () => {
    if (!accessToken) return;
    const rows = await fetchAdminAiPromptTemplates(accessToken);
    setTemplates(rows);
    setSelectedTemplateId((prev) => {
      if (prev && rows.some((r) => r.id === prev)) return prev;
      return rows[0]?.id ?? null;
    });
  }, [accessToken]);

  const loadDisclosure = useCallback(async () => {
    if (!accessToken) return;
    const row = await fetchAdminAiFormulaDisclosurePolicy(accessToken);
    setDisclosure(row);
  }, [accessToken]);

  const loadSummary = useCallback(async () => {
    if (!accessToken) return;
    const [core, scope] = await Promise.all([
      fetchAdminAiAssistantCoreConfig(accessToken),
      fetchAdminAiScopePolicy(accessToken),
    ]);
    setCoreConfig(core);
    setScopePolicy(scope);
  }, [accessToken]);

  const loadFormulas = useCallback(async () => {
    if (!accessToken) return;
    const { rows, total } = await listAdminAiFormulasGovernance(accessToken, {
      limit: PAGE,
      offset: formulasOffset,
    });
    setFormulas(rows);
    setFormulasTotal(total);
  }, [accessToken, formulasOffset]);

  const loadFactors = useCallback(async () => {
    if (!accessToken) return;
    const { rows, total } = await listAdminAiFactorsGovernance(accessToken, {
      limit: PAGE,
      offset: factorsOffset,
    });
    setFactors(rows);
    setFactorsTotal(total);
  }, [accessToken, factorsOffset]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadPrompts();
        if (cancelled) return;
      } catch (e) {
        if (!cancelled) showError(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, loadPrompts, showError]);

  useEffect(() => {
    if (!selectedTemplate) {
      setEditText("");
      setEditNote("");
      setEditActive(true);
      return;
    }
    setEditText(selectedTemplate.template_text);
    setEditNote(selectedTemplate.change_note ?? "");
    setEditActive(selectedTemplate.is_active);
  }, [selectedTemplate]);

  useEffect(() => {
    if (!accessToken || main !== "governance") return;
    let cancelled = false;
    (async () => {
      try {
        if (gov === "disclosure") await loadDisclosure();
        if (gov === "formulas") await loadFormulas();
        if (gov === "factors") await loadFactors();
      } catch (e) {
        if (!cancelled) showError(e instanceof Error ? e.message : "Load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    main,
    gov,
    formulasOffset,
    factorsOffset,
    loadDisclosure,
    loadFormulas,
    loadFactors,
    showError,
  ]);

  useEffect(() => {
    if (!accessToken || main !== "summary") return;
    let cancelled = false;
    (async () => {
      try {
        await loadSummary();
      } catch (e) {
        if (!cancelled) showError(e instanceof Error ? e.message : "Load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, main, loadSummary, showError]);

  const onSaveTemplate = async () => {
    if (!accessToken || !selectedTemplateId) return;
    setSavingTemplate(true);
    try {
      const updated = await patchAdminAiPromptTemplate(accessToken, selectedTemplateId, {
        template_text: editText,
        change_note: editNote.trim() === "" ? null : editNote.trim(),
        is_active: editActive,
      });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showSuccess("Prompt template saved");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingTemplate(false);
    }
  };

  const onSaveDisclosure = async () => {
    if (!accessToken || !disclosure) return;
    setSavingDisclosure(true);
    try {
      const updated = await patchAdminAiFormulaDisclosurePolicy(accessToken, {
        block_exact_equation_for_system_formulas: Boolean(
          disclosure.block_exact_equation_for_system_formulas
        ),
        allow_factor_names: Boolean(disclosure.allow_factor_names),
        allow_weights: Boolean(disclosure.allow_weights),
      });
      setDisclosure(updated);
      showSuccess("Disclosure policy saved");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingDisclosure(false);
    }
  };

  const patchFormulaRow = async (
    row: FormulaGovernanceRow,
    patch: {
      formula_origin?: string;
      equation_visibility_mode?: string;
      is_locked?: boolean;
    }
  ) => {
    if (!accessToken) return;
    setSavingFormulaId(row.id);
    try {
      const updated = await patchAdminAiFormulaGovernance(accessToken, row.id, {
        formula_origin: patch.formula_origin as "system" | "organization",
        equation_visibility_mode: patch.equation_visibility_mode as
          | "hidden"
          | "owner_only"
          | "public",
        is_locked: patch.is_locked,
      });
      setFormulas((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showSuccess(`Updated ${row.key}`);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingFormulaId(null);
    }
  };

  const patchFactorRow = async (
    row: FactorGovernanceRow,
    patch: {
      factor_origin?: string;
      factor_visibility_mode?: string;
      is_locked?: boolean;
    }
  ) => {
    if (!accessToken) return;
    setSavingFactorId(row.id);
    try {
      const updated = await patchAdminAiFactorGovernance(accessToken, row.id, {
        factor_origin: patch.factor_origin as "system" | "organization",
        factor_visibility_mode: patch.factor_visibility_mode as
          | "hidden"
          | "organization"
          | "public",
        is_locked: patch.is_locked,
      });
      setFactors((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showSuccess(`Updated ${row.key}`);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingFactorId(null);
    }
  };

  if (!accessToken) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-8 md:px-10 lg:px-12">
      <p className="text-sm text-muted-foreground">
        Formula and factor <strong className="text-foreground">origin</strong>,{" "}
        <strong className="text-foreground">visibility</strong>, and{" "}
        <strong className="text-foreground">lock</strong> are managed under{" "}
        <span className="text-foreground">Formula / factor governance</span> below. URL reflects your
        current section (shareable deep links).
      </p>
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {(
          [
            ["prompts", "Prompt templates"],
            ["governance", "Formula / factor governance"],
            ["summary", "Settings summary"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              const next = id as MainSection;
              setMain(next);
              replaceAssistantQuery(next, next === "governance" ? gov : "disclosure");
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              main === id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && main === "prompts" ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : null}

      {main === "prompts" && !loading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Templates</CardTitle>
              <CardDescription>Select a key to edit.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[480px] space-y-1 overflow-y-auto pr-1">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={cn(
                    "flex w-full flex-col rounded-md border px-2 py-2 text-left text-sm transition-colors",
                    selectedTemplateId === t.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:bg-muted"
                  )}
                >
                  <span className="font-mono text-xs text-muted-foreground">{t.template_key}</span>
                  <span className="text-xs text-muted-foreground">v{t.version}</span>
                </button>
              ))}
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No templates found.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Editor</CardTitle>
              <CardDescription>
                {selectedTemplate
                  ? `Required context keys (read-only): ${JSON.stringify(selectedTemplate.required_context_keys)}`
                  : "Choose a template."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTemplate ? (
                <>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="tpl-active"
                      checked={editActive}
                      onCheckedChange={setEditActive}
                    />
                    <Label htmlFor="tpl-active">Active</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tpl-text">Template text</Label>
                    <Textarea
                      id="tpl-text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[220px] font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tpl-note">Change note</Label>
                    <Textarea
                      id="tpl-note"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <Button type="button" disabled={savingTemplate} onClick={() => void onSaveTemplate()}>
                    {savingTemplate ? "Saving…" : "Save template"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No template selected.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {main === "governance" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["disclosure", "Global disclosure"],
                ["formulas", "Formulas"],
                ["factors", "Factors"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  const next = id as GovSection;
                  setGov(next);
                  replaceAssistantQuery("governance", next);
                }}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                  gov === id
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {gov === "disclosure" && disclosure ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Global formula disclosure</CardTitle>
                <CardDescription>Policy key: default</CardDescription>
              </CardHeader>
              <CardContent className="max-w-md space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="d0">Block exact equation (system formulas)</Label>
                  <Switch
                    id="d0"
                    checked={Boolean(disclosure.block_exact_equation_for_system_formulas)}
                    onCheckedChange={(v) =>
                      setDisclosure((d) => (d ? { ...d, block_exact_equation_for_system_formulas: v } : d))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="d1">Allow factor names</Label>
                  <Switch
                    id="d1"
                    checked={Boolean(disclosure.allow_factor_names)}
                    onCheckedChange={(v) =>
                      setDisclosure((d) => (d ? { ...d, allow_factor_names: v } : d))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="d2">Allow weights</Label>
                  <Switch
                    id="d2"
                    checked={Boolean(disclosure.allow_weights)}
                    onCheckedChange={(v) =>
                      setDisclosure((d) => (d ? { ...d, allow_weights: v } : d))
                    }
                  />
                </div>
                <Button
                  type="button"
                  disabled={savingDisclosure}
                  onClick={() => void onSaveDisclosure()}
                >
                  {savingDisclosure ? "Saving…" : "Save policy"}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {gov === "disclosure" && !disclosure ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : null}

          {gov === "formulas" ? (
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-base">Formulas</CardTitle>
                  <CardDescription>
                    Origin, equation visibility, lock. Showing {formulas.length} of {formulasTotal}.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={formulasOffset <= 0}
                    onClick={() => setFormulasOffset((o) => Math.max(0, o - PAGE))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={formulasOffset + PAGE >= formulasTotal}
                    onClick={() => setFormulasOffset((o) => o + PAGE)}
                  >
                    Next
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Origin</TableHead>
                      <TableHead>Equation visibility</TableHead>
                      <TableHead>Locked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formulas.map((row) => (
                      <FormulaGovRow
                        key={row.id}
                        row={row}
                        disabled={savingFormulaId === row.id}
                        onApply={(patch) => void patchFormulaRow(row, patch)}
                      />
                    ))}
                  </TableBody>
                </Table>
                {formulas.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No formulas.</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {gov === "factors" ? (
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-base">Factors</CardTitle>
                  <CardDescription>
                    Origin, visibility, lock. Showing {factors.length} of {factorsTotal}.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={factorsOffset <= 0}
                    onClick={() => setFactorsOffset((o) => Math.max(0, o - PAGE))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={factorsOffset + PAGE >= factorsTotal}
                    onClick={() => setFactorsOffset((o) => o + PAGE)}
                  >
                    Next
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Origin</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Locked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factors.map((row) => (
                      <FactorGovRow
                        key={row.id}
                        row={row}
                        disabled={savingFactorId === row.id}
                        onApply={(patch) => void patchFactorRow(row, patch)}
                      />
                    ))}
                  </TableBody>
                </Table>
                {factors.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No factors.</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {main === "summary" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assistant core (read-only)</CardTitle>
              <CardDescription>Row: default</CardDescription>
            </CardHeader>
            <CardContent>
              {coreConfig ? (
                <pre className="max-h-[320px] overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(coreConfig, null, 2)}
                </pre>
              ) : (
                <Spinner />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scope policy (read-only)</CardTitle>
              <CardDescription>Row: default</CardDescription>
            </CardHeader>
            <CardContent>
              {scopePolicy ? (
                <pre className="max-h-[320px] overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(scopePolicy, null, 2)}
                </pre>
              ) : (
                <Spinner />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function FormulaGovRow({
  row,
  disabled,
  onApply,
}: {
  row: FormulaGovernanceRow;
  disabled: boolean;
  onApply: (patch: {
    formula_origin?: string;
    equation_visibility_mode?: string;
    is_locked?: boolean;
  }) => void;
}) {
  const [origin, setOrigin] = useState(row.formula_origin);
  const [vis, setVis] = useState(row.equation_visibility_mode);
  const [locked, setLocked] = useState(row.is_locked);
  useEffect(() => {
    setOrigin(row.formula_origin);
    setVis(row.equation_visibility_mode);
    setLocked(row.is_locked);
  }, [row.id, row.formula_origin, row.equation_visibility_mode, row.is_locked]);
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{row.key}</TableCell>
      <TableCell className="max-w-[10rem] truncate text-sm">{row.name}</TableCell>
      <TableCell>
        <select className={selectClass} value={origin} onChange={(e) => setOrigin(e.target.value)}>
          <option value="system">system</option>
          <option value="organization">organization</option>
        </select>
      </TableCell>
      <TableCell>
        <select className={selectClass} value={vis} onChange={(e) => setVis(e.target.value)}>
          <option value="hidden">hidden</option>
          <option value="owner_only">owner_only</option>
          <option value="public">public</option>
        </select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch checked={locked} onCheckedChange={setLocked} disabled={disabled} />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={
              disabled ||
              (origin === row.formula_origin && vis === row.equation_visibility_mode && locked === row.is_locked)
            }
            onClick={() => onApply({ formula_origin: origin, equation_visibility_mode: vis, is_locked: locked })}
          >
            Apply
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function FactorGovRow({
  row,
  disabled,
  onApply,
}: {
  row: FactorGovernanceRow;
  disabled: boolean;
  onApply: (patch: {
    factor_origin?: string;
    factor_visibility_mode?: string;
    is_locked?: boolean;
  }) => void;
}) {
  const [origin, setOrigin] = useState(row.factor_origin);
  const [vis, setVis] = useState(row.factor_visibility_mode);
  const [locked, setLocked] = useState(row.is_locked);
  useEffect(() => {
    setOrigin(row.factor_origin);
    setVis(row.factor_visibility_mode);
    setLocked(row.is_locked);
  }, [row.id, row.factor_origin, row.factor_visibility_mode, row.is_locked]);
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{row.key}</TableCell>
      <TableCell className="max-w-[10rem] truncate text-sm">{row.name}</TableCell>
      <TableCell>
        <select className={selectClass} value={origin} onChange={(e) => setOrigin(e.target.value)}>
          <option value="system">system</option>
          <option value="organization">organization</option>
        </select>
      </TableCell>
      <TableCell>
        <select className={selectClass} value={vis} onChange={(e) => setVis(e.target.value)}>
          <option value="hidden">hidden</option>
          <option value="organization">organization</option>
          <option value="public">public</option>
        </select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch checked={locked} onCheckedChange={setLocked} disabled={disabled} />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={
              disabled ||
              (origin === row.factor_origin &&
                vis === row.factor_visibility_mode &&
                locked === row.is_locked)
            }
            onClick={() => onApply({ factor_origin: origin, factor_visibility_mode: vis, is_locked: locked })}
          >
            Apply
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
