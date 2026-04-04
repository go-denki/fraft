# FraftClient API

```ts
import { FraftClient } from '@go-denki/fraft';
```

---

## Constructor

```ts
new FraftClient(options: FraftClientOptions)
```

| Option | Type | Description |
|--------|------|-------------|
| `config` | `string \| Record<string, unknown>` | Path to a JSON/YAML config file, or a pre-parsed config object. |
| `axiosInstance` | `AxiosInstance` | Optional custom axios instance — useful for testing with mock adapters or adding interceptors. |

**From a file:**

```ts
const client = new FraftClient({ config: 'api.yaml' });
```

**From an inline object:**

```ts
const client = new FraftClient({
  config: {
    version: 1,
    baseUrl: 'https://api.example.com',
    requests: { users: { path: '/users' } },
  },
});
```

**With a custom axios instance:**

```ts
import axios from 'axios';
const instance = axios.create({ timeout: 5000 });
const client = new FraftClient({ config: 'api.yaml', axiosInstance: instance });
```

---

## `client.run(requestName, overrides?)`

Executes a single named request and returns the transformed response.

```ts
run(requestName: string, overrides?: RunOverrides): Promise<unknown>
```

```ts
const data = await client.run('users');
```

### Overrides

Pass `overrides` to merge additional params, headers, or body at call time without modifying the config:

```ts
const data = await client.run('users', {
  params: { limit: 5, page: 2 },
  headers: { 'X-Trace-Id': 'abc-123' },
});
```

| Field | Type | Description |
|-------|------|-------------|
| `params` | `Record<string, unknown>` | Merged over config-defined params (shallow merge). |
| `body` | `unknown` | Replaces the config-defined request body. |
| `headers` | `Record<string, string>` | Merged over config-defined and global headers (shallow merge). |

**Returns:** `Promise<unknown>` — the raw or transformed response data.

**Throws** if:
- `requestName` is not defined in the config
- A referenced middleware name was never registered
- The HTTP request fails
- A transform step throws

---

## `client.runAll(overrides?)`

Executes **all** requests defined in the config sequentially and returns a map of `requestName → result`.

```ts
runAll(overrides?: Record<string, RunOverrides>): Promise<Record<string, unknown>>
```

```ts
const results = await client.runAll();
// { users: [...], posts: [...], comments: [...] }
```

**With per-request overrides:**

```ts
const results = await client.runAll({
  users: { params: { limit: 10 } },
  posts: { params: { userId: 1 } },
});
```

**Returns:** `Promise<Record<string, unknown>>` — keys match the request names in the config.

**Throws** on the first failing request. There is no partial-success mode — if one request fails, execution stops and the error propagates.

---

## `client.use(name, fn)`

Registers a named middleware function for use in `{ middleware: "<name>" }` transform steps.

```ts
use(name: string, fn: MiddlewareFn): this
```

```ts
client.use('normalize', (data) => {
  const rows = data as Record<string, unknown>[];
  return rows.map(row => ({ ...row, id: String(row.id) }));
});
```

**Returns:** `this` — supports chaining:

```ts
client
  .use('stepA', fnA)
  .use('stepB', fnB);
```

**Throws** if `name` is already registered.

---

## `client.getConfig()`

Returns the loaded and validated `FraftConfig` object. If the config was provided as a file path, it is parsed on the first call and then cached.

```ts
getConfig(): FraftConfig
```

```ts
const config = client.getConfig();
console.log(Object.keys(config.requests));
```
