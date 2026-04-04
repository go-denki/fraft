import { useState, useCallback, useEffect } from "react";
import {
  yamlToBuilder,
  builderToYaml,
  defaultState,
  type BuilderState,
} from "./Builder";
import {
  CollectionsSidebar,
  ConfigEditorPanel,
  ResponsePanel,
} from "./components";
import { DEFAULT_CONFIG, detectPathParams, getRequestNames } from "./utils";
import { useCollections, useRun } from "./hooks";
import styles from "./App.module.css";

export default function App() {
  const [mode, setMode] = useState<"editor" | "builder">("editor");
  const [configText, setConfigText] = useState(DEFAULT_CONFIG);
  const [builderState, setBuilderState] = useState<BuilderState>(
    () => yamlToBuilder(DEFAULT_CONFIG) ?? defaultState(),
  );
  const [requestName, setRequestName] = useState("todo");
  const [pathParamValues, setPathParamValues] = useState<
    Record<string, string>
  >({ id: "1" });

  const collections = useCollections();
  const run = useRun();

  const detectedPathParams = detectPathParams(configText, requestName);
  const requestNames = getRequestNames(configText);
  const selectedCollection = collections.selectedCollection;
  const isDirty =
    selectedCollection != null && selectedCollection.config !== configText;

  // Keep pathParamValues in sync when detected params change
  useEffect(() => {
    setPathParamValues((prev) => {
      const next: Record<string, string> = {};
      for (const p of detectedPathParams) {
        next[p] = prev[p] ?? "";
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configText, requestName]);

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

  const handleRun = useCallback(() => {
    run.handleRun(configText, requestName, pathParamValues);
  }, [configText, requestName, pathParamValues, run]);

  const handleSaveCollection = useCallback(() => {
    collections.handleSaveCollection(configText);
  }, [configText, collections]);

  const handleClickCollection = useCallback(
    (id: string) => {
      const col = collections.handleClickCollection(id);
      if (!col) return;
      setConfigText(col.config);
      const parsed = yamlToBuilder(col.config);
      if (parsed) setBuilderState(parsed);
      const names = getRequestNames(col.config);
      if (names.length > 0) setRequestName(names[0]);
    },
    [collections],
  );

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
        <CollectionsSidebar
          collections={collections.collections}
          selectedId={collections.selectedId}
          isDirty={isDirty}
          saveInputVisible={collections.saveInputVisible}
          saveInputValue={collections.saveInputValue}
          onSaveInputVisibleChange={collections.setSaveInputVisible}
          onSaveInputValueChange={collections.setSaveInputValue}
          onSaveCollection={handleSaveCollection}
          onClickCollection={handleClickCollection}
          onDeleteCollection={collections.handleDeleteCollection}
        />

        <main className={styles.main}>
          <ConfigEditorPanel
            mode={mode}
            configText={configText}
            builderState={builderState}
            requestName={requestName}
            requestNames={requestNames}
            pathParams={detectedPathParams}
            pathParamValues={pathParamValues}
            status={run.status}
            isDirty={isDirty}
            collectionName={selectedCollection?.name}
            onModeChange={handleModeSwitch}
            onConfigChange={handleConfigChange}
            onBuilderChange={handleBuilderChange}
            onRequestChange={setRequestName}
            onPathParamChange={(param, value) => {
              setPathParamValues((prev) => ({
                ...prev,
                [param]: value,
              }));
            }}
            onRun={handleRun}
            onSaveCollection={
              isDirty
                ? () => collections.handleUpdateCollection(configText)
                : undefined
            }
          />

          <ResponsePanel
            status={run.status}
            result={run.result}
            error={run.error}
            elapsed={run.elapsed}
          />
        </main>
      </div>
    </div>
  );
}
