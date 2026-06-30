# The Five Developer Archetypes — scoring rubric

Framework: Boris Cherny's (Claude Code lead) five AI-era talent archetypes, ordered
along a product lifecycle. Each is scored **0–10** from a repo's commit history.

| Archetype | 中文 | Core role |
|-----------|------|-----------|
| **Prototyper** | 原型探索者 | Generates many ideas, explores the unknown; most experiments never ship. |
| **Builder** | 產品建構者 | Turns prototypes into stable production products / infrastructure. |
| **Sweeper** | 系統整頓者 | Tidies interfaces, simplifies code/architecture, removes redundancy, optimizes. |
| **Grower** | 市場成長者 | Iterates on a shipped product to improve product-market fit. |
| **Maintainer** | 系統守護者 | Owns mature systems for security, reliability, scale. |

## The single most important principle

**A repo's stage and type cap the scores, not the person's ability.**

The same author scores very differently across repos. Read the repo first, then score:

- **Infrastructure / library / engine repo** → Builder & Maintainer run high; Grower runs
  low (no end users, no PMF loop to show). Do not read low Grower as "can't grow."
- **Product / docs / user-facing repo** (a tool, an app, a skill, a CLI with adoption) →
  Grower & Prototyper light up (feedback-driven iteration, conceptual pivots, reach).
- **Greenfield / spike repo** → Prototyper high, Maintainer near-zero (nothing to maintain yet).

**ALWAYS carry this caveat into the output.** The sheet is a portrait of *the author in
this repo's stage*, not an absolute talent ceiling. Comparing 2+ repos of different types
for the same author is the most insightful use — it shows the shape changing with the stage.

## Signals → score

Read these from `scripts/collect-commits.sh` output. Weigh evidence; don't count blindly.

**First, discount the noise.** Ignore automation / bot commit types — they aren't human
signal: `sync` (session/memory snapshots), `chore(release)` / version bumps, `chore(deps)` /
dependabot, merge commits. Score the human-authored `feat`/`fix`/`refactor`/`docs`/`test` work.

**Reading `docs:` (it cuts more than one way — classify before scoring):**
- *User-facing product docs* (READMEs, install/usage guides, API references, examples for
  consumers) → **Grower up** (reach/adoption), and for a docs-as-product repo, also Builder.
- *Internal engineering design* (design specs, implementation plans written before the code)
  → **Prototyper down** (spec-first discipline, not exploratory) and roughly Builder-neutral.
- *Docs-dominated with little engineering* → Builder **down**.
Decide which kind dominates before letting `docs` move any score.

### Prototyper （原型探索者）
- **Up:** conceptual pivots in subjects (`pivot focus from X to Y`, `restructure`, `rewrite`,
  `replace A with B`); early dense trial-and-error bursts; many short-lived spikes/branches;
  greenfield `initial …` followed by rapid reshaping.
- **Down:** spec-first / plan-first discipline (commits referencing specs/plans before code);
  highly convergent history with little throwaway.

### Builder （產品建構者）
- **Up:** high `feat:` share; features shipped with **tests**; abstractions extracted into
  reusable units; CI/build/publish pipelines; infra that others consume.
- **Down:** docs-dominated history with little engineering; mostly config tweaks.

### Sweeper （系統整頓者）
- **Up:** `refactor:` commits; renames/reorg; de-duplication (`unify`, `consolidate`, `dedupe`);
  removing dead code/flags/abstractions; structure simplification.
- **Down (counter-signal):** accepted/documented duplication instead of eliminating it;
  no cleanup passes.

### Grower （市場成長者）
- **Up:** responding to user feedback (`address N feedback gaps`, `fix … confusion`);
  expanding reach/adoption (install docs for more platforms, more examples/use-cases);
  gating/UX refinements driven by real-world use; "sync to upstream vX" to keep a
  consumer-facing product current.
- **Down:** internal infra with no users / no feedback loop in the history.

### Maintainer （系統守護者）
- **Up:** high `fix:` share on reliability (stuck-release recovery, identity/permissions,
  portability, unbound-var/edge-case fixes); building **test guards / regression harnesses**;
  security review; version-sync discipline; post-incident hardening.
- **Down (cap):** a young repo (weeks old) tops out ~7 — it's "building reliability in,"
  not "stewarding a mature/legacy system."

## Calibration anchors (from the originating session)

Two repos by the same author, scored to make the contrast legible:

| | Builder | Maintainer | Sweeper | Prototyper | Grower |
|---|---|---|---|---|---|
| `deploy-toolkit` (CI/CD **infra**, 159 commits, feat-heavy) | 9 | 7 | 6 | 5 | 4 |
| `devops-configure` (Claude **skill / product**, 55 commits, docs-heavy, feedback-driven) | 6 | 7 | 6 | 6 | 7 |
| `hq` (**personal agent-kit / tooling**, ~88 commits, single-author, spec-first, no external users) | 8 | 6 | 5 | 4 | 4 |

Note how Grower (+3) and Prototyper (+1) jump on the product repo while Builder drops (−3,
docs-heavy) — the person didn't change, the stage did. Use spread like this; avoid giving
everything 6–7 (flat profiles say nothing). Spike the dominant trait, justify each score with
an actual commit subject, and keep one honest counter-signal where it exists.
