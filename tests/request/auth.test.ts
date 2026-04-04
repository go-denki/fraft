import { describe, it, expect } from 'vitest';
import { applyAuth } from '../../src/request/auth.js';
import type { AxiosRequestConfig } from 'axios';

describe('applyAuth', () => {
  it('injects api key into header', () => {
    const config: AxiosRequestConfig = { headers: {} };
    applyAuth(config, { type: 'apiKey', in: 'header', name: 'x-api-key', value: 'tok123' });
    expect(config.headers).toEqual({ 'x-api-key': 'tok123' });
  });

  it('injects api key into query params', () => {
    const config: AxiosRequestConfig = {};
    applyAuth(config, { type: 'apiKey', in: 'query', name: 'apiKey', value: 'tok123' });
    expect(config.params).toEqual({ apiKey: 'tok123' });
  });

  it('merges with existing headers', () => {
    const config: AxiosRequestConfig = { headers: { Accept: 'application/json' } };
    applyAuth(config, { type: 'apiKey', in: 'header', name: 'x-api-key', value: 'tok' });
    expect(config.headers).toEqual({ Accept: 'application/json', 'x-api-key': 'tok' });
  });

  it('merges with existing params', () => {
    const config: AxiosRequestConfig = { params: { page: 1 } };
    applyAuth(config, { type: 'apiKey', in: 'query', name: 'apiKey', value: 'tok' });
    expect(config.params).toEqual({ page: 1, apiKey: 'tok' });
  });
});
