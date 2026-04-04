import Prism from "prismjs";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-json";
import Editor from "react-simple-code-editor";
import Builder, { type BuilderState } from "../Builder";
import { ConfigModeTabs } from "./ConfigModeTabs";
import { RequestToolbar } from "./RequestToolbar";
import { PathParamsInput } from "./PathParamsInput";
import { RunStatus } from "../utils";
import styles from "../App.module.css";

interface ConfigEditorPanelProps {
  mode: "editor" | "builder";
  configText: string;
  builderState: BuilderState;
  requestName: string;
  requestNames: string[];
  pathParams: string[];
  pathParamValues: Record<string, string>;
  status: RunStatus;
  isDirty: boolean;
  collectionName?: string;
  onModeChange: (mode: "editor" | "builder") => void;
  onConfigChange: (value: string) => void;
  onBuilderChange: (state: BuilderState) => void;
  onRequestChange: (name: string) => void;
  onPathParamChange: (param: string, value: string) => void;
  onRun: () => void;
  onSaveCollection?: () => void;
}

export function ConfigEditorPanel({
  mode,
  configText,
  builderState,
  requestName,
  requestNames,
  pathParams,
  pathParamValues,
  status,
  isDirty,
  collectionName,
  onModeChange,
  onConfigChange,
  onBuilderChange,
  onRequestChange,
  onPathParamChange,
  onRun,
  onSaveCollection,
}: ConfigEditorPanelProps) {
  return (
    <section className={styles.panel}>
      <ConfigModeTabs
        mode={mode}
        isDirty={isDirty}
        collectionName={collectionName}
        onModeChange={onModeChange}
        onSave={onSaveCollection}
      />

      {mode === "builder" ? (
        <div className={styles.builderWrapper}>
          <Builder state={builderState} onChange={onBuilderChange} />
        </div>
      ) : (
        <div className={styles.editorWrapper}>
          <Editor
            value={configText}
            onValueChange={onConfigChange}
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
        <RequestToolbar
          requestName={requestName}
          requestNames={requestNames}
          status={status}
          onRequestChange={onRequestChange}
          onRun={onRun}
        />
        <PathParamsInput
          params={pathParams}
          values={pathParamValues}
          onChange={onPathParamChange}
        />
      </div>
    </section>
  );
}
