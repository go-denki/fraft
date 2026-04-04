import { describe, it, expect } from 'vitest';
import { MiddlewareRegistry } from '../../src/middleware/registry.js';

describe('MiddlewareRegistry', () => {
  it('registers and retrieves a middleware', () => {
    const registry = new MiddlewareRegistry();
    const fn = (d: unknown) => d;
    registry.register('myFn', fn);
    expect(registry.get('myFn')).toBe(fn);
  });

  it('reports has() correctly', () => {
    const registry = new MiddlewareRegistry();
    registry.register('exists', (d) => d);
    expect(registry.has('exists')).toBe(true);
    expect(registry.has('missing')).toBe(false);
  });

  it('throws when registering a duplicate name', () => {
    const registry = new MiddlewareRegistry();
    registry.register('fn', (d) => d);
    expect(() => registry.register('fn', (d) => d)).toThrow('already registered');
  });

  it('throws when getting an unregistered name', () => {
    const registry = new MiddlewareRegistry();
    expect(() => registry.get('ghost')).toThrow('"ghost"');
  });
});
