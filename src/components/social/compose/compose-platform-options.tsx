"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionCard } from "@/components/ui-kit/cards";

type ComposePlatformOptionsProps = {
  platformInputs: unknown;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function extractFields(schema: unknown): Array<{ key: string; label: string; type: string; enumValues?: string[] }> {
  if (!isPlainObject(schema)) return [];
  const props = schema.properties;
  if (!isPlainObject(props)) return [];

  return Object.entries(props).map(([key, def]) => {
    const d = isPlainObject(def) ? def : {};
    const enumValues = Array.isArray(d.enum) ? d.enum.map(String) : undefined;
    return {
      key,
      label: String(d.title ?? d.description ?? key),
      type: enumValues ? "enum" : String(d.type ?? "string"),
      enumValues,
    };
  });
}

export function ComposePlatformOptions({
  platformInputs,
  value,
  onChange,
}: ComposePlatformOptionsProps) {
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("{}");

  const fields = useMemo(() => {
    if (!isPlainObject(platformInputs)) return [];
    const schema = platformInputs.schema ?? platformInputs;
    return extractFields(schema);
  }, [platformInputs]);

  useEffect(() => {
    setJsonText(JSON.stringify(value, null, 2));
  }, [value]);

  if (!platformInputs) {
    return null;
  }

  return (
    <SectionCard>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Platform options</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform-specific settings (privacy, boards, etc.).
          </p>
        </div>
        <button
          type="button"
          className="text-xs text-primary underline"
          onClick={() => setJsonMode((v) => !v)}
        >
          {jsonMode ? "Form view" : "JSON view"}
        </button>
      </div>

      {jsonMode || !fields.length ? (
        <textarea
          className="mt-4 min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            try {
              const parsed = JSON.parse(e.target.value) as Record<string, unknown>;
              onChange(parsed);
            } catch {
              // keep typing
            }
          }}
        />
      ) : (
        <div className="mt-4 grid gap-3">
          {fields.map((field) => (
            <label key={field.key} className="block text-sm">
              <span className="text-muted-foreground">{field.label}</span>
              {field.enumValues ? (
                <select
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  value={String(value[field.key] ?? "")}
                  onChange={(e) =>
                    onChange({ ...value, [field.key]: e.target.value || undefined })
                  }
                >
                  <option value="">—</option>
                  {field.enumValues.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  value={String(value[field.key] ?? "")}
                  onChange={(e) =>
                    onChange({ ...value, [field.key]: e.target.value || undefined })
                  }
                />
              )}
            </label>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
