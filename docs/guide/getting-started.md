# Getting Started

## Installation

```bash
npm install @go-denki/fraft
```

`axios` is a peer dependency — install it alongside fraft if you haven't already:

```bash
npm install axios
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

## Inline config

You can skip the file entirely and pass a plain JavaScript object:

```js
import { FraftClient } from '@go-denki/fraft';

const client = new FraftClient({
  config: {
    version: 1,
    baseUrl: 'https://jsonplaceholder.typicode.com',
    requests: {
      posts: { path: '/posts' },
    },
  },
});

const posts = await client.run('posts');
```

---

## Running all requests at once

`runAll()` executes every request defined in the config and returns a map of name → result:

```js
const results = await client.runAll();
// { users: [...], posts: [...] }
```

---

## Next steps

- [Config Format](/guide/config-format) — full reference for all config fields
- [Transform Pipeline](/guide/transforms) — shape your response data with built-in steps
- [Custom Middleware](/guide/middleware) — plug in arbitrary JS logic as a transform step
- [API Reference](/reference/api) — `FraftClient` method signatures
