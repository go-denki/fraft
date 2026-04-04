# TypeScript Types

All types are exported from the package root:

```ts
import type {
  FraftConfig,
  RequestDef,
  TransformStep,
  PickStep,
  RenameStep,
  CoerceStep,
  CoerceRule,
  FilterStep,
  MiddlewareStep,
  AuthConfig,
  ApiKeyAuth,
  HttpMethod,
  RunOverrides,
  RequestContext,
  MiddlewareFn,
  FraftClientOptions,
} from '@go-denki/fraft';
```

---

## `FraftConfig`

The root config object, as validated and returned by `client.getConfig()`.

```ts
interface FraftConfig {
  version?: number;
  baseUrl: string;
  headers?: Record<string, string>;
  auth?: AuthConfig;
  requests: Record<string, RequestDef>;
}
```

---

## `RequestDef`

A single named request definition.

```ts
interface RequestDef {
  path: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  body?: unknown;
  transform?: TransformStep[];
  axiosConfig?: Record<string, unknown>;
}
```

---

## `HttpMethod`

```ts
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
```

---

## `AuthConfig`

Currently only `ApiKeyAuth` is supported.

```ts
type AuthConfig = ApiKeyAuth;

interface ApiKeyAuth {
  type: 'apiKey';
  in: 'header' | 'query';
  name: string;
  value: string;
}
```

---

## `TransformStep`

A discriminated union of all built-in step types:

```ts
type TransformStep =
  | PickStep
  | RenameStep
  | FilterStep
  | CoerceStep
  | MiddlewareStep;
```

### `PickStep`

```ts
interface PickStep {
  pick: string[];
}
```

### `RenameStep`

```ts
interface RenameStep {
  rename: Record<string, string>; // { newName: oldName }
}
```

### `FilterStep`

```ts
type FilterOp =
  | 'eq' | 'neq'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'startsWith' | 'endsWith';

interface FilterStep {
  filter: {
    field: string;
    op: FilterOp;
    value: unknown;
  };
}
```

### `CoerceStep`

```ts
type CoerceType = 'string' | 'number' | 'boolean';

interface CoerceRule {
  type?: CoerceType;
  expr?: string;   // e.g. "+5", "*100", "/1000"
  format?: string; // e.g. "%.2f"
}

interface CoerceStep {
  coerce: Record<string, CoerceType | CoerceRule>;
}
```

### `MiddlewareStep`

```ts
interface MiddlewareStep {
  middleware: string; // name registered via client.use()
}
```

---

## `MiddlewareFn`

```ts
type MiddlewareFn = (
  data: unknown,
  context: RequestContext
) => unknown | Promise<unknown>;
```

---

## `RequestContext`

Passed as the second argument to every middleware function.

```ts
interface RequestContext {
  requestName: string;
  config: FraftConfig;
  def: RequestDef;
}
```

---

## `RunOverrides`

```ts
interface RunOverrides {
  /** Path parameter values to interpolate into `:param` segments of the request path. */
  pathParams?: Record<string, string | number>;
  params?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}
```

---

## `FraftClientOptions`

```ts
interface FraftClientOptions {
  config: string | Record<string, unknown>;
  axiosInstance?: AxiosInstance;
}
```
