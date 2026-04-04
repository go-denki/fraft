# Examples

All examples are in the [`examples/`](https://github.com/go-denki/fraft/tree/main/examples) directory of the repository. They use the public [JSONPlaceholder](https://jsonplaceholder.typicode.com), [GitHub](https://api.github.com), and [Open-Meteo](https://open-meteo.com) APIs — no sign-up required.

---

## Basic usage

**`examples/basic.mjs`** — Run a YAML config from a file path and print the result.

```js
import { FraftClient } from '@go-denki/fraft';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new FraftClient({
  config: join(__dirname, 'github-repos.yaml'),
});

const repos = await client.run('octocat-repos');
console.log(JSON.stringify(repos, null, 2));
```

```bash
node examples/basic.mjs
```

---

## Inline config

**`examples/inline-config.mjs`** — Pass a config object directly instead of a file.

```js
import { FraftClient } from '@go-denki/fraft';

const client = new FraftClient({
  config: {
    version: 1,
    baseUrl: 'https://jsonplaceholder.typicode.com',
    requests: {
      post: { path: '/posts/1' },
    },
  },
});

const post = await client.run('post');
console.log(post);
```

---

## All built-in transforms

**`examples/transforms.mjs`** — Demonstrates `filter`, `pick`, `rename`, and `coerce` in a single file.

```js
import { FraftClient } from '@go-denki/fraft';

const client = new FraftClient({
  config: {
    version: 1,
    baseUrl: 'https://jsonplaceholder.typicode.com',
    requests: {
      activeTodos: {
        path: '/todos',
        transform: [
          { filter: { field: 'completed', op: 'eq', value: true } },
          { pick: ['id', 'title'] },
        ],
      },
      renamedUsers: {
        path: '/users',
        transform: [
          { pick: ['id', 'name', 'email', 'phone'] },
          { rename: { name: 'fullName', phone: 'phoneNumber' } },
        ],
      },
      posts: {
        path: '/posts',
        transform: [
          { pick: ['id', 'userId', 'title'] },
          { coerce: { userId: { type: 'number', expr: '*10' }, id: 'string' } },
        ],
      },
    },
  },
});

const todos = await client.run('activeTodos');
const users = await client.run('renamedUsers');
const posts = await client.run('posts');
```

```bash
node examples/transforms.mjs
```

---

## Custom middleware

**`examples/middleware.mjs`** — Uses a middleware step to reshape a nested API response.

The Open-Meteo hourly response looks like `{ hourly: { time: [...], temperature_2m: [...] } }`. The middleware flattens it into an array of objects, one per hour.

```js
import { FraftClient } from '@go-denki/fraft';

const client = new FraftClient({ config: 'examples/weather.yaml' });

client.use('flattenHourly', (data) => {
  const { hourly } = data;
  const { time, temperature_2m, precipitation_probability, windspeed_10m } = hourly;

  return time.map((t, i) => ({
    time: t,
    tempF: temperature_2m[i],
    precipChance: precipitation_probability[i],
    windMph: windspeed_10m[i],
  }));
});

const hourly = await client.run('nyc-hourly');
console.log(JSON.stringify(hourly, null, 2));
```

```bash
node examples/middleware.mjs
```

---

## GitHub repos (YAML)

**`examples/github-repos.yaml`** — Fetch public repos for a GitHub user, filtering out forks and picking key fields.

```yaml
version: 1
baseUrl: https://api.github.com
headers:
  Accept: application/vnd.github+json
  X-GitHub-Api-Version: "2022-11-28"

requests:
  octocat-repos:
    path: /users/octocat/repos
    params:
      sort: updated
      per_page: 30
    transform:
      - filter: { field: fork, op: eq, value: false }
      - pick: [id, name, description, html_url, stargazers_count, language, updated_at]

  octocat-starred:
    path: /users/octocat/starred
    params:
      per_page: 10
    transform:
      - pick: [full_name, description, html_url, stargazers_count]
```

---

## POST request (YAML)

**`examples/create-post.yaml`** — Send a `POST` request with a JSON body.

```yaml
version: 1
baseUrl: https://jsonplaceholder.typicode.com

requests:
  newPost:
    path: /posts
    method: POST
    headers:
      Content-Type: application/json
    body:
      title: Hello fraft
      body: This was created with a declarative config.
      userId: 1
```
