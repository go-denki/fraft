import { useState, useCallback } from "react";
import yaml from "js-yaml";
import styles from "./Builder.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type KV = { id: string; key: string; value: string };
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type PickStep = { id: string; type: "pick"; fields: string };
type RenameStep = {
  id: string;
  type: "rename";
  pairs: { id: string; from: string; to: string }[];
};
type FilterStep = {
  id: string;
  type: "filter";
  field: string;
  op: string;
  value: string;
};
type MwStep = { id: string; type: "middleware"; name: string };
type BuilderStep = PickStep | RenameStep | FilterStep | MwStep;

export type BuilderRequest = {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  headers: KV[];
  params: KV[];
  body: string;
  transform: BuilderStep[];
};

export type BuilderState = {
  baseUrl: string;
  globalHeaders: KV[];
  authEnabled: boolean;
  authIn: "header" | "query";
  authName: string;
  authValue: string;
  requests: BuilderRequest[];
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function kvToObj(kvs: KV[]): Record<string, string> | undefined {
  const filled = kvs.filter((kv) => kv.key.trim());
  return filled.length
    ? Object.fromEntries(filled.map((kv) => [kv.key, kv.value]))
    : undefined;
}

function objToKV(obj: unknown): KV[] {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];
  return Object.entries(obj as Record<string, unknown>).map(([k, v]) => ({
    id: uid(),
    key: k,
    value: String(v),
  }));
}

export function defaultState(): BuilderState {
  return {
    baseUrl: "https://",
    globalHeaders: [],
    authEnabled: false,
    authIn: "header",
    authName: "x-api-key",
    authValue: "",
    requests: [
      {
        id: uid(),
        name: "myRequest",
        method: "GET",
        path: "/",
        headers: [],
        params: [],
        body: "",
        transform: [],
      },
    ],
  };
}

function stepToConfig(s: BuilderStep): unknown {
  switch (s.type) {
    case "pick":
      return {
        pick: s.fields
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
      };
    case "rename":
      return {
        rename: Object.fromEntries(
          s.pairs.filter((p) => p.from.trim()).map((p) => [p.from, p.to]),
        ),
      };
    case "filter": {
      const v = s.value;
      const parsed =
        v === "true"
          ? true
          : v === "false"
            ? false
            : !isNaN(Number(v)) && v !== ""
              ? Number(v)
              : v;
      return { filter: { field: s.field, op: s.op, value: parsed } };
    }
    case "middleware":
      return { middleware: s.name };
  }
}

export function builderToConfig(s: BuilderState): Record<string, unknown> {
  const cfg: Record<string, unknown> = { version: 1, baseUrl: s.baseUrl };
  const gh = kvToObj(s.globalHeaders);
  if (gh) cfg.headers = gh;
  if (s.authEnabled)
    cfg.auth = {
      type: "apiKey",
      in: s.authIn,
      name: s.authName,
      value: s.authValue,
    };

  const requests: Record<string, unknown> = {};
  for (const r of s.requests) {
    if (!r.name.trim()) continue;
    const def: Record<string, unknown> = { path: r.path, method: r.method };
    const h = kvToObj(r.headers);
    if (h) def.headers = h;
    const p = kvToObj(r.params);
    if (p) def.params = p;
    if (r.body.trim()) {
      try {
        def.body = JSON.parse(r.body);
      } catch {
        def.body = r.body;
      }
    }
    const validSteps = r.transform.filter((t) => {
      if (t.type === "pick") return t.fields.trim();
      if (t.type === "rename") return t.pairs.some((p) => p.from.trim());
      if (t.type === "filter") return t.field.trim();
      if (t.type === "middleware") return t.name.trim();
      return false;
    });
    if (validSteps.length) def.transform = validSteps.map(stepToConfig);
    requests[r.name] = def;
  }
  cfg.requests = requests;
  return cfg;
}

export function builderToYaml(s: BuilderState): string {
  return yaml.dump(builderToConfig(s), { lineWidth: 120 });
}

export function yamlToBuilder(text: string): BuilderState | null {
  try {
    const raw = yaml.load(text);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const r = raw as Record<string, unknown>;
    const s = defaultState();
    if (typeof r.baseUrl === "string") s.baseUrl = r.baseUrl;
    s.globalHeaders = objToKV(r.headers);
    if (r.auth && typeof r.auth === "object") {
      const a = r.auth as Record<string, unknown>;
      s.authEnabled = true;
      if (a.in === "header" || a.in === "query") s.authIn = a.in;
      if (typeof a.name === "string") s.authName = a.name;
      if (typeof a.value === "string") s.authValue = a.value;
    }
    if (
      r.requests &&
      typeof r.requests === "object" &&
      !Array.isArray(r.requests)
    ) {
      s.requests = Object.entries(
        r.requests as Record<string, unknown>,
      ).map(([name, def]) => {
        const d = (def ?? {}) as Record<string, unknown>;
        const transform: BuilderStep[] = [];
        if (Array.isArray(d.transform)) {
          for (const step of d.transform as Record<string, unknown>[]) {
            if (Array.isArray(step.pick)) {
              transform.push({
                id: uid(),
                type: "pick",
                fields: (step.pick as string[]).join(", "),
              });
            } else if (
              step.rename &&
              typeof step.rename === "object"
            ) {
              transform.push({
                id: uid(),
                type: "rename",
                pairs: Object.entries(
                  step.rename as Record<string, string>,
                ).map(([from, to]) => ({ id: uid(), from, to })),
              });
            } else if (
              step.filter &&
              typeof step.filter === "object"
            ) {
              const f = step.filter as Record<string, unknown>;
              transform.push({
                id: uid(),
                type: "filter",
                field: String(f.field ?? ""),
                op: String(f.op ?? "eq"),
                value: String(f.value ?? ""),
              });
            } else if (typeof step.middleware === "string") {
              transform.push({
                id: uid(),
                type: "middleware",
                name: step.middleware,
              });
            }
          }
        }
        const method = String(d.method ?? "GET").toUpperCase();
        return {
          id: uid(),
          name,
          method: (
            ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)
              ? method
              : "GET"
          ) as HttpMethod,
          path: String(d.path ?? "/"),
          headers: objToKV(d.headers),
          params: objToKV(d.params),
          body:
            d.body !== undefined
              ? typeof d.body === "string"
                ? d.body
                : JSON.stringify(d.body, null, 2)
              : "",
          transform,
        };
      });
    }
    return s;
  } catch {
    return null;
  }
}

// ─── KV editor ────────────────────────────────────────────────────────────────

function KVEditor({
  items,
  onChange,
  addLabel = "+ Add row",
}: {
  items: KV[];
  onChange: (v: KV[]) => void;
  addLabel?: string;
}) {
  return (
    <div className={styles.kvList}>
      {items.map((kv) => (
        <div key={kv.id} className={styles.kvRow}>
          <input
            className={styles.inp}
            placeholder="key"
            value={kv.key}
            onChange={(e) =>
              onChange(
                items.map((i) =>
                  i.id === kv.id ? { ...i, key: e.target.value } : i,
                ),
              )
            }
          />
          <span className={styles.kvSep}>:</span>
          <input
            className={styles.inp}
            placeholder="value"
            value={kv.value}
            onChange={(e) =>
              onChange(
                items.map((i) =>
                  i.id === kv.id ? { ...i, value: e.target.value } : i,
                ),
              )
            }
          />
          <button
            className={styles.iconBtn}
            title="Remove"
            onClick={() => onChange(items.filter((i) => i.id !== kv.id))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        className={styles.addBtn}
        onClick={() =>
          onChange([...items, { id: uid(), key: "", value: "" }])
        }
      >
        {addLabel}
      </button>
    </div>
  );
}

// ─── Transform step editor ────────────────────────────────────────────────────

const FILTER_OPS = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "startsWith",
  "endsWith",
];

function StepEditor({
  step,
  onChange,
  onRemove,
}: {
  step: BuilderStep;
  onChange: (s: BuilderStep) => void;
  onRemove: () => void;
}) {
  return (
    <div className={styles.stepCard}>
      <div className={styles.stepHeader}>
        <select
          className={styles.stepTypeSelect}
          value={step.type}
          onChange={(e) => {
            const t = e.target.value as BuilderStep["type"];
            if (t === "pick")
              onChange({ id: step.id, type: "pick", fields: "" });
            else if (t === "rename")
              onChange({
                id: step.id,
                type: "rename",
                pairs: [{ id: uid(), from: "", to: "" }],
              });
            else if (t === "filter")
              onChange({
                id: step.id,
                type: "filter",
                field: "",
                op: "eq",
                value: "",
              });
            else onChange({ id: step.id, type: "middleware", name: "" });
          }}
        >
          <option value="pick">pick</option>
          <option value="rename">rename</option>
          <option value="filter">filter</option>
          <option value="middleware">middleware</option>
        </select>
        <button
          className={styles.iconBtn}
          onClick={onRemove}
          title="Remove step"
        >
          ×
        </button>
      </div>

      <div className={styles.stepBody}>
        {step.type === "pick" && (
          <input
            className={styles.inp}
            placeholder="id, title, userId"
            value={step.fields}
            onChange={(e) => onChange({ ...step, fields: e.target.value })}
          />
        )}

        {step.type === "rename" && (
          <div className={styles.kvList}>
            {step.pairs.map((p) => (
              <div key={p.id} className={styles.kvRow}>
                <input
                  className={styles.inp}
                  placeholder="from"
                  value={p.from}
                  onChange={(e) =>
                    onChange({
                      ...step,
                      pairs: step.pairs.map((x) =>
                        x.id === p.id ? { ...x, from: e.target.value } : x,
                      ),
                    })
                  }
                />
                <span className={styles.kvSep}>→</span>
                <input
                  className={styles.inp}
                  placeholder="to"
                  value={p.to}
                  onChange={(e) =>
                    onChange({
                      ...step,
                      pairs: step.pairs.map((x) =>
                        x.id === p.id ? { ...x, to: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  className={styles.iconBtn}
                  title="Remove"
                  onClick={() =>
                    onChange({
                      ...step,
                      pairs: step.pairs.filter((x) => x.id !== p.id),
                    })
                  }
                >
                  ×
                </button>
              </div>
            ))}
            <button
              className={styles.addBtn}
              onClick={() =>
                onChange({
                  ...step,
                  pairs: [
                    ...step.pairs,
                    { id: uid(), from: "", to: "" },
                  ],
                })
              }
            >
              + Add pair
            </button>
          </div>
        )}

        {step.type === "filter" && (
          <div className={styles.filterRow}>
            <input
              className={styles.inp}
              placeholder="field"
              value={step.field}
              onChange={(e) => onChange({ ...step, field: e.target.value })}
            />
            <select
              className={styles.opSelect}
              value={step.op}
              onChange={(e) => onChange({ ...step, op: e.target.value })}
            >
              {FILTER_OPS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
            <input
              className={styles.inp}
              placeholder="value"
              value={step.value}
              onChange={(e) => onChange({ ...step, value: e.target.value })}
            />
          </div>
        )}

        {step.type === "middleware" && (
          <input
            className={styles.inp}
            placeholder="middleware name"
            value={step.name}
            onChange={(e) => onChange({ ...step, name: e.target.value })}
          />
        )}
      </div>
    </div>
  );
}

// ─── Request card ─────────────────────────────────────────────────────────────

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function RequestCard({
  req,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  req: BuilderRequest;
  expanded: boolean;
  onToggle: () => void;
  onChange: (r: BuilderRequest) => void;
  onRemove: () => void;
}) {
  const update = (patch: Partial<BuilderRequest>) =>
    onChange({ ...req, ...patch });

  return (
    <div className={styles.reqCard}>
      <div className={styles.reqHeader} onClick={onToggle}>
        <input
          className={`${styles.inp} ${styles.nameInp}`}
          placeholder="requestName"
          value={req.name}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => update({ name: e.target.value })}
        />
        <select
          className={styles.methodSelect}
          value={req.method}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => update({ method: e.target.value as HttpMethod })}
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          className={`${styles.inp} ${styles.pathInp}`}
          placeholder="/path"
          value={req.path}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => update({ path: e.target.value })}
        />
        <button
          className={styles.iconBtn}
          title="Remove request"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
        <span className={styles.chevron}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className={styles.reqBody}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Headers</label>
            <KVEditor
              items={req.headers}
              onChange={(v) => update({ headers: v })}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Query Params</label>
            <KVEditor
              items={req.params}
              onChange={(v) => update({ params: v })}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Body{" "}
              <span className={styles.hint}>(JSON)</span>
            </label>
            <textarea
              className={styles.bodyArea}
              placeholder="{}"
              value={req.body}
              onChange={(e) => update({ body: e.target.value })}
            />
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Transform</label>
              <button
                className={styles.addBtn}
                onClick={() =>
                  update({
                    transform: [
                      ...req.transform,
                      { id: uid(), type: "pick", fields: "" },
                    ],
                  })
                }
              >
                + Add step
              </button>
            </div>
            {req.transform.map((step, i) => (
              <StepEditor
                key={step.id}
                step={step}
                onChange={(s) =>
                  update({
                    transform: req.transform.map((x, j) =>
                      j === i ? s : x,
                    ),
                  })
                }
                onRemove={() =>
                  update({
                    transform: req.transform.filter((_, j) => j !== i),
                  })
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Builder component ───────────────────────────────────────────────────

export interface BuilderProps {
  state: BuilderState;
  onChange: (s: BuilderState) => void;
}

export default function Builder({ state, onChange }: BuilderProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(state.requests.map((r) => r.id)),
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const updateReq = useCallback(
    (id: string, req: BuilderRequest) => {
      onChange({
        ...state,
        requests: state.requests.map((r) => (r.id === id ? req : r)),
      });
    },
    [state, onChange],
  );

  const removeReq = useCallback(
    (id: string) => {
      onChange({
        ...state,
        requests: state.requests.filter((r) => r.id !== id),
      });
    },
    [state, onChange],
  );

  const addReq = useCallback(() => {
    const r: BuilderRequest = {
      id: uid(),
      name: "request",
      method: "GET",
      path: "/",
      headers: [],
      params: [],
      body: "",
      transform: [],
    };
    onChange({ ...state, requests: [...state.requests, r] });
    setExpandedIds((prev) => new Set([...prev, r.id]));
  }, [state, onChange]);

  return (
    <div className={styles.builder}>
      {/* ── Base URL ── */}
      <section className={styles.section}>
        <label className={styles.sectionLabel}>Base URL</label>
        <input
          className={styles.inp}
          placeholder="https://api.example.com"
          value={state.baseUrl}
          onChange={(e) => onChange({ ...state, baseUrl: e.target.value })}
        />
      </section>

      {/* ── Global Headers ── */}
      <section className={styles.section}>
        <label className={styles.sectionLabel}>Global Headers</label>
        <KVEditor
          items={state.globalHeaders}
          onChange={(globalHeaders) => onChange({ ...state, globalHeaders })}
        />
      </section>

      {/* ── Auth ── */}
      <section className={styles.section}>
        <div className={styles.authToggleRow}>
          <input
            type="checkbox"
            id="auth-enabled"
            checked={state.authEnabled}
            onChange={(e) =>
              onChange({ ...state, authEnabled: e.target.checked })
            }
          />
          <label className={styles.sectionLabel} htmlFor="auth-enabled">
            API Key Auth
          </label>
        </div>
        {state.authEnabled && (
          <div className={styles.authFields}>
            <select
              className={styles.inp}
              value={state.authIn}
              onChange={(e) =>
                onChange({
                  ...state,
                  authIn: e.target.value as "header" | "query",
                })
              }
            >
              <option value="header">header</option>
              <option value="query">query param</option>
            </select>
            <input
              className={styles.inp}
              placeholder="name (e.g. x-api-key)"
              value={state.authName}
              onChange={(e) =>
                onChange({ ...state, authName: e.target.value })
              }
            />
            <input
              className={styles.inp}
              placeholder="value"
              value={state.authValue}
              onChange={(e) =>
                onChange({ ...state, authValue: e.target.value })
              }
            />
          </div>
        )}
      </section>

      {/* ── Requests ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeaderRow}>
          <label className={styles.sectionLabel}>Requests</label>
          <button className={styles.addBtn} onClick={addReq}>
            + Add request
          </button>
        </div>
        <div className={styles.reqList}>
          {state.requests.map((r) => (
            <RequestCard
              key={r.id}
              req={r}
              expanded={expandedIds.has(r.id)}
              onToggle={() => toggleExpanded(r.id)}
              onChange={(req) => updateReq(r.id, req)}
              onRemove={() => removeReq(r.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
