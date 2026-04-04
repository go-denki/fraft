import type { FilterStep } from '../types.js';

function getValue(obj: Record<string, unknown>, field: string): unknown {
  return obj[field];
}

function testCondition(
  actual: unknown,
  op: FilterStep['filter']['op'],
  expected: unknown,
): boolean {
  switch (op) {
    case 'eq': return actual === expected;
    case 'neq': return actual !== expected;
    case 'gt': return (actual as number) > (expected as number);
    case 'gte': return (actual as number) >= (expected as number);
    case 'lt': return (actual as number) < (expected as number);
    case 'lte': return (actual as number) <= (expected as number);
    case 'contains': return typeof actual === 'string' && actual.includes(String(expected));
    case 'startsWith': return typeof actual === 'string' && actual.startsWith(String(expected));
    case 'endsWith': return typeof actual === 'string' && actual.endsWith(String(expected));
    default:
      throw new Error(`fraft: unknown filter op "${String(op)}"`);
  }
}

export function applyFilter(data: unknown, step: FilterStep): unknown {
  if (!Array.isArray(data)) {
    throw new Error(
      'fraft: the "filter" transform can only be applied to an array response. ' +
        'Got: ' + (data === null ? 'null' : typeof data),
    );
  }
  const { field, op, value } = step.filter;
  return data.filter(item => {
    if (item === null || typeof item !== 'object') return false;
    return testCondition(getValue(item as Record<string, unknown>, field), op, value);
  });
}
