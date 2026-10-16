---
name: rfjs-packages
description: >-
  Catalog of first-party @rfjs/* npm packages. Use when choosing a library in any
  project for: data filtering / JSONPath matching over in-memory data, building
  MongoDB queries from filter metadata, retry logic with delay, JWT sign/verify/decode,
  data type conversion (string/number/boolean/date, JSONB coercion), object
  flattening/manipulation, or PostgreSQL admin utilities (seed history, DB/schema
  creation). Also triggers when the user mentions @rfjs/* packages directly, or when
  scaffolded rfjs templates need build config factories (tsdown/vitest/lint-staged).
  Do NOT use for: needs with no matching @rfjs package, or when the user has already
  specified a different library for the job.
metadata:
  summary: "First-party @rfjs/* npm package catalog — choosing libraries for filtering, JWT, retries, type conversion, object manipulation, and Postgres utilities, plus the template build-config factories."
  category: development
---

# rfjs-packages

First-party `@rfjs/*` packages published to npm. **Before reaching for an external
package, check this catalog first** — if a need maps to a package below, prefer it.

Source of truth: `royfw/rfjs#main/packages/<name>/` — each package's
`README.md` (usage), `README.zh-TW.md` (繁中), and `src/index.ts` / `dist/index.d.ts`
(authoritative API). When in doubt, read those before writing code.

Install: `pnpm add @rfjs/<name>` (or `npm install @rfjs/<name>`).

## Quick Selection

| Need | Package |
|------|---------|
| Filter in-memory data against a filter-metadata tree (JSONPath wildcards) | `@rfjs/data-filter` |
| Build a MongoDB query document from the same filter-metadata shape | `@rfjs/mongo-query` |
| Convert loosely-typed values (string ↔ number/boolean/date, JSONB coercion) | `@rfjs/data-transform` |
| Sign / verify / decode JWTs with a result-object API | `@rfjs/jwt` |
| Retry an async/sync job with fixed delay | `@rfjs/retry` |
| Flatten/unflatten objects, dot-notation keys, flat-string output | `@rfjs/object-utils` |
| PostgreSQL admin: seed history, ensure DB/schema, connection-string parsing | `@rfjs/pg-toolkit` |
| Build config factories for rfjs templates (tsdown/vitest/lint-staged) | `@rfjs/tpl-toolkit` (scaffolding) |
| PostgreSQL JSONB `WHERE` builder | `@rfjs/jsonb-query` — **NOT PUBLISHED YET** |

The filter-metadata tree (`{ logic, filters: [...] }`) is a shared shape across
`data-filter`, `mongo-query`, and (future) `jsonb-query` — pick the package by
execution target: in-memory / MongoDB / PostgreSQL JSONB.

## Runtime Libraries

### @rfjs/data-filter

In-memory data filtering with JSONPath wildcard support, alias substitution, and
filter mapping.

- **Use when:** filtering/matching JS objects or arrays against a structured filter
  query (`logic` + `filters` tree); resolving paths with JSONPath wildcards
  (`users[*].name`); filter-then-map with `${field.path}` alias substitution.
- **Don't use when:** the filter runs in a database (use `mongo-query` for MongoDB),
  or a one-off `Array.prototype.filter` predicate is clearer.

```typescript
import { matchQuery } from '@rfjs/data-filter';

const filter = {
  logic: 'and',
  filters: [
    { field: 'name', dataType: 'string', operator: 'eq', value: 'Alice' },
    { field: 'age', dataType: 'numeric', operator: 'gte', value: 18 },
  ],
};

matchQuery({ name: 'Alice', age: 25 }, filter); // true
```

Also exports: `matchQueryArray`, `matchAndMap`, `resolvePath`, match classes
(`TextMatch`, `NumericMatch`, `BooleanMatch`, `DateMatch`).
Operators: `eq/neq/isnull/isnotnull`, text `contains/startswith/endswith/terms`,
numeric & date `gt/gte/lt/lte/range/terms`. Logic: `and/or/nor/not`.

### @rfjs/data-transform

Data type transformation utilities — string/number/boolean/date conversion and
PostgreSQL JSONB type coercion.

- **Use when:** coercing loosely-typed input (query params, CSV, form data) into
  typed values; preparing values for JSONB query contexts.
- **Don't use when:** you need schema validation with error reporting (use zod or
  similar) — this only converts.

```typescript
import { typeTransfer, toBoolean, toDateString } from '@rfjs/data-transform';

typeTransfer('42', 'number');       // 42
typeTransfer('2024-01-01', 'date'); // Date object
toBoolean('true');                  // true
toDateString('2024-01-15');         // '2024-01-15T00:00:00.000Z'
```

Also exports: `jsonbTransfer(value, type)` — 16 type variants
(`string/numeric/date/boolean` plus `object*` / `array*` / `arrayObject*` forms).
`typeTransfer` types: `'string' | 'number' | 'integer' | 'boolean' | 'date' | 'any'`.

### @rfjs/mongo-query

MongoDB query builder — generates MongoDB query documents from filter metadata.

- **Use when:** translating a filter-metadata tree (e.g. from an API request) into a
  MongoDB query document; composing `$and`/`$or`/`$nor` trees programmatically.
- **Don't use when:** targeting SQL/PostgreSQL (see `jsonb-query`, unreleased), or
  filtering in memory (use `data-filter`).

```typescript
import { toQuery, genFilterQuery } from '@rfjs/mongo-query';

toQuery('age', 'number', 'gte', 18);
// { age: { '$gte': 18 } }

genFilterQuery({
  logic: 'and',
  filters: [
    { field: 'name', condition: 'eq', dataType: 'string', value: 'test' },
    { logic: 'or', filters: [
      { field: 'age', condition: 'gt', dataType: 'number', value: 18 },
    ] },
  ],
});
// { '$and': [ { name: { '$eq': 'test' } }, { '$or': [ { age: { '$gt': 18 } } ] } ] }
```

Conditions: `eq/neq/nin/terms/term/gt/gte/lt/lte/range/regex`. Also exports query
classes (`EqQuery`, `RangeQuery`, `RegexQuery`, `LogicalQuery`, …). Note: field
entries use `condition:` here, not `operator:` as in `data-filter`.

### @rfjs/jwt

JWT sign, verify, and decode helper (wraps `jsonwebtoken`), with a discriminated
result object instead of thrown errors on verify.

- **Use when:** issuing and verifying tokens with a shared secret; you want
  `{ success, payload, errMsg }` results instead of try/catch.
- **Don't use when:** you need JWKS/OIDC discovery, asymmetric key rotation, or
  full OAuth flows — use a dedicated auth library.

```typescript
import { Jwt } from '@rfjs/jwt';

const jwt = Jwt.initial('my-secret-key', { expiresIn: 3600 });
const token = jwt.createToken({ userId: 1, role: 'admin' });

const result = jwt.verifyToken<{ userId: number }>(token);
if (result.success) {
  console.log(result.payload.userId);
} else {
  console.error(result.errMsg); // 'jwt expired', 'invalid signature', ...
}
```

Also exports: `decodeToken<T>(token)` — decode without verification.

### @rfjs/retry

Retry helper with configurable fixed delay and max attempts.

- **Use when:** retrying a flaky async/sync operation (network call, DB connect)
  with a simple fixed-interval policy.
- **Don't use when:** you need exponential backoff, jitter, or circuit breaking —
  this package only does fixed-period retries.

```typescript
import { retry, delay } from '@rfjs/retry';

const result = await retry(fetchData, 100, 5);
// signature: retry(job, periodMs = 100, maxRetryTimes = 5)

await delay(1000); // standalone sleep
```

Also exports: `RetryHelper` (`new RetryHelper().createRetry()` for a bound instance).

### @rfjs/object-utils

Object manipulation utilities — flatten, nest, stringify.

- **Use when:** flattening nested objects to dot-notation keys (config, logging,
  diffing), building nested objects from key arrays, or rendering objects as flat
  human-readable strings.
- **Don't use when:** you need deep merge/clone/pick — use lodash directly.

```typescript
import { flatten, keysToNested, toFlatString } from '@rfjs/object-utils';

flatten({ a: 1, b: { c: 10 } });        // { a: 1, 'b.c': 10 }
keysToNested(['a', 'b'], 10);           // { a: { b: 10 } }
toFlatString({ a: { b: 10 }, c: 'x' }); // 'a.b: 10, c: x'
```

Also exports: `toJSONString(obj, pretty?)`.

### @rfjs/pg-toolkit

Shared PostgreSQL utilities and management scripts, ORM-agnostic (Drizzle, Prisma,
Kysely, TypeORM). Peer deps: `pg`, `@types/pg`.

- **Use when:** CI/CD or bootstrap scripts need to ensure a database/schema exists,
  track seed execution history, or parse connection strings (incl. `schema` param
  and `search_path` merging).
- **Don't use when:** building queries (not a query builder) or as an ORM
  replacement.

Two entry points — root exports only connection-independent "pure" utils
(`getConnectionStringInfo`); admin functions live under `/admin`:

```typescript
import { ensureSeedHistoryTable, checkSeedExecuted, recordSeedExecution } from '@rfjs/pg-toolkit/admin';
import { Client } from 'pg';

const client = new Client(process.env.DATABASE_URL);
await client.connect();

await ensureSeedHistoryTable(client); // manages __seed_history table
if (!(await checkSeedExecuted(client, 'init_data'))) {
  // await runMySeed();
  await recordSeedExecution(client, 'init_data');
}
```

`/admin` also exports: `checkAndCreateDB`, `checkAndCreateSchema`.

## Scaffolding Only

### @rfjs/tpl-toolkit

Shared configuration factories and build helpers for rfjs project templates.
**Not a runtime library** — it belongs in `devDependencies` of template-based
projects, wired by the templates themselves (see the `rfjs-templates` skill).

- **Use when:** a project scaffolded from an rfjs template needs its
  tsdown/vitest/lint-staged config created or adjusted.
- **Don't use when:** picking a runtime dependency for app logic.

```typescript
// tsdown.config.ts
import { createTsdownConfig } from '@rfjs/tpl-toolkit';
export default createTsdownConfig('lib'); // 'app' | 'lib' | 'bin' | 'orm' | 'bullmq'

// vitest.config.mts
import { createVitestConfig } from '@rfjs/tpl-toolkit/vitest';
export default createVitestConfig();
```

Also exports: `defaultLintStagedConfig` / `defaultLintStagedConfigNoTest` (root),
`copyFilesPlugin` / `tsdownDevNodemonPlugin` (`/plugins`).

## Not Yet Published

### @rfjs/jsonb-query — held back, do NOT install

Parameterized PostgreSQL JSONB query builder (`buildJsonbQuery` → safe `WHERE`
fragment + `$1, $2` values; `legacy` and `jsonpath` dialects).

**Currently `private: true` and not on npm — planned for release after Phase 2.**
Until then, do not add it as a dependency or suggest installing it. For PostgreSQL
JSONB filtering today, write the SQL directly (parameterized) or use the ORM's
query builder.
