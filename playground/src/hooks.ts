import { useCallback, useRef, useState } from "react";
import { FraftClient } from "@go-denki/fraft";
import yaml from "js-yaml";
import { Collection, RunStatus, getRequestNames, saveCollectionsToStorage } from "./utils";

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>(() => {
    try {
      const raw = localStorage.getItem("fraft_collections");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Collection[];
    } catch {}
    return [];
  });
  const [selectedId, setSelectedId] = useState<string>("");
  const [saveInputVisible, setSaveInputVisible] = useState(false);
  const [saveInputValue, setSaveInputValue] = useState("");

  const handleSaveCollection = useCallback(
    (configText: string) => {
      const name = saveInputValue.trim();
      if (!name) return;
      const id = Math.random().toString(36).slice(2, 9);
      const next: Collection[] = [
        ...collections,
        { id, name, config: configText },
      ];
      setCollections(next);
      saveCollectionsToStorage(next);
      setSelectedId(id);
      setSaveInputValue("");
      setSaveInputVisible(false);
    },
    [collections, saveInputValue],
  );

  const handleClickCollection = useCallback(
    (id: string) => {
      const col = collections.find((c) => c.id === id);
      if (!col) return;
      setSelectedId(id);
      return col;
    },
    [collections],
  );

  const handleUpdateCollection = useCallback(
    (configText: string) => {
      if (!selectedId) return;
      const next = collections.map((c) =>
        c.id === selectedId ? { ...c, config: configText } : c,
      );
      setCollections(next);
      saveCollectionsToStorage(next);
    },
    [collections, selectedId],
  );

  const handleDeleteCollection = useCallback(
    (id: string) => {
      const next = collections.filter((c) => c.id !== id);
      setCollections(next);
      saveCollectionsToStorage(next);
      if (selectedId === id) setSelectedId("");
    },
    [collections, selectedId],
  );

  const selectedCollection = collections.find((c) => c.id === selectedId);

  return {
    collections,
    selectedId,
    selectedCollection,
    saveInputVisible,
    setSaveInputVisible,
    saveInputValue,
    setSaveInputValue,
    handleSaveCollection,
    handleClickCollection,
    handleUpdateCollection,
    handleDeleteCollection,
  };
}

export function useRun() {
  const [status, setStatus] = useState<RunStatus>("idle");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleRun = useCallback(
    async (
      configText: string,
      requestName: string,
      pathParamValues: Record<string, string>,
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus("loading");
      setError(null);
      setResult(null);
      setElapsed(null);

      let parsed: Record<string, unknown>;
      try {
        const raw = yaml.load(configText);
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
          throw new Error("Config must be a YAML/JSON object.");
        }
        parsed = raw as Record<string, unknown>;
      } catch (err) {
        setStatus("error");
        setError(
          `Parse error: ${err instanceof Error ? err.message : String(err)}`,
        );
        return;
      }

      const start = performance.now();
      try {
        const client = new FraftClient({ config: parsed });
        const pathParamsOverride: Record<string, string | number> = {};
        for (const [k, v] of Object.entries(pathParamValues)) {
          if (v !== "") {
            const num = Number(v);
            pathParamsOverride[k] = isNaN(num) ? v : num;
          }
        }
        const result = await client.run(
          requestName,
          Object.keys(pathParamsOverride).length > 0
            ? { pathParams: pathParamsOverride }
            : {},
        );
        if (controller.signal.aborted) return;
        const ms = Math.round(performance.now() - start);
        setElapsed(ms);
        setStatus("success");
        setResult(result);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        setStatus("error");
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [],
  );

  return { status, result, error, elapsed, handleRun, abortRef };
}
