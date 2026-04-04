import { describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { executeRequest } from '../../src/request/executor.js';
import type { FraftConfig } from '../../src/types.js';

const BASE = 'https://api.example.com';

const baseConfig: FraftConfig = {
  version: 1,
  baseUrl: BASE,
  requests: {},
};

describe('interpolatePathParams (via executeRequest)', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  it('replaces a single :param in the path', async () => {
    mock.onGet(`${BASE}/users/42`).reply(200, { id: 42 });

    const result = await executeRequest(
      baseConfig,
      { path: '/users/:id', method: 'GET' },
      { pathParams: { id: 42 } },
      { axiosInstance: axios },
    );

    expect(result).toEqual({ id: 42 });
  });

  it('replaces multiple :params in the path', async () => {
    mock.onGet(`${BASE}/users/7/posts/99`).reply(200, { userId: 7, postId: 99 });

    const result = await executeRequest(
      baseConfig,
      { path: '/users/:userId/posts/:postId', method: 'GET' },
      { pathParams: { userId: 7, postId: 99 } },
      { axiosInstance: axios },
    );

    expect(result).toEqual({ userId: 7, postId: 99 });
  });

  it('accepts string values for path params', async () => {
    mock.onGet(`${BASE}/orgs/acme`).reply(200, { name: 'acme' });

    const result = await executeRequest(
      baseConfig,
      { path: '/orgs/:slug', method: 'GET' },
      { pathParams: { slug: 'acme' } },
      { axiosInstance: axios },
    );

    expect(result).toEqual({ name: 'acme' });
  });

  it('passes the path through unchanged when no pathParams provided', async () => {
    mock.onGet(`${BASE}/health`).reply(200, { ok: true });

    const result = await executeRequest(
      baseConfig,
      { path: '/health', method: 'GET' },
      {},
      { axiosInstance: axios },
    );

    expect(result).toEqual({ ok: true });
  });

  it('throws when a referenced :param is missing from pathParams', async () => {
    await expect(
      executeRequest(
        baseConfig,
        { path: '/users/:id', method: 'GET' },
        { pathParams: {} },
        { axiosInstance: axios },
      ),
    ).rejects.toThrow('":id"');
  });

  it('throws with a descriptive message mentioning the path and param name', async () => {
    await expect(
      executeRequest(
        baseConfig,
        { path: '/users/:userId/posts/:postId', method: 'GET' },
        { pathParams: { userId: 1 } },
        { axiosInstance: axios },
      ),
    ).rejects.toThrow('":postId"');
  });
});
