# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **Claude Code plugin marketplace** (`venvia-skills`) publishing Roy Chuang's public skills.
It is a *content* repo — there is no build, test, lint, or CI step and no `package.json`.
The deliverables are skill definitions and the helper scripts they ship. Installed via:

```
/plugin marketplace add venvia/skills
/plugin install <group>@venvia-skills     # venvia-ui / venvia-js / venvia-dev / venvia-devops
```

## Public vs. private: relationship to royfw/skills

This repo is **public**; the sibling repo `royfw/skills` is **private**. Public skills live
here, private/personal skills live there. Moving a skill's visibility is a **move**, not a
copy: it is relocated once and deleted from the other repo. Each skill has exactly one home.
Before moving a skill here, make sure it names no private projects, hosts, paths or repos —
everything in this repo is world-readable.

## Structure & contract

**Plugins are install groups, not single skills.** A plugin is the unit Claude Code installs,
and its name becomes the skill prefix (`<plugin>:<skill>`). Skills are grouped by *where they
are needed together*, so an environment can install only the groups it uses:

| Plugin | Holds |
|---|---|
| `venvia-ui` | React back-office UI design guidance |
| `venvia-js` | JavaScript/TypeScript ecosystem tools (@rfjs, start-ts-by, npm releases) |
| `venvia-dev` | language-agnostic dev tools (proposal visuals, git persona sheets) |
| `venvia-devops` | CI/CD bridging between GitHub and GitLab |

A new skill joins the group whose environments always need it alongside the others; create a
new `venvia-<topic>` group only when no existing group fits that test.

The layout is dictated by Claude Code's plugin spec — adding a plugin means creating these
exact files, not just any folder:

```
.claude-plugin/marketplace.json          # marketplace manifest; lists every plugin + its source path
plugins/<plugin>/.claude-plugin/plugin.json   # per-plugin manifest (name, description, author)
plugins/<plugin>/LICENSE                      # verbatim copy of the root LICENSE
plugins/<plugin>/skills/<skill>/SKILL.md      # the skill itself (frontmatter + instructions)
plugins/<plugin>/skills/<skill>/scripts/      # executable helpers the skill invokes
plugins/<plugin>/skills/<skill>/references/   # docs the skill tells Claude to read (rubrics, schemas)
```

Things that must stay in sync or the marketplace breaks or shows inconsistent text:

- **Per plugin:** `marketplace.json`'s `plugins[].name`/`source`/`description` match the
  plugin's `plugin.json` `name`/`description`, and `source` is `./plugins/<name>`.
- **Per skill:** the `SKILL.md` `name` equals its directory name; it has a single-line
  `metadata.summary`; and the root `README.md` table has a row
  `| <plugin> | <skill> | <summary> |` with that summary verbatim.
- Every directory under `plugins/` is registered in `marketplace.json`.

Run `bash bin/check-marketplace-sync.sh` after adding, moving, or editing any skill or plugin —
it verifies all of this automatically instead of relying on eyeballing copies of the same text.
`metadata.summary` must be a single-line string; folded YAML (`summary: >-`) fails the check.

## How a skill is authored here

A `SKILL.md` is a prompt, not code. The `description` frontmatter is a *trigger spec* — it
lists the phrases ("analyze my commits", "技能點數") and explicit **"Do NOT use for…"** cases
that decide whether Claude loads the skill. Heavy domain content (scoring rubrics, config
schemas) lives in `references/` and is pulled in on demand via "REQUIRED BACKGROUND: read
`references/…`" lines, keeping the always-loaded SKILL.md lean. Determinism that is
error-prone for an LLM (geometry, git log parsing) is pushed into `scripts/`; judgment stays
in the prompt.

## git-persona-sheet

Pipeline: `scripts/collect-commits.sh <repo> [author]` dumps git signals (type distribution,
hot dirs, full subjects) → Claude scores 0–10 against `references/archetypes.md` → writes a
config JSON (`references/config.schema.md`) → `node scripts/render-sheet.js <config.json>
<out.html>` renders it.

**Hard constraint on `render-sheet.js`:** output must be **JS-free inline SVG** with
interactivity via CSS `:hover` + `<title>` only. A `<canvas>`+JavaScript chart renders blank
in VS Code's HTML preview, which is a primary viewing target. Do not introduce client-side JS
into the generated sheet. Text fields in the config (`title`, `note`, `caveat`, …) are
injected **verbatim as HTML** — that is intentional (lets the author color/`<code>` words),
so treat config as trusted input.

Verify a script change by running it end-to-end (`collect-commits.sh` on any local repo, then
`render-sheet.js` on `references/config.example.json`) and opening the HTML — there is no test
suite to lean on.
