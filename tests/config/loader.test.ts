import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../../src/config/loader.js';

describe('loadConfig', () => {
  const tmp = tmpdir();

  it('loads a valid JSON file', () => {
    const file = join(tmp, 'fraft-test.json');
    const data = {
      baseUrl: 'https://api.example.com',
      requests: {
        getUsers: { path: '/users' },
      },
    };
    writeFileSync(file, JSON.stringify(data));
    const config = loadConfig(file);
    expect(config.baseUrl).toBe('https://api.example.com');
    expect(config.requests.getUsers.path).toBe('/users');
    unlinkSync(file);
  });

  it('loads a valid YAML file', () => {
    const file = join(tmp, 'fraft-test.yaml');
    writeFileSync(file, `
baseUrl: https://api.example.com
requests:
  getItems:
    path: /items
    method: GET
`);
    const config = loadConfig(file);
    expect(config.baseUrl).toBe('https://api.example.com');
    expect(config.requests.getItems.method).toBe('GET');
    unlinkSync(file);
  });

  it('accepts an inline object', () => {
    const config = loadConfig({
      baseUrl: 'https://api.example.com',
      requests: { ping: { path: '/ping' } },
    });
    expect(config.requests.ping.path).toBe('/ping');
  });

  it('interpolates ${env.VAR} placeholders', () => {
    process.env.TEST_KEY = 'secret123';
    const config = loadConfig({
      baseUrl: 'https://api.example.com',
      auth: { type: 'apiKey', in: 'header', name: 'x-api-key', value: '${env.TEST_KEY}' },
      requests: { ping: { path: '/ping' } },
    });
    expect(config.auth?.value).toBe('secret123');
    delete process.env.TEST_KEY;
  });

  it('throws when an interpolated env var is missing', () => {
    delete process.env.MISSING_VAR;
    expect(() =>
      loadConfig({
        baseUrl: '${env.MISSING_VAR}',
        requests: { ping: { path: '/ping' } },
      }),
    ).toThrow('MISSING_VAR');
  });

  it('throws on invalid config (bad baseUrl)', () => {
    expect(() =>
      loadConfig({ baseUrl: 'not-a-url', requests: { ping: { path: '/ping' } } }),
    ).toThrow('invalid config');
  });

  it('throws on unsupported file extension', () => {
    const file = join(tmp, 'config.toml');
    writeFileSync(file, 'baseUrl = "https://example.com"');
    expect(() => loadConfig(file)).toThrow('unsupported config file extension');
    unlinkSync(file);
  });

  it('defaults method to GET', () => {
    const config = loadConfig({
      baseUrl: 'https://api.example.com',
      requests: { ping: { path: '/ping' } },
    });
    expect(config.requests.ping.method).toBe('GET');
  });
});
