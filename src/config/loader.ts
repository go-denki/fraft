import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import yaml from 'js-yaml';
import { FraftConfigSchema } from './schema.js';
import type { FraftConfig } from '../types.js';

/**
 * Interpolates "${env.VAR_NAME}" placeholders with actual process.env values.
 * Works on any JSON-serialisable value (string, object, or array).
 */
function interpolateEnv(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/\$\{env\.([^}]+)\}/g, (_, varName: string) => {
      const envVal = process.env[varName];
      if (envVal === undefined) {
        throw new Error(`fraft: env variable "${varName}" is not set`);
      }
      return envVal;
    });
  }
  if (Array.isArray(value)) {
    return value.map(interpolateEnv);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, interpolateEnv(v)]),
    );
  }
  return value;
}

/**
 * Load and validate a FraftConfig from a file path (JSON or YAML) or an
 * already-parsed plain object. Env var placeholders are interpolated before
 * validation.
 */
export function loadConfig(source: string | Record<string, unknown>): FraftConfig {
  let raw: unknown;

  if (typeof source === 'string') {
    const absPath = resolve(source);
    const ext = extname(absPath).toLowerCase();
    const content = readFileSync(absPath, 'utf8');

    if (ext === '.json') {
      raw = JSON.parse(content) as unknown;
    } else if (ext === '.yaml' || ext === '.yml') {
      raw = yaml.load(content);
    } else {
      throw new Error(`fraft: unsupported config file extension "${ext}". Use .json, .yaml, or .yml`);
    }
  } else {
    raw = source;
  }

  const interpolated = interpolateEnv(raw);
  const result = FraftConfigSchema.safeParse(interpolated);

  if (!result.success) {
    const messages = result.error.errors
      .map(e => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`fraft: invalid config\n${messages}`);
  }

  return result.data as FraftConfig;
}
