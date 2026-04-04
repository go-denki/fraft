import type { RenameStep } from '../types.js';

function renameObject(
  obj: Record<string, unknown>,
  mapping: Record<string, string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = mapping[key] ?? key;
    result[newKey] = value;
  }
  return result;
}

export function applyRename(data: unknown, step: RenameStep): unknown {
  if (Array.isArray(data)) {
    return data.map(item =>
      item !== null && typeof item === 'object'
        ? renameObject(item as Record<string, unknown>, step.rename)
        : item,
    );
  }
  if (data !== null && typeof data === 'object') {
    return renameObject(data as Record<string, unknown>, step.rename);
  }
  return data;
}
