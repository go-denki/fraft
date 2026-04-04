# fraft — Copilot Instructions

`@go-denki/fraft` is a declarative, config-driven HTTP client for Node.js. Consumers define requests and transform pipelines in JSON/YAML; the library executes them via axios and pipes responses through a transform chain.

## Build & Test

```bash
npm run build       # tsup → dist/ (ESM + CJS + .d.ts)
npm run typecheck   # tsc --noEmit (strict)
npm test            # vitest run
npm run test:watch  # interactive watch
```

Always run `typecheck` and `test` after changes. The build output in `dist/` is generated — never edit it directly.

## Architecture

```
src/
  client.ts           # FraftClient — public API (use/getConfig/run/runAll)
  types.ts            # All TypeScript interfaces (single source of truth)
  index.ts            # Public re-exports only
  config/
    schema.ts         # Zod schemas — must stay in sync with types.ts
    loader.ts         # loadConfig(): parses JSON/YAML, interpolates ${env.VAR}, validates
  request/
    executor.ts       # executeRequest(): merges headers/params/auth, calls axios
    auth.ts           # applyAuth(): mutates AxiosRequestConfig
  transforms/
    pipeline.ts       # runPipeline(): dispatches steps in order
    pick/rename/coerce/filter.ts   # Pure, stateless transform functions
  middleware/
    registry.ts       # MiddlewareRegistry: named async functions, registered at runtime
```

**Data flow:** `loadConfig()` → `executeRequest()` → `runPipeline()` → caller.

## Key Conventions

- **Types and Zod schemas must stay in sync.** `src/types.ts` defines the TypeScript interfaces; `src/config/schema.ts` mirrors them as Zod schemas. Update both when adding or changing config shapes.
- **`${env.VAR}` interpolation** happens inside `loadConfig()` before Zod validation. If a variable is missing, it throws at startup.
- **Transforms are pure and sequential.** Each transform step receives the output of the previous one. `filter` only works on arrays — applying it to an object throws.
- **Middleware is registered at runtime.** If a config references `{ middleware: "foo" }` but `client.use("foo", fn)` was never called, execution throws. There is no compile-time check.
- **All imports use `.js` extensions** (ESM strict mode, `"type": "module"`). This includes imports within `src/`.
- **axios is a peer dependency** (`^1.6.0 || ^2.0.0`). Do not import axios types that are not available across that range.

## Testing

Tests mirror the source structure under `tests/`. Integration tests use `axios-mock-adapter` to mock HTTP — avoid real network calls in tests.

```ts
// Typical pattern
const mock = new MockAdapter(axios);
mock.onGet(`${BASE}/users`).reply(200, mockData);

const client = new FraftClient({ config: inlineConfig, axiosInstance: axios });
const result = await client.run('users');
expect(result).toEqual(...);
```

Vitest globals (`describe`, `it`, `expect`) are enabled — no imports needed.

## Adding a New Transform Step

1. Create `src/transforms/<name>.ts` exporting `apply<Name>(data, step)`.
2. Add the corresponding `<Name>Step` interface to `src/types.ts`.
3. Add the matching Zod schema entry to `src/config/schema.ts`.
4. Export the type from `src/index.ts`.
5. Add the dispatch branch to `src/transforms/pipeline.ts`.
6. Add tests in `tests/transforms/`.

## Auth

Only `apiKey` auth is currently built-in (header or query param). For OAuth or bearer tokens, use a middleware step that injects headers manually.
