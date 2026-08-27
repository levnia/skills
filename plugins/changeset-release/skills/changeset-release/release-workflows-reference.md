# Release Workflows (reference)

The reusable GitHub workflows behind the version/publish flow, plus why the GitLab
toolkit publish job is unfit for a versioned branch. Caller examples live in
`./examples/`.

> `rf-devops` will be **replaced by `github-toolkit`**. The inputs/behavior below are
> expected to carry over. Repoint checklist for when it lands:
>
> 1. `examples/cd-version-release.yml` + `examples/cd-version-release-prerelease.yml` —
>    the `uses: royfw/rf-devops/...` lines.
> 2. Project repos' callers (e.g. rfjs `.github/workflows/cd-version-release*.yml`).
> 3. This file — workflow headings and the maintenance footer.
> 4. Before repointing, diff the ported workflows against the behavior documented here
>    (inputs, pre-mode handling, diff-mode release plan) and check whether the
>    `target_branch` gap below got fixed in the port.

## `royfw/rf-devops/.github/workflows/_changesets-version-channel-turbo.yml@main`

Versioning by channel. Called on PR-merge into a `release/*` branch.

### Inputs / secrets

| Input | Required | Default | Notes |
|-------|----------|---------|-------|
| `ref` | yes | – | the release branch to version (e.g. `release/stable`) |
| `channel` | yes | – | `stable` \| `alpha` \| `beta` \| `rc` |
| `node_version` | no | `20.x` | |
| `git_identity_mode` | no | `bot` | `bot` (github-actions[bot]) or actor |
| `git_bot_name` / `git_bot_email` | no | github-actions[bot] | used when mode is `bot` |

| Secret | Notes |
|--------|-------|
| `GIT_TOKEN` | required — checkout, push the bump commit to `ref`, open the PR back to `main` |

### What it does

1. Checkout `ref` (full history, `GIT_TOKEN`), set git identity, pnpm + Node, `pnpm install --frozen-lockfile`.
2. **Ensure `baseBranch` exists locally** — `changeset status` needs the configured
   `baseBranch` (from `.changeset/config.json`, default `main`) as a local branch; it is
   fetched and force-created. Missing baseBranch is a classic `changeset status` failure
   in CI.
3. **Pre-mode enter/exit by channel**:
   - `stable` → if `.changeset/pre.json` exists, `changeset pre exit`.
   - prerelease channel → enter `changeset pre enter <channel>`; if already in pre-mode
     under a *different* tag, `pre exit` then `pre enter` the new one.
4. **Release plan** — has releases if changeset `.md` files exist OR `changeset status`
   reports releases. Builds turbo `--filter` lists from the status output.
5. Build affected packages (`pnpm turbo run build --filter=<pkg>...`) **before**
   versioning, then `changeset version`.
6. Commit `chore(release): version packages (<channel>)` and push back to `ref`.
7. Open a PR `ref → main` (skipped if one is already open) so `main` picks up the
   versions and changelogs.

## `royfw/rf-devops/.github/workflows/_changesets-publish-only-turbo.yml@main`

Publish-only, with a **git-diff release plan** — the fix for the "changeset status sees
nothing after versioning" problem (see the GitLab section below).

### Inputs / secrets

| Input | Required | Default | Notes |
|-------|----------|---------|-------|
| `ref` | yes | – | branch carrying the bumped versions |
| `channel` | no | `stable` | dist-tag in stable-mode; ignored in pre-mode |
| `node_version` | no | `20.x` | |
| `build_task` | no | `build` | turbo task to build released packages |
| `run_tests` | no | `false` | turbo-test released packages before publish |
| `git_identity_mode` | no | `actor` | |

| Secret | Notes |
|--------|-------|
| `GIT_TOKEN` | required — checkout, push tags, open sync PR |
| `NPM_TOKEN` | required — `NODE_AUTH_TOKEN` for publish |

### What it does

1. Checkout `ref`, identity, pnpm/Node (registry `https://registry.npmjs.org`), install,
   ensure `baseBranch` exists locally.
2. **Release plan (diff mode)** — `git diff --name-only origin/<baseBranch>...HEAD`,
   keep directories whose `package.json` changed → those packages are the release set
   (works on a versioned branch where the changesets are already consumed).
3. Optional turbo test, then turbo build of the release set + deps.
4. **Publish, pre-mode aware** — if `.changeset/pre.json` exists: plain
   `changeset publish` (the pre tag wins; `--tag` is not allowed in pre-mode). Otherwise
   `changeset publish` for `stable`, `changeset publish --tag <channel>` for the rest.
5. **Per-package tags** — creates `pkg/<scope__name>/v<version>` for every workspace
   package version not yet tagged, then pushes tags.
6. Opens a PR `ref → target_branch` after publish.

### ⚠️ Known gap: `target_branch` is not declared

The final "Open PR back to target branch" step references `${{ inputs.target_branch }}`,
but `target_branch` is **not declared** under `workflow_call.inputs` — it expands to an
empty string, `gh pr list --base ""` errors, and the step's pipe swallows it and prints
"PR already exists." So the sync-back PR **silently no-ops**. Until rf-devops (or its
github-toolkit successor) declares the input, open the sync PR back to `main` yourself
after publishing, or patch the workflow.

## Why not the GitLab toolkit publish job

`devops-toolkit/gitlab-ci/changesets_publish/changesets-publish.yml`
(`.changesets_publish`) offers registry/scope config, channel auto-detect from the MR
into `publish/npmjs`, an already-published skip (`npm view` per release), and tag push.
But it is **structurally unfit for a versioned branch**:

- Its publish guard runs `changeset status` and exits 0 ("No releases to publish") when
  the status reports an empty release set.
- `changeset version` **consumes** the `.changeset/*.md` files — so any branch that has
  been versioned (which is exactly what you publish) always reports "no releases".
- Result: the job goes green and publishes nothing.

Fixes, in order of preference:

1. **Publish on GitHub** with plain `changeset publish` (`examples/cd-publish-npmjs.yml`)
   — no status guard; it compares `package.json` versions against the registry and skips
   private packages.
2. Use the **git-diff release plan** workflow above.

Do not "fix" it by keeping unconsumed changesets around — versioning must consume them.

---

<!--
Maintenance — this file is hand-maintained, not generated.
本檔內容對照下列實作整理(以實作為準):
- royfw/rf-devops → .github/workflows/_changesets-version-channel-turbo.yml
- royfw/rf-devops → .github/workflows/_changesets-publish-only-turbo.yml
- shared/devops-toolkit → gitlab-ci/changesets_publish/changesets-publish.yml
- 真實用法 (real usage): royfw/apps/rfjs → .github/workflows/cd-version-release*.yml、cd-publish-npmjs.yml
- 本機 checkout(若有): ~/_/royfw/_devops/rf-devops、~/_/royfw/_devops/devops-toolkit、~/_/royfw/_apps/rfjs
- 最後對照 (last cross-checked): 2026-06-05
-->
