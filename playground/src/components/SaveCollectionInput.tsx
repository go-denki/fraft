import styles from "../App.module.css";

interface SaveCollectionInputProps {
  visible: boolean;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function SaveCollectionInput({
  visible,
  value,
  onChange,
  onSave,
  onCancel,
}: SaveCollectionInputProps) {
  if (!visible) return null;

  return (
    <div className={styles.sidebarSaveRow}>
      <input
        className={styles.saveInput}
        autoFocus
        placeholder="Name…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") {
            onCancel();
          }
        }}
      />
      <button
        className={styles.sidebarConfirmBtn}
        onClick={onSave}
        disabled={!value.trim()}
        title="Save"
      >
        ✓
      </button>
      <button
        className={styles.sidebarConfirmBtn}
        onClick={onCancel}
        title="Cancel"
      >
        ✕
      </button>
    </div>
  );
}
