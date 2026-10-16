---
name: changeset-release
description: Set up and debug the GitHub-native npm release path — Changesets version management plus npm publish running on GitHub Actions. Use this skill whenever the user mentions setting up versioning or publishing for npm packages, changesets, release branches (release/stable, release/alpha|beta|rc), GitHub Actions version/publish workflows, prerelease channels, dist-tags, or npm publish troubleshooting — e.g. "publish succeeded but nothing is on npm", "a package on the changeset ignore list got published", "GitLab returned 400 No stages / jobs after a release push", or "Found changeset X for package Y which is not in the workspace". Do NOT use for Kubernetes/Helm deploy, .gitlab-ci.yml, .deploy/, or Dockerfiles, nor for setting UP a GitLab-native release (code hosted on GitLab) — both belong to the internal DevOps deploy tooling. Debugging changeset/publish problems IS in scope regardless of platform.
license: MIT
metadata:
  version: "0.2.0"
  summary: "Set up and debug the GitHub-native npm release path — Changesets versioning, release branches and prerelease channels, GitHub Actions version/publish workflows, dist-tags, and npm publish troubleshooting."
  category: development
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
argument-hint: action (e.g., "release setup", "add prerelease channel", "debug publish")
---

# Changeset Release Skill

Counterpart to the internal GitLab deploy tooling, which covers the GitLab deploy path; **this skill covers the GitHub-native release path**: Changesets version management + npm publish, both running on GitHub Actions. Your job is to wire the version + publish workflows correctly **and apply the hard-won rules in the Troubleshooting table — the pitfalls are most of this skill's value.**

## Scope boundary (vs the deploy side)

| Concern | Owner |
|---------|-------|
| `changeset version` / `changeset publish`, release & publish GitHub workflows, prerelease channels, dist-tags, NPM_TOKEN | **this skill** |
| K8s/Helm deploy, `.gitlab-ci.yml`, `.deploy/`, Dockerfiles, `GITLAB_CI.md` | internal deploy tooling |
| GitHub→GitLab bridge (`royfw/gitlab-sync-action@v1`) | the `github-gitlab-sync` skill owns setup; **this skill** owns how the release path interacts with it (mirror-only branches, trigger-source pitfall — see Troubleshooting) |
| GitLab-native release **setup** (`.gitlab-ci/deploy/changeset_version.yml`, toolkit `changesets_version_channel` / `changesets_publish`) | internal deploy tooling — but this skill's Troubleshooting still applies there (the toolkit publish guard flaw is documented in `release-workflows-reference.md`) |

## Architecture: the responsibility split

GitHub Actions owns **version + npm publish**; GitLab CI owns **only K8s deploy**. Validated layout (rfjs):

```
GitHub repo
├─ .github/workflows/cd-version-release.yml             ← version, stable channel
├─ .github/workflows/cd-version-release-prerelease.yml  ← version, alpha|beta|rc channels
│     PR merged into release/* →
│     uses royfw/rf-devops/.github/workflows/_changesets-version-channel-turbo.yml@main
│     → changeset version, push bump back to release/*, open PR back to main
├─ .github/workflows/cd-publish-npmjs.yml               ← npm publish, manual workflow_dispatch
│     Run workflow (ref, channel) → changeset publish → npm + git tags
└─ .github/workflows/trigger-gitlab-pipeline.yml        ← bridge: deploy only (github-gitlab-sync)
      main / release/*  → mirror-only (NO pipeline trigger — GitLab has no jobs for them)
      deploy/*          → mirror + trigger + wait
```

> `rf-devops` will be **replaced by `github-toolkit`**. When it lands, repoint every `uses: royfw/rf-devops/...` reference — see the repoint checklist in `release-workflows-reference.md`.

## The release flow

```
1. pnpm changeset:add                      # author changeset(s), commit to main
2. PR  main → release/stable               # or release/alpha|beta|rc for prerelease
   merge → Version workflow (GitHub Actions):
     - enters/exits changeset pre mode to match the channel
     - changeset version → bumps + CHANGELOGs
     - pushes the version commit back to the release branch
     - opens a PR back to main (merge it so main carries the versions)
3. Get the versioned state onto the publish ref
   (merge release/* → publish branch, or publish straight from release/* via the ref input)
4. Actions tab → "CD NPM Publish" → Run workflow (ref + channel)    # manual gate
     - changeset publish      (stable → dist-tag latest; other channels → --tag <channel>)
     - push git tags
5. Verify on the registry — expect a propagation delay on a first publish
```

**Channel → dist-tag:** `stable` → `latest`; `alpha`/`beta`/`rc` → that dist-tag.
**Pre-mode rule:** when `.changeset/pre.json` exists, run plain `changeset publish` (its tag wins; `--tag` is not allowed). Only pass `--tag <channel>` in stable-mode for a non-stable channel.

## How to get detailed reference

| Topic | Reference file |
|-------|---------------|
| rf-devops reusable workflows (version / publish-only) + why the GitLab toolkit publish job is unfit for this flow | `./release-workflows-reference.md` |
| GitHub→GitLab bridge inputs and modes | the `github-gitlab-sync` skill (`github-sync-reference.md`) |

## Workflow

### Determine Topology

Where the code lives decides whether this skill applies:

- **GitHub-native** (code on GitHub, no GitLab) → this skill; phases below.
- **GitHub repo + GitLab mirror** (deploy runs on GitLab via the bridge) → this skill; phases below, Phase 4 mandatory.
- **GitLab-native** (code lives on GitLab) → release **setup** is the internal deploy tooling's job — it generates `.gitlab-ci/deploy/changeset_version.yml` from the toolkit's `changesets_version_channel` template. Hand setup off; this skill's Troubleshooting and Rules still apply there (notably: the toolkit publish job's `changeset status` guard flaw — see `release-workflows-reference.md` — and the `"private": true` hold-back rule).

### Determine Project State

- **No release workflows yet** → Phase 1–6.
- **Has release/publish workflows** → Phase A (Audit) first.

### Phase A: Audit Existing Release Setup

1. Read `.github/workflows/` release/publish/sync files, `.changeset/config.json`, and each package's `package.json` (`private`, `publishConfig.access`, `version`).
2. Check every Troubleshooting rule against the config — especially: hold-backs done via `config.ignore` instead of `"private": true`; publish gated on `changeset status`; bridge triggering branches that have no GitLab jobs; jobs bound to `$CI_PIPELINE_SOURCE == "push"`; a long-lived publish branch that has diverged from `main`.
3. Present findings and get approval before changing anything. Fix only what is wrong; don't rewrite working config.

### Phase 1: Understand the Project

1. **Changesets state** — `.changeset/config.json`: `baseBranch`, `ignore`, `access`, changelog generator; whether `.changeset/pre.json` exists (pre-mode).
2. **Publish set** — which packages have `publishConfig.access: "public"` vs `"private": true`. Confirm hold-backs use `"private": true` (see Rules).
3. **Tooling** — package manager (pnpm assumed), Turborepo or not, Node version, the packages-only build script (e.g. `build:packages`), `changeset:add` / `changeset:status` scripts.
4. **Channels needed** — stable only, or also alpha/beta/rc.

### Phase 2: Generate the Version Workflows

1. Copy `examples/cd-version-release.yml` (stable) and, if prerelease channels are wanted, `examples/cd-version-release-prerelease.yml`.
2. Both trigger on `pull_request_target` with `types: [closed]` and guard `if: github.event.pull_request.merged == true` — closed-without-merge also fires the event; the guard filters it. `pull_request_target` runs the definition from the base branch, so the workflow file must already exist on the release branch (in practice: on `main` before the release branch is cut/updated).
3. Both call `royfw/rf-devops/.github/workflows/_changesets-version-channel-turbo.yml@main` with `ref` + `channel` and secret `GIT_TOKEN`. The reusable workflow handles pre-mode enter/exit per channel, runs `changeset version`, builds affected packages via turbo filters, pushes the bump commit, and opens the PR back to `main` (details in `release-workflows-reference.md`).

### Phase 3: Generate the Publish Workflow

1. Copy `examples/cd-publish-npmjs.yml`. It is a **manual `workflow_dispatch`** with inputs `ref` (branch carrying the bumped versions) and `channel` (dist-tag choice).
2. It runs **plain `changeset publish`** — deliberately no `changeset status` guard (see Troubleshooting #2): publish compares each public package's `package.json` version against the registry and skips anything already published or private.
3. Keep the `concurrency` group so two publishes never race, and the tag-push step (`changeset publish` creates tags locally; they must be pushed).
4. Adjust the build step to the project's packages-only build script.
5. Alternative: the reusable `_changesets-publish-only-turbo.yml` (git-diff release plan, per-package `pkg/<name>/v<version>` tags) — see the reference file, including its known `target_branch` gap.

### Phase 4: Align the GitLab Bridge (only if the repo mirrors to GitLab)

The bridge itself is the `github-gitlab-sync` skill's territory; this skill only enforces the release-path constraints:

1. The bridge must be **mirror-only** for `main` and `release/*` — only branches that actually have GitLab jobs (`deploy/*`) get `trigger_pipeline`/`wait_for_pipeline`:
   `trigger_pipeline: ${{ startsWith(github.ref_name, 'deploy/') }}`
2. GitLab job rules must bind to **branches**, never to `$CI_PIPELINE_SOURCE == "push"` (the bridge triggers with `CI_PIPELINE_SOURCE == "trigger"`).
3. If the project previously published via GitLab (devops-toolkit `.changesets_publish`), retire that job — publish now lives on GitHub.

### Phase 5: Secrets and Branch Protection

GitHub → Settings → Secrets and variables → Actions:

| Secret | Used by | Notes |
|--------|---------|-------|
| `GIT_TOKEN` | version + publish workflows | PAT able to push `release/*`, push tags, and open PRs |
| `NPM_TOKEN` | publish workflow | publish rights on the package scope |

Branch protection recommendations (team reviews and adjusts):

| Branch | Recommendation |
|--------|----------------|
| `main` | no direct push, PR-only, CI required |
| `release/*` | maintainers merge; merge triggers versioning |
| publish ref (e.g. `publish/npmjs`) | maintainers merge; publish stays a manual gate |

### Phase 6: Validate and Document

1. `gh workflow list` — confirm the workflows registered.
2. Dry-run the loop: changeset on `main` → PR → merge into a release branch → watch the version run push the bump and open the PR back to `main`.
3. After the first publish: `npm view <pkg> version` or `curl https://registry.npmjs.org/@scope%2Fname` — remember the first-publish 404 window (Troubleshooting #5).
4. Document the release path in the repo's docs (CLAUDE.md CI/CD section; if the deploy tooling generated a `GITLAB_CI.md`, record the GitHub-owned version/publish split there, as rfjs does).

**NEVER generate files without confirming with the user first.** Present the plan, get approval, then write.

## Rules (non-negotiable)

- **Never run `changeset version` or `changeset publish` locally.** CI only. Locally: `changeset:add` and `changeset status`, nothing else.
- **Hold a package back from publish with `"private": true` only.** `config.ignore` does not stop `changeset publish` (it only gates `add`/`version`).
- **Publish is a manual gate** (`workflow_dispatch`), never push-triggered.
- **Bridge rules bind to branches, not pipeline source; trigger only branches that have GitLab jobs.**
- **Pre-mode owns the dist-tag.** Never pass `--tag` while `.changeset/pre.json` exists.
- **Generate changeset files with `changeset add`, never by hand.** The CLI lists the workspace packages and you select from them, so the frontmatter name cannot be wrong. Edit the body afterwards for a detailed entry. Hand-writing is the usual source of the "not in the workspace" failure below.

## What `changeset status` actually checks

Worth knowing before wiring it into CI as a pre-release guard. Verified against
`@changesets/cli` 2.30.0 / `@changesets/git` 3.0.4:

| Command | Package changed, no changeset | Wrong package name | Needs git history |
|---------|-------------------------------|--------------------|-------------------|
| `changeset status` | **exit 1** | **exit 1** | yes |
| `changeset status --since=HEAD` | exit 0 | **exit 0 — name not checked** | no |
| Custom name check (~15 lines) | exit 0 | **exit 1** | no |

**It is a policy gate, not a name validator.** `changeset status` exits 1 whenever a
versionable package changed and no changeset exists, so adopting it requires *every* branch
touching a package to carry one, with `changeset add --empty` as the opt-out. Decide that
deliberately — it is a team policy, not a CI detail.

**Omitting `--since` does not make it git-free.** `getVersionableChangedPackages` resolves
`ref ?? config.baseBranch`, so it still runs `git merge-base <baseBranch> HEAD` — the
reason a missing `baseBranch` is a classic CI failure (see `release-workflows-reference.md`,
which force-creates it). The `status()` path has **no try/catch** (unlike `add()`), so the
job dies on a git error that reads like a broken runner rather than a validation failure.
In a shallow-cloning CI (GitLab fetches only the pipeline ref) it needs both:

```yaml
variables:
  GIT_DEPTH: 0              # merge-base needs real history, not a shallow clone
script:
  - git fetch origin main   # make the baseBranch ref exist locally
  - pnpm exec changeset status
```

**There is no native "validate names only" mode.** `--since=HEAD` filters the changesets
away along with the diff, so it validates nothing. To catch bad names without the policy
and without a git dependency, write it: collect `name` from `apps/*/package.json` and
`packages/*/package.json`, scan the `.changeset/*.md` frontmatter, exit 1 on any name not
in the set. No install needed, finishes in seconds.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Package on `.changeset/config.json` `ignore` got published anyway | `changeset publish` does not consult `ignore` — that list only gates `changeset add`/`version`. Publish compares every public package's `package.json` version against the registry | Hold packages back with `"private": true` in their own `package.json` — the only exclusion publish honors. Re-enable by removing the flag (keep `publishConfig.access: "public"` for scoped packages) |
| GitLab publish job exits green with "No releases to publish" on a versioned branch | devops-toolkit `.changesets_publish` guards on `changeset status`, but `changeset version` consumes the changesets — a versioned branch always reports "no releases" → publish silently skipped | Publish from GitHub with plain `changeset publish` (`cd-publish-npmjs.yml`), or use the git-diff release plan (`_changesets-publish-only-turbo.yml`). Never gate publish on `changeset status` |
| GitLab returns `400 "No stages / jobs for this pipeline"` when the bridge triggers | `gitlab-sync-action` triggers via trigger token → `CI_PIPELINE_SOURCE` is `"trigger"`, not `"push"`. Jobs whose rules bind `$CI_PIPELINE_SOURCE == "push"` never match → empty pipeline → 400 | Bind GitLab job rules to branches (`$CI_COMMIT_BRANCH`), never to the pipeline source |
| Same `400` on `main` / `release/*` pushes | Those branches have no GitLab jobs at all; triggering an empty pipeline is a 400 | Make the bridge mirror-only for them: `trigger_pipeline: ${{ startsWith(github.ref_name, 'deploy/') }}` — trigger only branches with GitLab jobs |
| New scoped package 404s on the registry right after its first publish | npm propagation delay on a first publish — can take minutes | Not a failure. Verify with `curl https://registry.npmjs.org/@scope%2Fname` and retry shortly |
| Versions / tags / `pre.json` out of sync with CI | Someone ran `changeset version`/`publish` locally | Don't. CI only — see Rules. Reconcile the branch state, then let CI redo it |
| Publish branch (`publish/npmjs`) drifts ever further from `main` | Long-lived publish branch keeps diverging as `main` moves | Keep it identical to `main` (fast-forward only) or retire it — the publish workflow takes `ref` via `workflow_dispatch`, so you can publish straight from the versioned branch |
| `ENEEDAUTH` / `401` during publish | `NPM_TOKEN` missing or lacks publish rights on the scope | Set `NPM_TOKEN` in GitHub Secrets; verify scope access on npmjs |
| Publish run green but nothing was published | Every package version on the ref already exists on npm — the ref didn't carry the bump commit | Confirm versioning ran on `release/*` and the publish ref includes the version commit |
| `npm publish` reports `version already exists` | That version was published before | `changeset publish` skips existing versions; harmless. To re-release, bump again |
| Version workflow never fires on merge | `pull_request_target` + `types: [closed]` fires on close-without-merge too, and runs the definition from the base branch | Keep the `if: github.event.pull_request.merged == true` guard; make sure the workflow file exists on the base branch |
| Version job fails: `Found changeset <file> for package <name> which is not in the workspace` | The changeset frontmatter name is not a workspace `package.json` `name`. Changesets matches literally (a `Set.has()` in `assemble-release-plan`) — no fuzzy match, never a warning. Usually a hand-written file given a phantom scope: monorepo apps are often unscoped while shared packages are scoped (`store-api` vs `@repo/logger`) | Match the `name` field exactly. Generate with `changeset add` (see Rules). Note this surfaces **only** in the version job on the release branch — feature-branch checks don't touch changesets, so it lies dormant until the most expensive point |
| Renaming a package/service breaks the next version run | Pending changesets still carry the old name → "not in the workspace" | Update the frontmatter of every pending `.changeset/*.md` as part of the rename |
| Prerelease published under the wrong dist-tag | `--tag` passed while in pre-mode, or `--tag` missing in stable-mode for a non-stable channel | In pre-mode run plain `changeset publish` (the `pre.json` tag wins); use `--tag <channel>` only in stable-mode |

## Examples

The `examples/` directory contains workflows validated in rfjs. Comments mark the project-specific values to adapt (publish ref, build script, Node version).

| Example | Use when |
|---------|----------|
| `examples/cd-version-release.yml` | Versioning for the stable channel (`release/stable`) |
| `examples/cd-version-release-prerelease.yml` | Versioning for prerelease channels (`release/alpha\|beta\|rc`) |
| `examples/cd-publish-npmjs.yml` | Manual npm publish (`workflow_dispatch`, ref + channel) |
