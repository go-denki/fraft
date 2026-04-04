import type { AxiosRequestConfig } from 'axios';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface ApiKeyAuth {
  type: 'apiKey';
  /** 'header' injects into request headers; 'query' injects as a query param */
  in: 'header' | 'query';
  /** Header name or query param key, e.g. "x-api-key" or "apiKey" */
  name: string;
  /** Value, supports "${env.VAR_NAME}" interpolation */
  value: string;
}

export type AuthConfig = ApiKeyAuth;

// ---------------------------------------------------------------------------
// Transforms
// ---------------------------------------------------------------------------

export interface PickStep {
  pick: string[];
}

export interface RenameStep {
  rename: Record<string, string>;
}

export interface CoerceRule {
  type?: 'string' | 'number' | 'boolean';
  /** sprintf-style format string, e.g. "%.2f" — applied after type coercion */
  format?: string;
  /** Simple arithmetic: "+5", "-1", "*100", "/1000" */
  expr?: string;
}

export interface CoerceStep {
  coerce: Record<string, CoerceRule | 'string' | 'number' | 'boolean'>;
}

export interface FilterStep {
  filter: {
    field: string;
    op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
    value: unknown;
  };
}

export interface MiddlewareStep {
  middleware: string;
}

export type TransformStep =
  | PickStep
  | RenameStep
  | CoerceStep
  | FilterStep
  | MiddlewareStep;

// ---------------------------------------------------------------------------
// Request definition
// ---------------------------------------------------------------------------

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface RequestDef {
  path: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  body?: unknown;
  /** Transform steps applied to the response data in order */
  transform?: TransformStep[];
  /** Per-request axios overrides (timeout, responseType, etc.) */
  axiosConfig?: Omit<AxiosRequestConfig, 'url' | 'method' | 'headers' | 'params' | 'data'>;
}

// ---------------------------------------------------------------------------
// Top-level config
// ---------------------------------------------------------------------------

export interface FraftConfig {
  /** Config schema version — currently must be 1 */
  version?: number;
  baseUrl: string;
  /** Global headers merged with per-request headers */
  headers?: Record<string, string>;
  auth?: AuthConfig;
  requests: Record<string, RequestDef>;
}

// ---------------------------------------------------------------------------
// Runtime context / overrides
// ---------------------------------------------------------------------------

export interface RunOverrides {
  /** Path parameter values to interpolate into `:param` segments of the request path. */
  pathParams?: Record<string, string | number>;
  params?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface RequestContext {
  requestName: string;
  config: FraftConfig;
  def: RequestDef;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export type MiddlewareFn = (
  data: unknown,
  context: RequestContext,
) => unknown | Promise<unknown>;
