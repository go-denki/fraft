# Config Format

Config files can be **YAML** (`.yaml` / `.yml`) or **JSON** (`.json`). You can also pass a plain JavaScript object directly to `FraftClient`.

---

## Top-level fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | `number` | No | Schema version. Currently must be `1` if provided. |
| `baseUrl` | `string` | **Yes** | Base URL prepended to all request paths. |
| `headers` | `Record<string, string>` | No | Global headers merged into every request. |
| `auth` | [`AuthConfig`](#auth) | No | Global auth applied to every request. |
| `requests` | `Record<string, RequestDef>` | **Yes** | Named request definitions. |

```yaml
version: 1
baseUrl: https://api.example.com
headers:
  Accept: application/json
  X-Client: my-app
auth:
  type: apiKey
  in: header
  name: x-api-key
  value: "${env.API_KEY}"
requests:
  users:
    path: /users
```

---

## Request definition

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

### POST with a body

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

### GET with query params

```yaml
requests:
  search:
    path: /search
    params:
      q: typescript
      limit: 10
```

### Advanced axios options

```yaml
requests:
  slowEndpoint:
    path: /report
    axiosConfig:
      timeout: 30000
      responseType: blob
```

---

## Auth

Currently only API key auth (`type: apiKey`) is built in. For Bearer tokens or OAuth, use a [middleware step](/guide/middleware) to inject headers manually.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"apiKey"` | Auth strategy. |
| `in` | `"header"` \| `"query"` | Where to inject the key. |
| `name` | `string` | Header name or query param key. |
| `value` | `string` | Key value. Supports `${env.VAR_NAME}` interpolation. |

**Inject as a header:**

```yaml
auth:
  type: apiKey
  in: header
  name: Authorization
  value: "Bearer ${env.ACCESS_TOKEN}"
```

**Inject as a query param:**

```yaml
auth:
  type: apiKey
  in: query
  name: api_key
  value: "${env.API_KEY}"
```

Auth defined at the top level applies to every request. Per-request auth is not currently supported — use [middleware](/guide/middleware) if you need per-request auth overrides.

---

## Environment variable interpolation

Any string value can embed environment variables using `${env.VAR_NAME}` syntax. See [Environment Variables](/guide/environment-variables) for details.
