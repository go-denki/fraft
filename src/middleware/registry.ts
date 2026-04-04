import type { MiddlewareFn } from '../types.js';

export class MiddlewareRegistry {
  private readonly store = new Map<string, MiddlewareFn>();

  register(name: string, fn: MiddlewareFn): void {
    if (this.store.has(name)) {
      throw new Error(`fraft: middleware "${name}" is already registered`);
    }
    this.store.set(name, fn);
  }

  get(name: string): MiddlewareFn {
    const fn = this.store.get(name);
    if (!fn) {
      throw new Error(
        `fraft: middleware "${name}" was referenced in config but has not been registered. ` +
          `Call client.use("${name}", fn) before running requests.`,
      );
    }
    return fn;
  }

  has(name: string): boolean {
    return this.store.has(name);
  }
}
