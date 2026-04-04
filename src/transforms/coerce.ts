import type { CoerceStep, CoerceRule } from '../types.js';

const EXPR_RE = /^([+\-*/])\s*(-?\d+(?:\.\d+)?)$/;

function coerceValue(raw: unknown, rule: CoerceRule | 'string' | 'number' | 'boolean'): unknown {
  const resolved: { type?: string; format?: string; expr?: string } =
    typeof rule === 'string' ? { type: rule } : rule;

  let value: unknown = raw;

  // 1. Type coercion
  if (resolved.type === 'number') {
    value = Number(value);
  } else if (resolved.type === 'boolean') {
    if (typeof value === 'string') {
      value = value.toLowerCase() !== 'false' && value !== '0' && value !== '';
    } else {
      value = Boolean(value);
    }
  } else if (resolved.type === 'string') {
    value = String(value);
  }

  // 2. Arithmetic expression (only sensible on numbers)
  if (resolved.expr) {
    const match = EXPR_RE.exec(resolved.expr.trim());
    if (!match) {
      throw new Error(`fraft: invalid coerce expr "${resolved.expr}". Expected format: "+5", "-1", "*100", "/1000"`);
    }
    const [, op, operandStr] = match;
    const operand = parseFloat(operandStr);
    const num = typeof value === 'number' ? value : Number(value);
    switch (op) {
      case '+': value = num + operand; break;
      case '-': value = num - operand; break;
      case '*': value = num * operand; break;
      case '/':
        if (operand === 0) throw new Error('fraft: coerce expr division by zero');
        value = num / operand;
        break;
    }
  }

  // 3. Format (sprintf-lite: only %.<n>f supported for now)
  if (resolved.format) {
    const fmtMatch = /^%\.(\d+)f$/.exec(resolved.format);
    if (fmtMatch) {
      value = (value as number).toFixed(parseInt(fmtMatch[1], 10));
    } else {
      throw new Error(`fraft: unsupported coerce format "${resolved.format}". Only "%.<n>f" is supported.`);
    }
  }

  return value;
}

function coerceObject(
  obj: Record<string, unknown>,
  coerce: Record<string, CoerceRule | 'string' | 'number' | 'boolean'>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...obj };
  for (const [field, rule] of Object.entries(coerce)) {
    if (Object.prototype.hasOwnProperty.call(result, field)) {
      result[field] = coerceValue(result[field], rule);
    }
  }
  return result;
}

export function applyCoerce(data: unknown, step: CoerceStep): unknown {
  if (Array.isArray(data)) {
    return data.map(item =>
      item !== null && typeof item === 'object'
        ? coerceObject(item as Record<string, unknown>, step.coerce)
        : item,
    );
  }
  if (data !== null && typeof data === 'object') {
    return coerceObject(data as Record<string, unknown>, step.coerce);
  }
  return data;
}
