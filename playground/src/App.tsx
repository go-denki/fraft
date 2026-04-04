import { useState, useCallback, useRef } from 'react';
import yaml from 'js-yaml';
import styles from './App.module.css';

const DEFAULT_CONFIG = `\
version: 1
baseUrl: https://jsonplaceholder.typicode.com

requests:
  todo:
    path: /todos/1
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

type RunStatus = 'idle' | 'loading' | 'success' | 'error';

function getRequestNames(text: string): string[] {
  try {
    const parsed = yaml.load(text) as Record<string, unknown>;
    const requests = (parsed as { requests?: Record<string, unknown> })?.requests;
    if (requests && typeof requests === 'object') {
      return Object.keys(requests);
    }
  } catch {
    // invalid config
  }
  return [];
}

export default function App() {
  const [configText, setConfigText] = useState(DEFAULT_CONFIG);
  const [requestName, setRequestName] = useState('todo');
  const [status, setStatus] = useState<RunStatus>('idle');
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const requestNames = getRequestNames(configText);

  const handleConfigChange = useCallback((value: string) => {
    setConfigText(value);
    const names = getRequestNames(value);
    if (names.length > 0 && !names.includes(requestName)) {
      setRequestName(names[0]);
    }
  }, [requestName]);

  const handleRun = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);
    setResult(null);
    setElapsed(null);

    let parsed: Record<string, unknown>;
    try {
      const raw = yaml.load(configText);
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new Error('Config must be a YAML/JSON object.');
      }
      parsed = raw as Record<string, unknown>;
    } catch (err) {
      setStatus('error');
      setError(`Parse error: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    const start = performance.now();
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: parsed, requestName }),
        signal: controller.signal,
      });
      const data = await res.json() as { result?: unknown; error?: string };
      const ms = Math.round(performance.now() - start);
      setElapsed(ms);
      if (!res.ok || data.error) {
        setStatus('error');
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setStatus('success');
        setResult(data.result);
      }
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [configText, requestName]);

  const resultJson = result !== undefined && result !== null
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

      <main className={styles.main}>
        {/* ── Left panel: config editor ── */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Config</span>
            <span className={styles.badge}>YAML / JSON</span>
          </div>

          <textarea
            className={styles.editor}
            value={configText}
            onChange={(e) => handleConfigChange(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="Paste your fraft YAML or JSON config here…"
          />

          <div className={styles.toolbar}>
            <div className={styles.requestRow}>
              <label className={styles.label} htmlFor="req-select">Request</label>
              {requestNames.length > 0 ? (
                <select
                  id="req-select"
                  className={styles.select}
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                >
                  {requestNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
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
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <>
                  <span className={styles.spinner} />
                  Running…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <path d="M3 2l9 5-9 5V2z" />
                  </svg>
                  Run
                </>
              )}
            </button>
          </div>
        </section>

        {/* ── Right panel: response ── */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Response</span>
            {elapsed !== null && (
              <span className={styles.badge}>{elapsed} ms</span>
            )}
            {status === 'success' && (
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>200 OK</span>
            )}
            {status === 'error' && (
              <span className={`${styles.badge} ${styles.badgeError}`}>Error</span>
            )}
          </div>

          <div className={styles.responseArea}>
            {status === 'idle' && (
              <div className={styles.empty}>
                Hit <strong>Run</strong> to see the response here.
              </div>
            )}
            {status === 'loading' && (
              <div className={styles.empty}>
                <span className={styles.spinnerLg} />
              </div>
            )}
            {status === 'error' && error && (
              <pre className={`${styles.output} ${styles.outputError}`}>{error}</pre>
            )}
            {status === 'success' && resultJson && (
              <pre className={`${styles.output} ${styles.outputSuccess}`}>{resultJson}</pre>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
