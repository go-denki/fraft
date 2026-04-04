import { useState, useCallback, useRef, useEffect } from "react";
import { FraftClient } from "@go-denki/fraft";
import yaml from "js-yaml";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-json";
import Builder, {
  type BuilderState,
  defaultState,
  builderToYaml,
  yamlToBuilder,
} from "./Builder";
import styles from "./App.module.css";

const COLLECTIONS_KEY = "fraft_collections";

type Collection = { id: string; name: string; config: string };

function loadCollectionsFromStorage(): Collection[] {
  try {
    const raw = localStorage.getItem(COLLECTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Collection[];
  } catch {
    // corrupted storage
  }
  return [];
}

function saveCollectionsToStorage(collections: Collection[]): void {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
}

const DEFAULT_CONFIG = `\
version: 1
baseUrl: https://jsonplaceholder.typicode.com

requests:
  todo:
    path: /todos/:id
    method: GET

  posts:
    path: /posts
    method: GET
    transform:
      - pick: [id, title, userId]
      - filter:
          field: userId
          op: eq
          value: 1
`;

type RunStatus = "idle" | "loading" | "success" | "error";

function getRequestNames(text: string): string[] {
  try {
    const parsed = yaml.load(text) as Record<string, unknown>;
    const requests = (parsed as { requests?: Record<string, unknown> })
      ?.requests;
    if (requests && typeof requests === "object") {
      return Object.keys(requests);
    }
  } catch {
    // invalid config
  }
  return [];
}

function detectPathParams(text: string, reqName: string): string[] {
  try {
    const parsed = yaml.load(text) as Record<string, unknown>;
    const requests = (parsed as { requests?: Record<string, unknown> })
      ?.requests;
    if (requests && typeof requests === "object") {
      const def = (requests as Record<string, unknown>)[reqName];
      if (def && typeof def === "object") {
        const path = (def as Record<string, unknown>).path;
        if (typeof path === "string") {
          const matches = path.match(/:([A-Za-z_][A-Za-z0-9_]*)/g);
          if (matches) return matches.map((m) => m.slice(1));
        }
      }
    }
  } catch {
    // invalid config
  }
  return [];
}

export default function App() {
  const [mode, setMode] = useState<"editor" | "builder">("editor");
  const [configText, setConfigText] = useState(DEFAULT_CONFIG);
  const [builderState, setBuilderState] = useState<BuilderState>(
    () => yamlToBuilder(DEFAULT_CONFIG) ?? defaultState(),
  );
  const [requestName, setRequestName] = useState("todo");
  const [status, setStatus] = useState<RunStatus>("idle");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [collections, setCollections] = useState<Collection[]>(
    loadCollectionsFromStorage,
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [saveInputVisible, setSaveInputVisible] = useState(false);
  const [saveInputValue, setSaveInputValue] = useState("");
  const [pathParamValues, setPathParamValues] = useState<Record<string, string>>({ id: "1" });

  const detectedPathParams = detectPathParams(configText, requestName);

  // keep pathParamValues in sync when detected params change
  useEffect(() => {
    setPathParamValues((prev) => {
      const next: Record<string, string> = {};
      for (const p of detectedPathParams) {
        next[p] = prev[p] ?? "";
      }
      return next;
    });
    // detectedPathParams is derived, stringify to avoid unnecessary runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configText, requestName]);

  const handleSaveCollection = useCallback(() => {
    const name = saveInputValue.trim();
    if (!name) return;
    const id = Math.random().toString(36).slice(2, 9);
    const next: Collection[] = [
      ...collections,
      { id, name, config: configText },
    ];
    setCollections(next);
    saveCollectionsToStorage(next);
    setSelectedCollectionId(id);
    setSaveInputValue("");
    setSaveInputVisible(false);
  }, [collections, configText, saveInputValue]);

  const handleClickCollection = useCallback((id: string) => {
    const col = collections.find((c) => c.id === id);
    if (!col) return;
    setSelectedCollectionId(id);
    setConfigText(col.config);
    const parsed = yamlToBuilder(col.config);
    if (parsed) setBuilderState(parsed);
    const names = getRequestNames(col.config);
    if (names.length > 0) setRequestName(names[0]);
  }, [collections]);

  const handleUpdateCollection = useCallback(() => {
    if (!selectedCollectionId) return;
    const next = collections.map((c) =>
      c.id === selectedCollectionId ? { ...c, config: configText } : c,
    );
    setCollections(next);
    saveCollectionsToStorage(next);
  }, [collections, selectedCollectionId, configText]);

  const handleDeleteCollection = useCallback((id: string) => {
    const next = collections.filter((c) => c.id !== id);
    setCollections(next);
    saveCollectionsToStorage(next);
    if (selectedCollectionId === id) setSelectedCollectionId("");
  }, [collections, selectedCollectionId]);

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);
  const isDirty = selectedCollection != null && selectedCollection.config !== configText;

  const requestNames = getRequestNames(configText);

  const handleConfigChange = useCallback(
    (value: string) => {
      setConfigText(value);
      const names = getRequestNames(value);
      if (names.length > 0 && !names.includes(requestName)) {
        setRequestName(names[0]);
      }
    },
    [requestName],
  );

  const handleBuilderChange = useCallback(
    (s: BuilderState) => {
      setBuilderState(s);
      const newYaml = builderToYaml(s);
      setConfigText(newYaml);
      const names = s.requests.map((r) => r.name).filter((n) => n.trim());
      if (names.length > 0 && !names.includes(requestName)) {
        setRequestName(names[0]);
      }
    },
    [requestName],
  );

  const handleModeSwitch = useCallback(
    (newMode: "editor" | "builder") => {
      if (newMode === mode) return;
      if (newMode === "builder") {
        const parsed = yamlToBuilder(configText);
        if (parsed) setBuilderState(parsed);
      }
      setMode(newMode);
    },
    [mode, configText],
  );

  const handleRun = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(null);
    setResult(null);
    setElapsed(null);

    let parsed: Record<string, unknown>;
    try {
      const raw = yaml.load(configText);
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        throw new Error("Config must be a YAML/JSON object.");
      }
      parsed = raw as Record<string, unknown>;
    } catch (err) {
      setStatus("error");
      setError(
        `Parse error: ${err instanceof Error ? err.message : String(err)}`,
      );
      return;
    }

    const start = performance.now();
    try {
      const client = new FraftClient({ config: parsed });
      const pathParamsOverride: Record<string, string | number> = {};
      for (const [k, v] of Object.entries(pathParamValues)) {
        if (v !== "") {
          const num = Number(v);
          pathParamsOverride[k] = isNaN(num) ? v : num;
        }
      }
      const result = await client.run(
        requestName,
        Object.keys(pathParamsOverride).length > 0
          ? { pathParams: pathParamsOverride }
          : {},
      );
      if (controller.signal.aborted) return;
      const ms = Math.round(performance.now() - start);
      setElapsed(ms);
      setStatus("success");
      setResult(result);
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [configText, requestName]);

  const resultJson =
    result !== undefined && result !== null
      ? JSON.stringify(result, null, 2)
      : null;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <span className={styles.logo}>
          <span className={styles.logoAccent}>fraft</span> playground
        </span>
        <span className={styles.subtitle}>
          Paste a YAML or JSON config, pick a request, hit Run.
        </span>
      </header>

      <div className={styles.body}>
        {/* ── Sidebar: collections ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>Collections</span>
            <div className={styles.sidebarActions}>
              <button
                className={styles.sidebarAddBtn}
                title="Save current config as a new collection"
                onClick={() => setSaveInputVisible(true)}
              >
                +
              </button>
            </div>
          </div>

          {saveInputVisible && (
            <div className={styles.sidebarSaveRow}>
              <input
                className={styles.saveInput}
                autoFocus
                placeholder="Name…"
                value={saveInputValue}
                onChange={(e) => setSaveInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveCollection();
                  if (e.key === "Escape") {
                    setSaveInputVisible(false);
                    setSaveInputValue("");
                  }
                }}
              />
              <button
                className={styles.sidebarConfirmBtn}
                onClick={handleSaveCollection}
                disabled={!saveInputValue.trim()}
                title="Save"
              >
                ✓
              </button>
              <button
                className={styles.sidebarConfirmBtn}
                onClick={() => {
                  setSaveInputVisible(false);
                  setSaveInputValue("");
                }}
                title="Cancel"
              >
                ✕
              </button>
            </div>
          )}

          <ul className={styles.collectionList}>
            {collections.length === 0 && (
              <li className={styles.collectionEmpty}>No saved collections</li>
            )}
            {collections.map((col) => (
              <li
                key={col.id}
                className={`${styles.collectionItem} ${
                  selectedCollectionId === col.id
                    ? styles.collectionItemActive
                    : ""
                }`}
                onClick={() => handleClickCollection(col.id)}
              >
                <span className={styles.collectionItemName}>{col.name}</span>
                {selectedCollectionId === col.id && isDirty && (
                  <span className={styles.dirtyDot} title="Unsaved changes" />
                )}
                <button
                  className={styles.collectionItemDel}
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCollection(col.id);
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* ── Main area ── */}
        <main className={styles.main}>
          {/* ── Left panel: config editor / builder ── */}
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${
                    mode === "editor" ? styles.tabActive : ""
                  }`}
                  onClick={() => handleModeSwitch("editor")}
                >
                  Editor
                </button>
                <button
                  className={`${styles.tab} ${
                    mode === "builder" ? styles.tabActive : ""
                  }`}
                  onClick={() => handleModeSwitch("builder")}
                >
                  Builder
                </button>
              </div>
              {isDirty && (
                <button
                  className={styles.saveCollectionBtn}
                  title={`Save changes to "${selectedCollection?.name}"`}
                  onClick={handleUpdateCollection}
                >
                  Save
                </button>
              )}
            </div>

            {mode === "builder" ? (
              <div className={styles.builderWrapper}>
                <Builder state={builderState} onChange={handleBuilderChange} />
              </div>
            ) : (
              <div className={styles.editorWrapper}>
                <Editor
                  value={configText}
                  onValueChange={handleConfigChange}
                  highlight={(code) => {
                    const trimmed = code.trimStart();
                    const lang =
                      trimmed.startsWith("{") || trimmed.startsWith("[")
                        ? Prism.languages.json
                        : Prism.languages.yaml;
                    return Prism.highlight(
                      code,
                      lang,
                      trimmed.startsWith("{") || trimmed.startsWith("[")
                        ? "json"
                        : "yaml",
                    );
                  }}
                  padding={16}
                  insertSpaces
                  tabSize={2}
                  className={styles.editor}
                  textareaClassName={styles.editorTextarea}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: "var(--text)",
                  }}
                  placeholder="Paste your fraft YAML or JSON config here…"
                />
              </div>
            )}

            <div className={styles.toolbar}>
              <div className={styles.toolbarMainRow}>
              <div className={styles.requestRow}>
                <label className={styles.label} htmlFor="req-select">
                  Request
                </label>
                {requestNames.length > 0 ? (
                  <select
                    id="req-select"
                    className={styles.select}
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                  >
                    {requestNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="req-select"
                    className={styles.input}
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    placeholder="request name"
                  />
                )}
              </div>

              <button
                className={styles.runBtn}
                onClick={handleRun}
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <span className={styles.spinner} />
                    Running…
                  </>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="currentColor"
                    >
                      <path d="M3 2l9 5-9 5V2z" />
                    </svg>
                    Run
                  </>
                )}
              </button>
              </div>

              {detectedPathParams.length > 0 && (
                <div className={styles.pathParamsRow}>
                  <span className={styles.label}>Path params</span>
                  {detectedPathParams.map((param) => (
                    <div key={param} className={styles.pathParamField}>
                      <span className={styles.pathParamName}>:{param}</span>
                      <input
                        className={styles.pathParamInput}
                        placeholder="value"
                        value={pathParamValues[param] ?? ""}
                        onChange={(e) =>
                          setPathParamValues((prev) => ({
                            ...prev,
                            [param]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Right panel: response ── */}
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Response</span>
              {elapsed !== null && (
                <span className={styles.badge}>{elapsed} ms</span>
              )}
              {status === "success" && (
                <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                  200 OK
                </span>
              )}
              {status === "error" && (
                <span className={`${styles.badge} ${styles.badgeError}`}>
                  Error
                </span>
              )}
            </div>

            <div className={styles.responseArea}>
              {status === "idle" && (
                <div className={styles.empty}>
                  Hit <strong>Run</strong> to see the response here.
                </div>
              )}
              {status === "loading" && (
                <div className={styles.empty}>
                  <span className={styles.spinnerLg} />
                </div>
              )}
              {status === "error" && error && (
                <pre className={`${styles.output} ${styles.outputError}`}>
                  {error}
                </pre>
              )}
              {status === "success" && resultJson && (
                <pre className={`${styles.output} ${styles.outputSuccess}`}>
                  {resultJson}
                </pre>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
