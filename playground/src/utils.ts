import yaml from "js-yaml";

export type Collection = { id: string; name: string; config: string };
export type RunStatus = "idle" | "loading" | "success" | "error";

const COLLECTIONS_KEY = "fraft_collections";

export function loadCollectionsFromStorage(): Collection[] {
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

export function saveCollectionsToStorage(collections: Collection[]): void {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
}

export function getRequestNames(text: string): string[] {
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

export function detectPathParams(text: string, reqName: string): string[] {
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

export const DEFAULT_CONFIG = `\
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
