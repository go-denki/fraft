import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { applyAuth } from './auth.js';
import type { FraftConfig, RequestDef, RunOverrides } from '../types.js';

export interface ExecutorOptions {
  axiosInstance?: AxiosInstance;
}

/**
 * Replaces `:param` segments in a path with values from `pathParams`.
 * Throws if a referenced parameter has no corresponding value.
 */
function interpolatePathParams(
  path: string,
  pathParams: Record<string, string | number>,
): string {
  return path.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_, key: string) => {
    const value = pathParams[key];
    if (value === undefined) {
      throw new Error(`fraft: path param ":${key}" is referenced in path "${path}" but was not provided in pathParams`);
    }
    return String(value);
  });
}

export async function executeRequest(
  config: FraftConfig,
  def: RequestDef,
  overrides: RunOverrides = {},
  options: ExecutorOptions = {},
): Promise<unknown> {
  const instance = options.axiosInstance ?? axios;

  const mergedHeaders: Record<string, string> = {
    ...config.headers,
    ...def.headers,
    ...overrides.headers,
  };

  const mergedParams = {
    ...def.params,
    ...overrides.params,
  };

  const resolvedPath = overrides.pathParams
    ? interpolatePathParams(def.path, overrides.pathParams)
    : def.path;

  const axiosConfig: AxiosRequestConfig = {
    ...(def.axiosConfig as AxiosRequestConfig | undefined),
    url: `${config.baseUrl}${resolvedPath}`,
    method: def.method ?? 'GET',
    headers: mergedHeaders,
    params: Object.keys(mergedParams).length > 0 ? mergedParams : undefined,
    data: overrides.body !== undefined ? overrides.body : def.body,
  };

  if (config.auth) {
    applyAuth(axiosConfig, config.auth);
  }

  const response = await instance.request(axiosConfig);
  return response.data as unknown;
}
