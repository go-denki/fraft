import { RunStatus } from "../utils";
import styles from "../App.module.css";

interface ResponsePanelProps {
  status: RunStatus;
  result: unknown;
  error: string | null;
  elapsed: number | null;
}

export function ResponsePanel({
  status,
  result,
  error,
  elapsed,
}: ResponsePanelProps) {
  const resultJson =
    result !== undefined && result !== null
      ? JSON.stringify(result, null, 2)
      : null;

  return (
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
  );
}
