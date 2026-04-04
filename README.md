# fraft

Declarative API fetching for Node.js. Define HTTP requests and data transformations in a JSON or YAML config file, then execute them with a single method call.

```yaml
# api.yaml
version: 1
baseUrl: https://jsonplaceholder.typicode.com

requests:
  todos:
    path: /todos
    transform:
      - filter: { field: completed, op: eq, value: true }
      - pick: [id, title]
```

```js
import { FraftClient } from '@go-denki/fraft';

const client = new FraftClient({ config: 'api.yaml' });
const todos = await client.run('todos');
```

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Config Format](#config-format)
  - [Top-level fields](#top-level-fields)
  - [Request definition](#request-definition)
  - [Auth](#auth)
  - [Transform pipeline](#transform-pipeline)
- [API Reference](#api-reference)
  - [FraftClient](#fraftclient)
  - [Types](#types)
- [Environment Variable Interpolation](#environment-variable-interpolation)
- [Custom Middleware](#custom-middleware)
- [Examples](#examples)

---

## Installation

```bash
npm install @go-denki/fraft
```

---

## Quick Start

**1. Create a config file** (`api.yaml` or `api.json`):

```yaml
version: 1
baseUrl: https://api.example.com
headers:
  Accept: application/json
auth:
  type: apiKey
  in: header
  name: x-api-key
  value: "${env.API_KEY}"
requests:
  users:
    path: /users
    transform:
      - filter: { field: active, op: eq, value: true }
      - pick: [id, name, email]
```

**2. Run it**:

```js
import { FraftClient } from '@go-denki/fraft';

const client = new FraftClient({ config: 'api.yaml' });
const users = await client.run('users');
console.log(users);
```

---

## Config Format

Config files can be **YAML** (`.yaml` / `.yml`) or **JSON** (`.json`). You can also pass a plain JavaScript object directly to `FraftClient`.

### Top-level fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | `number` | No | Schema version. Currently must be `1` if provided. |
| `baseUrl` | `string` | **Yes** | Base URL prepended to all request paths. |
| `headers` | `Record<string, string>` | No | Global headers merged into every request. |
| `auth` | [`AuthConfig`](#auth) | No | Global auth applied to every request. |
| `requests` | `Record<string, RequestDef>` | **Yes** | Named request definitions. |

### Request definition

Each key under `requests` maps to a `RequestDef`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `path` | `string` | — | URL path appended to `baseUrl`. |
| `method` | `HttpMethod` | `"GET"` | HTTP method: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`. |
| `headers` | `Record<string, string>` | — | Per-request headers, merged over global headers. |
| `params` | `Record<string, unknown>` | — | Query string parameters. |
| `body` | `unknown` | — | Request body (serialized to JSON). |
| `transform` | `TransformStep[]` | — | Ordered list of transform steps applied to the response. |
| `axiosConfig` | `AxiosRequestConfig` | — | Advanced axios options (`timeout`, `responseType`, etc.). |

**Example — POST with a body:**

```yaml
requests:
  createUser:
    path: /users
    method: POST
    headers:
      Content-Type: application/json
    body:
      name: Alice
      role: admin
```

**Example — GET with query params:**

```yaml
requests:
  search:
    path: /search
    params:
      q: typescript
      limit: 10
```

### Auth

Currently supports API key auth (`type: apiKey`).

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"apiKey"` | Auth strategy. |
| `in` | `"header"` \| `"query"` | Where to inject the key. |
| `name` | `string` | Header name or query param key. |
| `value` | `string` | Key value. Supports `${env.VAR_NAME}` interpolation. |

```yaml
auth:
  type: apiKey
  in: header
  name: Authorization
  value: "Bearer ${env.ACCESS_TOKEN}"
```

### Transform pipeline

`transform` is an ordered array of steps. Each step is applied to the output of the previous one. Steps operate on the full response body (object or array).

---

#### `pick` — keep only selected fields

```yaml
transform:
  - pick: [id, name, email]
```

Applied to an **array**, picks fields from every element. Applied to an **object**, picks fields from that object.

---

#### `rename` — rename fields

```yaml
transform:
  - rename:
      userId: id
      userName: name
```

Maps `old_name → new_name`. Works on arrays and single objects.

---

#### `filter` — filter array items

```yaml
transform:
  - filter:
      field: status
      op: eq
      value: active
```

Only works on **arrays**. Supported operators:

| `op` | Description |
|------|-------------|
| `eq` | Strict equal (`===`) |
| `neq` | Not equal (`!==`) |
| `gt` | Greater than |
| `gte` | Greater than or equal |
| `lt` | Less than |
| `lte` | Less than or equal |
| `contains` | String contains substring |
| `startsWith` | String starts with value |
| `endsWith` | String ends with value |

---

#### `coerce` — type coercion and arithmetic

```yaml
transform:
  - coerce:
      price:
        type: number
        expr: "*100"
        format: "%.2f"
      active: boolean
      code: string
```

Each key maps to a field name. The value can be:

- A shorthand string: `"string"`, `"number"`, or `"boolean"`
- A rule object:

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"string"` \| `"number"` \| `"boolean"` | Cast the value to this type. |
| `expr` | `string` | Arithmetic applied after type cast: `"+5"`, `"-1"`, `"*100"`, `"/1000"`. |
| `format` | `string` | sprintf-style format applied last. Only `"%.Nf"` (fixed decimal) is supported. |

---

#### `middleware` — custom transform function

```yaml
transform:
  - middleware: myTransform
```

Calls a named function registered via `client.use()`. See [Custom Middleware](#custom-middleware).

---

## API Reference

### `FraftClient`

```ts
import { FraftClient } from '@go-denki/fraft';
```

#### `new FraftClient(options)`

| Option | Type | Description |
|--------|------|-------------|
| `config` | `string \| Record<string, unknown>` | Path to a JSON/YAML file, or a pre-parsed config object. |
| `axiosInstance` | `AxiosInstance` | Optional custom axios instance (useful for testing or interceptors). |

#### `client.run(requestName, overrides?)`

Executes a single named request and returns the transformed response.

```ts
const data = await client.run('users');

// With runtime overrides:
const data = await client.run('users', {
  params: { limit: 5 },
  headers: { 'X-Trace-Id': '123' },
});
```

**Overrides** (`RunOverrides`):

| Field | Type | Description |
|-------|------|-------------|
| `params` | `Record<string, unknown>` | Merged over config-defined params. |
| `body` | `unknown` | Replaces the config-defined body. |
| `headers` | `Record<string, string>` | Merged over config-defined headers. |

Returns `Promise<unknown>` — the raw or transformed response data.

#### `client.runAll(overrides?)`

Executes **all** requests defined in the config sequentially.

```ts
const results = await client.runAll();
// { users: [...], posts: [...] }

// With per-request overrides:
const results = await client.runAll({
  users: { params: { limit: 10 } },
});
```

Returns `Promise<Record<string, unknown>>` — a map of `requestName → result`.

#### `client.use(name, fn)`

Registers a named middleware function for use in `{ middleware: "<name>" }` transform steps.

```ts
client.use('addTimestamp', (data) => {
  return { ...(data as object), fetchedAt: new Date().toISOString() };
});
```

The middleware function receives `(data: unknown, context: RequestContext)` and may return a value or a `Promise`. Returns `this` for chaining.

#### `client.getConfig()`

Returns the loaded and validated `FraftConfig` object (loads from file on first call, then cached).

---

### Types

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

## Environment Variable Interpolation

Any string value in the config can reference an environment variable using the syntax `${env.VAR_NAME}`. The variable is resolved at load time from `process.env`.

```yaml
auth:
  type: apiKey
  in: header
  name: x-api-key
  value: "${env.MY_API_KEY}"

baseUrl: "${env.API_BASE_URL}"
```

If the referenced variable is not set, `fraft` throws an error at startup.

---

## Custom Middleware

Middleware lets you run arbitrary JavaScript/TypeScript logic as a transform step.

```yaml
# api.yaml
requests:
  posts:
    path: /posts
    transform:
      - pick: [id, title, body]
      - middleware: enrichPosts
```

```ts
import { FraftClient } from '@go-denki/fraft';

const client = new FraftClient({ config: 'api.yaml' });

client.use('enrichPosts', async (data, context) => {
  const posts = data as Array<{ id: number; title: string; body: string }>;
  return posts.map(post => ({
    ...post,
    url: `https://example.com/posts/${post.id}`,
    wordCount: post.body.split(' ').length,
  }));
});

const posts = await client.run('posts');
```

The `context` argument provides:

| Field | Type | Description |
|-------|------|-------------|
| `requestName` | `string` | The key of the current request. |
| `config` | `FraftConfig` | The full parsed config. |
| `def` | `RequestDef` | The current request definition. |

---

## Examples

See the [`examples/`](./examples) directory for ready-to-run examples:

| Example | Description |
|---------|-------------|
| [`examples/github-repos.yaml`](./examples/github-repos.yaml) | Fetch public GitHub repos with filtering and field picking |
| [`examples/weather.yaml`](./examples/weather.yaml) | Weather API with API key auth via env var |
| [`examples/create-post.yaml`](./examples/create-post.yaml) | POST request with a JSON body |
| [`examples/basic.mjs`](./examples/basic.mjs) | Simple programmatic usage (ESM) |
| [`examples/transforms.mjs`](./examples/transforms.mjs) | Demonstrates all built-in transform steps |
| [`examples/middleware.mjs`](./examples/middleware.mjs) | Custom middleware transform |
| [`examples/inline-config.mjs`](./examples/inline-config.mjs) | Passing a config object instead of a file path |

---

## License

MIT
