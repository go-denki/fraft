declare const __CLARITY_PROJECT_ID__: string;

export function initClarity(): void {
  if (!__CLARITY_PROJECT_ID__) return;

  const id = __CLARITY_PROJECT_ID__;
  (function (c: Window & typeof globalThis, l: Document, a: string, r: string, i: string) {
    type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[] };
    (c[a as keyof typeof c] as ClarityFn) =
      (c[a as keyof typeof c] as ClarityFn) ||
      function (...args: unknown[]) {
        ((c[a as keyof typeof c] as ClarityFn).q =
          (c[a as keyof typeof c] as ClarityFn).q || []).push(args);
      };
    const t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = 'https://www.clarity.ms/tag/' + i;
    const y = l.getElementsByTagName(r)[0];
    y.parentNode!.insertBefore(t, y);
  })(window, document, 'clarity', 'script', id);
}
