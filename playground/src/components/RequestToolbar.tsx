import { RunStatus } from "../utils";
import styles from "../App.module.css";

interface RequestToolbarProps {
  requestName: string;
  requestNames: string[];
  status: RunStatus;
  onRequestChange: (name: string) => void;
  onRun: () => void;
}

export function RequestToolbar({
  requestName,
  requestNames,
  status,
  onRequestChange,
  onRun,
}: RequestToolbarProps) {
  return (
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
            onChange={(e) => onRequestChange(e.target.value)}
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
            onChange={(e) => onRequestChange(e.target.value)}
            placeholder="request name"
          />
        )}
      </div>

      <button
        className={styles.runBtn}
        onClick={onRun}
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
  );
}
