import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { applyAuth } from './auth.js';
import type { FraftConfig, RequestDef, RunOverrides } from '../types.js';

export interface ExecutorOptions {
  axiosInstance?: AxiosInstance;
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

  const axiosConfig: AxiosRequestConfig = {
    ...(def.axiosConfig as AxiosRequestConfig | undefined),
    url: `${config.baseUrl}${def.path}`,
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
