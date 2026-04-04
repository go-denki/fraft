# Roadmap

This page tracks planned improvements to fraft. Items are grouped by area and roughly ordered by impact.

---

## Auth

- [ ] Bearer / JWT auth type
- [ ] HTTP Basic auth support
- [ ] Auth token refresh and retry on 401
- [ ] Dynamic auth value resolution at request time

---

## Transforms

- [ ] `map` step — apply a transform to every element of an array
- [ ] `sort` step — sort arrays by field
- [ ] `flatten` / `unflatten` steps
- [ ] Conditional transforms — skip a step based on data shape
- [ ] Dot-notation support for nested field access (`user.profile.name`)
- [ ] Additional `filter` operators — regex, `in` (array membership), nested paths
- [ ] Additional `coerce` formats — dates, locales, string templates
- [ ] Error recovery in pipelines — fallbacks on step failure

---

## Config & Environment

- [ ] Default values for env vars — `${env.VAR:default}`
- [ ] Config composition / inheritance — extend a base config
- [ ] Environment-specific config files (`api.dev.yaml`, `api.prod.yaml`)
- [ ] Built-in `.env` file loading via dotenv

---

## Reliability

- [ ] Retry logic with configurable backoff (useful for 429 / 5xx)
- [ ] Per-request timeout override at the top level
- [ ] Partial failure mode for `runAll()` — continue on individual request errors
- [ ] Structured error types (distinguish auth errors, network errors, transform errors)

---

## HTTP & Requests

- [ ] Multipart / `form-data` request body support
- [ ] Request and response interceptor hooks
- [ ] Streaming response support
- [ ] Expand `RunOverrides` to allow overriding method, path, and transforms

---

## Middleware

- [ ] Global middleware — registered middleware runs on every request
- [ ] Middleware execution ordering / priority
- [ ] Ability to update or unregister middleware entries
- [ ] Built-in utility middleware (CSV parsing, pagination handling, etc.)

---

## Performance

- [ ] Parallel execution mode for `runAll()`
- [ ] Client-side response caching with TTL
- [ ] Request deduplication

---

## Testing & DX

- [ ] Test utilities exported for consumers to test their own configs
- [ ] Config validation CLI (`fraft validate api.yaml`)
- [ ] Config loader unit tests
