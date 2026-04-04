# Custom Middleware

Middleware lets you run arbitrary JavaScript or TypeScript logic as a named transform step. It is the escape hatch for transformations that go beyond what the built-in steps can do.

---

## Registering middleware

Use `client.use(name, fn)` to register a named function before calling `run()`:

```ts
import { FraftClient } from '@go-denki/fraft';

const client = new FraftClient({ config: 'api.yaml' });

client.use('addTimestamp', (data) => {
  return { ...(data as object), fetchedAt: new Date().toISOString() };
});
```

`client.use()` returns `this`, so calls can be chained:

```ts
client
  .use('normalize', normalizeFn)
  .use('enrich', enrichFn);
```

---

## Using middleware in config

Reference the registered name in a `transform` array:

```yaml
requests:
  posts:
    path: /posts
    transform:
      - pick: [id, title, body]
      - middleware: enrichPosts
```

If a config references a middleware name that was never registered, fraft throws at execution time (not at startup).

---

## Middleware function signature

```ts
type MiddlewareFn = (
  data: unknown,
  context: RequestContext
) => unknown | Promise<unknown>;
```

The function receives the current pipeline data and a `context` object:

| Field | Type | Description |
|-------|------|-------------|
| `requestName` | `string` | The key of the current request. |
| `config` | `FraftConfig` | The full parsed config. |
| `def` | `RequestDef` | The current request definition. |

Return the transformed data (or a `Promise` of it). Returning `undefined` sets the pipeline value to `undefined`.

---

## Examples

### Add computed fields

```ts
client.use('enrichPosts', async (data) => {
  const posts = data as Array<{ id: number; title: string; body: string }>;
  return posts.map(post => ({
    ...post,
    url: `https://example.com/posts/${post.id}`,
    wordCount: post.body.split(' ').length,
  }));
});
```

### Bearer token injection (as a request-body middleware)

```ts
client.use('injectAuth', (data, context) => {
  // Not a data transform — attach a header by mutating the def
  // Or use this to enrich/shape the data post-response
  return data;
});
```

### Using context to branch on request name

```ts
client.use('formatDates', (data, context) => {
  const rows = data as Record<string, unknown>[];
  return rows.map(row => ({
    ...row,
    createdAt: new Date(row.createdAt as string).toLocaleDateString(),
  }));
});
```

### Async middleware (e.g., lookup enrichment)

```ts
client.use('enrichWithProfiles', async (data) => {
  const users = data as Array<{ id: number }>;
  const enriched = await Promise.all(
    users.map(async (user) => {
      const profile = await fetchProfile(user.id);
      return { ...user, profile };
    })
  );
  return enriched;
});
```

---

## Limitations

- Middleware is registered at runtime; there is no compile-time check that a referenced name exists.
- Middleware cannot be unregistered or updated after registration.
- Calling `client.use()` with an already-registered name throws.
- There is no global middleware that runs on every request automatically.
