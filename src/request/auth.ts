import type { AxiosRequestConfig } from 'axios';
import type { AuthConfig } from '../types.js';

/**
 * Mutates the provided axiosConfig by injecting the auth credential.
 */
export function applyAuth(axiosConfig: AxiosRequestConfig, auth: AuthConfig): void {
  if (auth.type === 'apiKey') {
    if (auth.in === 'header') {
      axiosConfig.headers = {
        ...axiosConfig.headers,
        [auth.name]: auth.value,
      };
    } else {
      axiosConfig.params = {
        ...axiosConfig.params,
        [auth.name]: auth.value,
      };
    }
  }
}
