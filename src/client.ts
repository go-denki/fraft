import type { AxiosInstance } from 'axios';
import { loadConfig } from './config/loader.js';
import { MiddlewareRegistry } from './middleware/registry.js';
import { executeRequest } from './request/executor.js';
import { runPipeline } from './transforms/pipeline.js';
import type { FraftConfig, MiddlewareFn, RunOverrides } from './types.js';

export interface FraftClientOptions {
  /**
   * Path to a JSON/YAML config file, or an already-parsed config object.
   */
  config: string | Record<string, unknown>;
  /**
   * Optionally provide your own axios instance (useful for testing or custom
   * interceptors).
   */
  axiosInstance?: AxiosInstance;
}

export class FraftClient {
  private readonly registry = new MiddlewareRegistry();
  private readonly options: FraftClientOptions;
  /** Lazily loaded & cached config */
  private _config: FraftConfig | undefined;

  constructor(options: FraftClientOptions) {
    this.options = options;
  }

  /**
   * Register a named middleware function that can be referenced in the config
   * via `{ middleware: "<name>" }` transform steps.
   */
  use(name: string, fn: MiddlewareFn): this {
    this.registry.register(name, fn);
    return this;
  }

  /**
   * Load (and cache) the resolved config. Exposed so callers can inspect it.
   */
  getConfig(): FraftConfig {
    if (!this._config) {
      this._config = loadConfig(this.options.config);
    }
    return this._config;
  }

  /**
   * Execute a single named request and run its transform pipeline.
   * @param requestName - Key under `requests` in the config
   * @param overrides   - Optional per-call overrides for params, body, headers
   */
  async run(requestName: string, overrides: RunOverrides = {}): Promise<unknown> {
    const config = this.getConfig();
    const def = config.requests[requestName];

    if (!def) {
      const available = Object.keys(config.requests).join(', ');
      throw new Error(
        `fraft: request "${requestName}" not found in config. Available: ${available}`,
      );
    }

    const rawData = await executeRequest(config, def, overrides, {
      axiosInstance: this.options.axiosInstance,
    });

    if (!def.transform || def.transform.length === 0) {
      return rawData;
    }

    return runPipeline(rawData, def.transform, this.registry, {
      requestName,
      config,
      def,
    });
  }

  /**
   * Execute all requests defined in the config sequentially and return a map
   * of `requestName → transformed result`.
   */
  async runAll(overrides: Record<string, RunOverrides> = {}): Promise<Record<string, unknown>> {
    const config = this.getConfig();
    const results: Record<string, unknown> = {};

    for (const name of Object.keys(config.requests)) {
      results[name] = await this.run(name, overrides[name]);
    }

    return results;
  }
}
