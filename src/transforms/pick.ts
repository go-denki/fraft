import type { PickStep } from '../types.js';

function pickFromObject(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function applyPick(data: unknown, step: PickStep): unknown {
  if (Array.isArray(data)) {
    return data.map(item =>
      item !== null && typeof item === 'object'
        ? pickFromObject(item as Record<string, unknown>, step.pick)
        : item,
    );
  }
  if (data !== null && typeof data === 'object') {
    return pickFromObject(data as Record<string, unknown>, step.pick);
  }
  return data;
}
