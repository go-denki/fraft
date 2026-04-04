---
layout: home

hero:
  name: fraft
  text: Declarative HTTP for Node.js
  tagline: Define requests and data transforms in YAML or JSON. Execute them with a single method call.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /reference/api
    - theme: alt
      text: View on GitHub
      link: https://github.com/go-denki/fraft

features:
  - icon: 📄
    title: Config-driven
    details: Define every HTTP request, header, auth, and transform step in a YAML or JSON file — no boilerplate code required.
  - icon: 🔄
    title: Transform pipeline
    details: Chain pick, rename, filter, coerce, and custom middleware steps to shape your API responses exactly as needed.
  - icon: 🔑
    title: Environment variable interpolation
    details: Reference secrets and dynamic values with ${env.VAR} syntax. Variables are resolved at load time from process.env.
  - icon: 🧩
    title: Custom middleware
    details: Register arbitrary async functions as named transform steps for any transformation that goes beyond the built-ins.
  - icon: ⚡
    title: axios-powered
    details: Built on top of axios with full passthrough of AxiosRequestConfig for timeouts, custom agents, and more.
  - icon: 🦺
    title: Fully typed
    details: Written in TypeScript with strict types and Zod-validated config schemas. All types are exported from the package root.
---

## Quick Look

```yaml
# api.yaml
version: 1
baseUrl: https://jsonplaceholder.typicode.com

requests:
  completedTodos:
    path: /todos
    transform:
      - filter: { field: completed, op: eq, value: true }
      - pick: [id, title]
```

```js
import { FraftClient } from '@go-denki/fraft';

const client = new FraftClient({ config: 'api.yaml' });
const todos = await client.run('completedTodos');
// [ { id: 1, title: '...' }, ... ]
```
