---
name: git-persona-sheet
description: Use when the user wants to profile a developer from git commit history as the five Cherny archetypes — Prototyper / Builder / Sweeper / Grower / Maintainer — score them 0–10, or visualize one or more repos as a radar "persona / build sheet". Triggers include "analyze my commits", "what kind of developer am I", "skill points / 技能點數", "原型 / archetype", "radar chart of my git history", or comparing how the same author looks across multiple repos. Do NOT use for code review, contribution leaderboards / commit-count stats, or non-git analysis.
license: MIT
metadata:
  version: "0.1.0"
  publish: [public]
  summary: "Profile a developer from git commit history against the five Cherny archetypes (Prototyper / Builder / Sweeper / Grower / Maintainer), score 0-10, and render an interactive inline-SVG radar build sheet across one or more repos."
  category: development
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
argument-hint: repos to analyze (e.g. "this repo", "compare ~/a and ~/b")
---

# Git Persona Sheet

## Overview

Profile a developer by reading their **git commit history** and scoring it against Boris
Cherny's five archetypes, then render a self-contained HTML radar "build sheet". One repo
or several overlaid for contrast.

**Core principle:** the score is a portrait of *the author in this repo's stage*, not an
absolute talent ceiling. Read the repo type first; an infra repo and a product repo by the
same person produce different shapes — that contrast is the most interesting output.

**REQUIRED BACKGROUND:** read `references/archetypes.md` for the per-archetype scoring rubric
and the stage-shapes-score principle before assigning any numbers.

## When to use

- "Analyze my commits / what kind of dev am I / 我的技能點數" → score the 5 archetypes.
- Comparing the same author across 2+ repos (infra vs product, old vs new).
- Any request for a radar/spider chart of git history.

Not for: code review, commit-count leaderboards, or anything that isn't git-history analysis.

## Workflow

1. **Pick repos (ASK — do not assume).** Use AskUserQuestion: which repo(s)? include the
   current working dir? compare several? Also confirm an author filter if the repo has
   multiple committers (`git shortlog -sne` shows who dominates).
   *Non-interactive (subagent / CI / no human):* skip the ask and default to the current repo,
   all authors, output to scratchpad — then state those defaults in your report.

2. **Collect signals**, once per repo:
   ```bash
   scripts/collect-commits.sh <repo-path> [author-regex]
   ```
   Read the type distribution, time span, hot directories, and full subjects.

3. **Score 0–10 per archetype** using `references/archetypes.md`. Justify each score with a
   real commit subject. **Spike the dominant trait; avoid a flat 6–7 profile** (flat says
   nothing). Keep one honest counter-signal where it exists. Carry the stage caveat through.

4. **Build the config JSON** (`references/config.schema.md`; `references/config.example.json`
   is a complete two-repo example). Write per-axis `rows` with evidence-backed `note`s.

5. **Render** the sheet:
   ```bash
   node scripts/render-sheet.js <config.json> <out.html>
   ```
   Default `out.html` to the scratchpad dir unless the user named a location. The output is
   **JS-free inline SVG** on purpose (see Common Mistakes).

6. **Ask how to view it** (AskUserQuestion) and give the matching steps — see next section.

**One repo vs a comparison:** the contrast across repos is the headline (the `tag` gap pills,
the cross-repo `combined` story). With a single repo there is nothing to contrast, so either
**offer to add a second repo** (a different-stage repo by the same author is the most
revealing), or write a compelling solo sheet by using `combined`/`caveat` to name the
*latent* axes — "this repo can't show Grower because it has no users; a product repo would."

## Presenting the HTML (ASK which preview)

VS Code's plain editor shows only source; it does not render HTML. Offer the user a choice:

| Option | How | Notes |
|--------|-----|-------|
| **Live Preview** (recommended) | Install `ms-vscode.live-server`; right-click the `.html` → **Show Preview** (or the preview icon). | Real Chromium webview — SVG, CSS hover, animation all work; works over VS Code Remote. |
| **VS Code built-in / other HTML preview** | Right-click → preview with whatever extension they have. | Lightweight "HTML Preview" extensions **sanitize and may strip inline `<svg>`** — that's why a chart can vanish while text stays. The sheet degrades gracefully (inline `fill`/`stroke` + native `<title>` survive even if `<style>` is stripped), but if SVG is stripped entirely, fall back to a browser. |
| **Real browser** | `xdg-open <file>` (Linux) / open the `file://` path. | Always full fidelity. Note: a headless box has no display — then Live Preview is the route. |

The single rendered file works in all three; the choice only tailors the open instructions.

## Quick reference

| Need | Command |
|------|---------|
| Gather commit signals | `scripts/collect-commits.sh <repo> [author]` |
| Render sheet (1..N repos) | `node scripts/render-sheet.js <config.json> <out.html>` |
| Scoring rubric | `references/archetypes.md` |
| Config shape + example | `references/config.schema.md`, `references/config.example.json` |

## Common mistakes

- **Charting with `<canvas>` + JavaScript.** It renders blank in VS Code previews. Always use
  the bundled SVG generator — never hand-roll a canvas chart.
- **Hand-computing SVG polygon coordinates.** Error-prone trig. `render-sheet.js` does it.
- **Flat scores (everything 6–7).** Says nothing. Spike the dominant archetype; spread the rest.
- **Dropping the stage caveat.** Low Grower on an infra repo is the *stage*, not the person.
  Always include the caveat (the generator has a `caveat` field).
- **Not asking which repos / which preview.** Both are required interactive steps here.
- **Scoring before reading `references/archetypes.md`.** The rubric and anchors prevent
  arbitrary numbers.
