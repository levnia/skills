# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **Claude Code plugin marketplace** (`venvia-skills`) publishing Roy Chuang's public skills.
It is a *content* repo — there is no build, test, lint, or CI step and no `package.json`.
The deliverables are skill definitions and the helper scripts they ship. Installed via:

```
/plugin marketplace add venvia/skills
/plugin install <plugin-name>@venvia-skills
```

## Structure & contract

The layout is dictated by Claude Code's plugin spec — adding a plugin means creating these
exact files, not just any folder:

```
.claude-plugin/marketplace.json          # marketplace manifest; lists every plugin + its source path
plugins/<plugin>/.claude-plugin/plugin.json   # per-plugin manifest (name, description, author)
plugins/<plugin>/skills/<skill>/SKILL.md      # the skill itself (frontmatter + instructions)
plugins/<plugin>/skills/<skill>/scripts/      # executable helpers the skill invokes
plugins/<plugin>/skills/<skill>/references/   # docs the skill tells Claude to read (rubrics, schemas)
```

When you add or rename a plugin, three things must stay in sync or the marketplace breaks:
`marketplace.json`'s `plugins[].name`/`source`, the plugin's `plugin.json` `name`, and the
`description` (kept identical across `marketplace.json`, `plugin.json`, and `SKILL.md`'s
frontmatter + `metadata.summary`).

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
