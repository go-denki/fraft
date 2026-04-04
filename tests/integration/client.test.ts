import { describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { FraftClient } from '../../src/client.js';

const BASE = 'https://api.example.com';

const mockUsers = [
  { user_id: 1, first: 'Alice', last: 'Smith', age: '30', score: 1.23456 },
  { user_id: 2, first: 'Bob', last: 'Jones', age: '25', score: 9.876 },
  { user_id: 3, first: 'Charlie', last: 'Brown', age: '30', score: 4.0 },
];

describe('FraftClient integration', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    mock.onGet(`${BASE}/users`).reply(200, mockUsers);
    mock.onPost(`${BASE}/users`).reply(201, { user_id: 99, first: 'New', last: 'User' });
  });

  it('runs a request with no transforms and returns raw data', async () => {
    const client = new FraftClient({
      config: { baseUrl: BASE, requests: { getUsers: { path: '/users' } } },
      axiosInstance: axios,
    });
    const result = await client.run('getUsers');
    expect(result).toEqual(mockUsers);
  });

  it('applies pick + rename transforms', async () => {
    const client = new FraftClient({
      config: {
        baseUrl: BASE,
        requests: {
          getUsers: {
            path: '/users',
            transform: [
              { pick: ['user_id', 'first', 'last'] },
              { rename: { user_id: 'id' } },
            ],
          },
        },
      },
      axiosInstance: axios,
    });

    const result = await client.run('getUsers') as Array<Record<string, unknown>>;
    expect(result[0]).toEqual({ id: 1, first: 'Alice', last: 'Smith' });
    expect(result[1]).toEqual({ id: 2, first: 'Bob', last: 'Jones' });
  });

  it('applies coerce transform', async () => {
    const client = new FraftClient({
      config: {
        baseUrl: BASE,
        requests: {
          getUsers: {
            path: '/users',
            transform: [{ coerce: { age: 'number' } }],
          },
        },
      },
      axiosInstance: axios,
    });

    const result = await client.run('getUsers') as Array<Record<string, unknown>>;
    expect(typeof result[0].age).toBe('number');
    expect(result[0].age).toBe(30);
  });

  it('applies filter transform', async () => {
    const client = new FraftClient({
      config: {
        baseUrl: BASE,
        requests: {
          getUsers: {
            path: '/users',
            transform: [
              { coerce: { age: 'number' } },
              { filter: { field: 'age', op: 'eq', value: 30 } },
            ],
          },
        },
      },
      axiosInstance: axios,
    });

    const result = await client.run('getUsers') as unknown[];
    expect(result).toHaveLength(2);
  });

  it('runs a named middleware transform', async () => {
    const client = new FraftClient({
      config: {
        baseUrl: BASE,
        requests: {
          getUsers: {
            path: '/users',
            transform: [{ middleware: 'addFullName' }],
          },
        },
      },
      axiosInstance: axios,
    });

    client.use('addFullName', (data) =>
      (data as Array<Record<string, unknown>>).map(u => ({
        ...u,
        fullName: `${u.first} ${u.last}`,
      })),
    );

    const result = await client.run('getUsers') as Array<Record<string, unknown>>;
    expect(result[0].fullName).toBe('Alice Smith');
  });

  it('passes per-call overrides (params, body)', async () => {
    mock.onGet(`${BASE}/users`).reply((config) => {
      expect(config.params?.page).toBe(2);
      return [200, []];
    });

    const client = new FraftClient({
      config: { baseUrl: BASE, requests: { getUsers: { path: '/users' } } },
      axiosInstance: axios,
    });

    await client.run('getUsers', { params: { page: 2 } });
  });

  it('injects api key into header', async () => {
    mock.onGet(`${BASE}/users`).reply((config) => {
      expect(config.headers?.['x-api-key']).toBe('secret');
      return [200, []];
    });

    const client = new FraftClient({
      config: {
        baseUrl: BASE,
        auth: { type: 'apiKey', in: 'header', name: 'x-api-key', value: 'secret' },
        requests: { getUsers: { path: '/users' } },
      },
      axiosInstance: axios,
    });

    await client.run('getUsers');
  });

  it('runAll executes all requests', async () => {
    const client = new FraftClient({
      config: {
        baseUrl: BASE,
        requests: {
          getUsers: { path: '/users' },
          createUser: { path: '/users', method: 'POST', body: { first: 'X' } },
        },
      },
      axiosInstance: axios,
    });

    const results = await client.runAll();
    expect(Object.keys(results)).toEqual(['getUsers', 'createUser']);
  });

  it('throws on unknown request name', async () => {
    const client = new FraftClient({
      config: { baseUrl: BASE, requests: { ping: { path: '/ping' } } },
      axiosInstance: axios,
    });
    await expect(client.run('ghost')).rejects.toThrow('"ghost"');
  });

  it('throws when middleware is referenced but not registered', async () => {
    mock.onGet(`${BASE}/ping`).reply(200, {});
    const client = new FraftClient({
      config: {
        baseUrl: BASE,
        requests: {
          ping: { path: '/ping', transform: [{ middleware: 'unregistered' }] },
        },
      },
      axiosInstance: axios,
    });
    await expect(client.run('ping')).rejects.toThrow('"unregistered"');
  });

  it('interpolates a single path param at call time', async () => {
    mock.onGet(`${BASE}/users/42`).reply(200, { user_id: 42, first: 'Alice' });

    const client = new FraftClient({
      config: {
        baseUrl: BASE,
        requests: { getUser: { path: '/users/:id' } },
      },
      axiosInstance: axios,
    });

    const result = await client.run('getUser', { pathParams: { id: 42 } });
    expect(result).toEqual({ user_id: 42, first: 'Alice' });
  });

  it('interpolates multiple path params at call time', async () => {
    mock.onGet(`${BASE}/users/3/posts/7`).reply(200, { postId: 7 });

    const client = new FraftClient({
      config: {
        baseUrl: BASE,
        requests: { getPost: { path: '/users/:userId/posts/:postId' } },
      },
      axiosInstance: axios,
    });

    const result = await client.run('getPost', { pathParams: { userId: 3, postId: 7 } });
    expect(result).toEqual({ postId: 7 });
  });

  it('throws when a path param referenced in path is missing from pathParams', async () => {
    const client = new FraftClient({
      config: {
        baseUrl: BASE,
        requests: { getUser: { path: '/users/:id' } },
      },
      axiosInstance: axios,
    });

    await expect(client.run('getUser', { pathParams: {} })).rejects.toThrow('":id"');
  });
});
