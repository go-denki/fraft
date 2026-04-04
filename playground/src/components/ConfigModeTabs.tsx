import styles from "../App.module.css";

interface ConfigModeTabsProps {
  mode: "editor" | "builder";
  isDirty: boolean;
  collectionName?: string;
  onModeChange: (mode: "editor" | "builder") => void;
  onSave?: () => void;
}

export function ConfigModeTabs({
  mode,
  isDirty,
  collectionName,
  onModeChange,
  onSave,
}: ConfigModeTabsProps) {
  return (
    <div className={styles.panelHeader}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            mode === "editor" ? styles.tabActive : ""
          }`}
          onClick={() => onModeChange("editor")}
        >
          Editor
        </button>
        <button
          className={`${styles.tab} ${
            mode === "builder" ? styles.tabActive : ""
          }`}
          onClick={() => onModeChange("builder")}
        >
          Builder
        </button>
      </div>
      {isDirty && onSave && (
        <button
          className={styles.saveCollectionBtn}
          title={`Save changes to "${collectionName}"`}
          onClick={onSave}
        >
          Save
        </button>
      )}
    </div>
  );
}
