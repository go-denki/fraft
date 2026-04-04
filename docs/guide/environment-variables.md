# Environment Variables

Any **string value** in a config file can reference a `process.env` variable using the syntax:

```
${env.VAR_NAME}
```

Interpolation happens inside `loadConfig()`, before Zod validation. This means environment variables can be used in any string field — base URL, headers, auth values, request params, and request body strings.

---

## Usage

```yaml
baseUrl: "${env.API_BASE_URL}"

auth:
  type: apiKey
  in: header
  name: x-api-key
  value: "${env.MY_API_KEY}"

headers:
  X-Tenant: "${env.TENANT_ID}"

requests:
  users:
    path: /users
    params:
      region: "${env.REGION}"
```

---

## Behavior

- Variables are resolved from `process.env` at **load time**.
- If the variable is **not set**, fraft throws an error immediately at startup. There is no default or fallback syntax.
- Interpolation only applies to **string values**. A numeric field like `limit: ${env.LIMIT}` will fail Zod validation — use a string field and coerce it if needed.

---

## Loading `.env` files

fraft does not load `.env` files automatically. You should load them before constructing the client:

```js
import 'dotenv/config'; // or: import dotenv from 'dotenv'; dotenv.config();
import { FraftClient } from '@go-denki/fraft';

const client = new FraftClient({ config: 'api.yaml' });
```

---

## Example

Given this `.env`:

```
API_BASE_URL=https://api.example.com
API_KEY=secret-key-123
```

And this config:

```yaml
version: 1
baseUrl: "${env.API_BASE_URL}"
auth:
  type: apiKey
  in: header
  name: x-api-key
  value: "${env.API_KEY}"
requests:
  users:
    path: /users
```

fraft resolves the config at startup to:

```json
{
  "version": 1,
  "baseUrl": "https://api.example.com",
  "auth": {
    "type": "apiKey",
    "in": "header",
    "name": "x-api-key",
    "value": "secret-key-123"
  },
  "requests": {
    "users": { "path": "/users" }
  }
}
```
