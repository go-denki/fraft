import styles from "../App.module.css";

interface PathParamsInputProps {
  params: string[];
  values: Record<string, string>;
  onChange: (param: string, value: string) => void;
}

export function PathParamsInput({
  params,
  values,
  onChange,
}: PathParamsInputProps) {
  if (params.length === 0) return null;

  return (
    <div className={styles.pathParamsRow}>
      <span className={styles.label}>Path params</span>
      {params.map((param) => (
        <div key={param} className={styles.pathParamField}>
          <span className={styles.pathParamName}>:{param}</span>
          <input
            className={styles.pathParamInput}
            placeholder="value"
            value={values[param] ?? ""}
            onChange={(e) => onChange(param, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
