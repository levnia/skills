---
name: rfjs-templates
description: >-
  Use when selecting which rfjs template to use for a new TypeScript/JavaScript project
  scaffolded with start-ts-by. Triggers when the user asks what template to pick, which
  bundler to use, which framework or ORM to choose, or when deciding between simple and
  monorepo setup. Also triggers when the user mentions rfjs templates or asks for
  project structure recommendations. Do NOT use for: non-rfjs templates, non-TypeScript
  projects, or when the user has already specified an exact template.
metadata:
  summary: "Pick the right @rfjs start-ts-by template — bundler, framework, ORM, and simple vs. monorepo layout — for a new TypeScript/JavaScript project."
---

# rfjs-templates

Select the right rfjs template for a new project. Templates live in `royfw/rfjs` and are scaffolded via `npx start-ts-by`.

## Default Preferences

| Category | Default Template | start-ts-by `-t` Path |
|----------|-----------------|----------------------|
| App (no API) | `app-tsdown` | `royfw/rfjs#main/templates/apps/app-tsdown` |
| App (REST API) | `fastify-tsdown` | `royfw/rfjs#main/templates/apps/fastify-tsdown` |
| Library | `lib-tsdown` | `royfw/rfjs#main/templates/libs/lib-tsdown` |
| CLI tool | `bin-tsdown` | `royfw/rfjs#main/templates/bins/bin-tsdown` |
| Docs (static) | `docs-docsify` | `royfw/rfjs#main/templates/docs/docs-docsify` |
| Docs (full site) | `docs-vitepress` | `royfw/rfjs#main/templates/docs/docs-vitepress` |
| Monorepo | `turbo/stack/base` | `royfw/rfjs#main/templates/monorepo/turbo/stack/base` |

**Why tsdown by default:** Zero-config, Oxc-powered (fastest build), dual ESM/CJS output, isolated declarations. It's the newest and most opinionated choice — fewer decisions to make.

## Template Categories

### Apps

| Template | Bundler | Use When |
|----------|---------|----------|
| `app-esbuild` | esbuild | Need maximum compatibility with older tooling |
| `app-tsdown` | tsdown **(default)** | General-purpose app, no specific bundler requirement |
| `fastify-esbuild` | esbuild + Fastify | REST API with esbuild preference |
| `fastify-tsdown` | tsdown + Fastify **(default for API)** | REST API, microservice, web service |
| `fastify-gql-tsdown` | tsdown + Fastify + GraphQL | GraphQL API |
| `koa-esbuild` | esbuild + Koa | Lightweight middleware-based API |

### Libraries

| Template | Bundler | Use When |
|----------|---------|----------|
| `lib-esbuild` | esbuild | Need broad bundler compatibility |
| `lib-rolldown` | Rolldown | Want Rollup API with esbuild-level speed (Rust-based) |
| `lib-rollup` | Rollup | Need the Rollup plugin ecosystem |
| `lib-tsdown` | tsdown **(default)** | New library, no specific bundler requirement |

### ORM Wrappers

| Template | ORM | Use When |
|----------|-----|----------|
| `orm-drizzle` | Drizzle | TypeScript-first, SQL-like query builder, lightweight |
| `orm-kysely` | Kysely | Full SQL with TypeScript inference, no migrations built-in |
| `orm-prisma` | Prisma | Schema-first, auto-generated client, mature ecosystem |
| `orm-typeorm` | TypeORM | Active Record / Data Mapper patterns, decorator-heavy |

**No default yet.** Ask the user which ORM they prefer, or recommend based on: Drizzle for new TS projects, Prisma for teams familiar with schema-first, Kysely for SQL purists.

### BullMQ

Path prefix: `templates/bullmq/` (NOT `bull/`).

| Template | Type | `-t` Path | Use When |
|----------|------|-----------|----------|
| `bull-api` | Fastify API | `royfw/rfjs#main/templates/bullmq/bull-api` | Queue management API server |
| `lib-queue` | Library | `royfw/rfjs#main/templates/bullmq/lib-queue` | Queue worker library for consumption |

### Docs

| Template | Tool | Use When |
|----------|------|----------|
| `docs-docsify` | Docsify | Lightweight docs, no build step, Markdown-only |
| `docs-vitepress` | VitePress | Full docs site with Vue components, SEO, theming |

## Simple vs Monorepo Configuration

When a project will be part of a monorepo workspace, use `--monorepo` flag with `start-ts-by`. This removes:

- Lock files (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`)
- Workspace config (`.npmrc`)
- Git hooks (`.husky/`)
- CI config (`.github/`)
- `packageManager` field in package.json

**Why:** In a monorepo, the root manages locks, hooks, CI, and package manager. The package should be a clean, standalone unit that the workspace orchestrates.

**Decision rule:**
- Single package, standalone deploy → no `--monorepo`
- Package inside an existing workspace → `--monorepo`
- Building a monorepo from scratch → scaffold the monorepo template first, then add packages with `--monorepo`

## Selection Flow

```
User wants to build what?
├─ API server → fastify-tsdown (or fastify-gql-tsdown for GraphQL)
├─ CLI tool → bin-tsdown
├─ Library → lib-tsdown
├─ App (no API) → app-tsdown
├─ Docs → docs-docsify (simple) or docs-vitepress (full site)
├─ Monorepo → turbo/stack/base
├─ Queue system → bull-api (server) + lib-queue (worker)
└─ ORM wrapper → ask user preference (Drizzle/Prisma/Kysely/TypeORM)
```

## Usage

Once a template is selected, use the `start-ts-by` skill to scaffold:

```bash
npx start-ts-by <project-name> -t royfw/rfjs#main/templates/<category>/<template-name> --ni [flags]
```

For the full CLI reference, see the `start-ts-by` skill.
