# GitHub → GitLab Sync Bridge (reference)

How to wire a project whose code lives on **GitHub** but whose CI/CD deploy runs on
**GitLab** (the devops-toolkit pipeline). The GitHub side mirrors the pushed branch to
GitLab, triggers the GitLab pipeline, and reflects the pipeline result back into the
GitHub job.

## When this applies

- Developers push to GitHub; the actual **deploy** happens on a (often self-hosted)
  GitLab project running `.gitlab-ci.yml` from `shared/devops-toolkit`.
- You need GitHub `push` on `deploy/*` to land on the matching GitLab branch and kick the
  pipeline — and the GitHub run should go red if GitLab fails.

> **The bridge is for deploy.** npm version + publish now run **GitHub-native** (GitHub
> Actions), not on GitLab — see the `changeset-release` skill. So `main` and `release/*`
> are typically **mirror-only** (pushed to GitLab but no pipeline triggered); only branches
> that actually have a GitLab job (`deploy/*`) get triggered. Triggering a branch GitLab
> has no job for returns `400 "No stages / jobs for this pipeline"` — see Pitfalls below.

If the repo deploys **directly via GitLab** (push goes straight to GitLab), you don't need
this bridge — just configure the GitLab CI/deploy side directly (the internal DevOps deploy
tooling).

## Primary: `royfw/gitlab-sync-action@v1`

Use this composite action. **Do not hand-roll** `git push` + `curl` to the trigger API:
the action already does push + trigger + (optional) wait in one versioned, pinnable step,
and it passes the trigger variables the toolkit pipeline expects — including `DEPLOY_ENV`,
`SOURCE_REF`, `SOURCE_SHA`, `TRIGGER_SOURCE`. A bare `curl --form ref=...` trigger omits
`DEPLOY_ENV`, so the toolkit `detect_project` job won't receive its environment and deploy
routing silently misbehaves.

### Three modes

| Mode | Inputs | Use when |
|------|--------|----------|
| Push only | `trigger_pipeline: false`, `wait_for_pipeline: false` | Just mirror code; GitLab decides what to run |
| Push + trigger | `trigger_pipeline: true`, `wait_for_pipeline: false` | Fire and forget the pipeline |
| Push + trigger + wait | both `true` (defaults) | GitHub job mirrors GitLab pass/fail |

### Inputs (from `action.yml`)

| Input | Required | Default | Notes |
|-------|----------|---------|-------|
| `gitlab_push_host` | yes | – | GitLab host, no protocol (e.g. `gitlab.example.com`) |
| `gitlab_project_path` | yes | – | e.g. `namespace/group/project` |
| `gitlab_project_id` | yes | – | numeric project id |
| `gitlab_ref` | yes | – | target branch on GitLab — pass `${{ github.ref_name }}` |
| `deploy_env` | no | `dev` | passed to pipeline as `DEPLOY_ENV` |
| `trigger_pipeline` | no | `true` | trigger after push |
| `wait_for_pipeline` | no | `true` | poll until pipeline finishes |
| `poll_interval` | no | `10` | seconds between status polls |
| `gitlab_push_token` | yes | – | token with `write_repository` |
| `gitlab_trigger_token` | no | – | pipeline trigger token (needed if `trigger_pipeline`) |
| `gitlab_api_token` | no | – | token with `read_api` (needed if `wait_for_pipeline`) |
| `git_remote_name` | no | `gitlab` | local remote name |
| `force_push` | no | `true` | keep GitLab branch identical to GitHub |

### Outputs

| Output | Description |
|--------|-------------|
| `pipeline_id` | triggered GitLab pipeline id |
| `pipeline_status` | final status (`success`, `failed`, `canceled`, `skipped`, …) |
| `pipeline_web_url` | pipeline URL |

### Tokens (three, least-privilege)

Store all three in GitHub repo → Settings → Secrets and variables → Actions:

- `gitlab_push_token` — `write_repository` scope (Project/Personal Access Token).
- `gitlab_trigger_token` — a **pipeline trigger token** (GitLab → Settings → CI/CD →
  Pipeline trigger tokens). This is a distinct token type, *not* a PAT.
- `gitlab_api_token` — `read_api` scope, for polling status.

You may consolidate `push` + `api` into a single PAT carrying both `write_repository` and
`read_api` (rfjs does this: it feeds the same `GITLAB_API_TOKEN` into both
`gitlab_push_token` and `gitlab_api_token`). The trigger token stays separate.

### Branch-name is the contract

`gitlab_ref: ${{ github.ref_name }}` mirrors the GitHub branch name verbatim to GitLab.
The GitLab `.gitlab-ci.yml` `rules:` decode intent **by branch name**:

- `deploy/(dev|prod)` → build + deploy

That is the *only* job class left on GitLab. `release/*` (changeset version) and
`publish/npmjs` (npm publish) **used to** route here, but both moved to GitHub Actions —
GitLab has no job for them now. So:

- **Trigger only branches GitLab actually has a job for** (`deploy/*`). Gate the trigger:
  `trigger_pipeline: ${{ startsWith(github.ref_name, 'deploy/') }}`.
- **`main` and `release/*` are mirror-only** — pushed for a faithful mirror, but not
  triggered. Triggering them hits GitLab's empty-pipeline `400` (see Pitfalls).
- The branches you *do* trigger **must match** the GitLab routing rules. If GitHub uses
  `deploy/dev` but GitLab routes `deploy/staging`, nothing fires — align the names.

> For everything about the version/publish side (release branches, prerelease channels,
> `changeset publish`, npm troubleshooting), see the **`changeset-release`** skill — that
> path is GitHub-native and out of scope for this bridge.

### Example: minimal (push only)

```yaml
- name: Sync to GitLab
  uses: royfw/gitlab-sync-action@v1
  with:
    gitlab_push_host: gitlab.example.com
    gitlab_project_path: my-namespace/my-project
    gitlab_project_id: "12345"
    gitlab_ref: ${{ github.ref_name }}
    gitlab_push_token: ${{ secrets.GITLAB_PUSH_TOKEN }}
    trigger_pipeline: false
    wait_for_pipeline: false
```

### Example: mirror-many, trigger-deploy-only — validated in rfjs

Mirrors `main`, `release/*`, `deploy/*`, but **only triggers** the pipeline for `deploy/*`
(the others have no GitLab job). `main` + `release/*` are mirror-only; the trigger/wait are
gated on the branch prefix so they never hit GitLab's empty-pipeline `400`.

```yaml
name: Deploy

on:
  push:
    branches: [main, release/*, deploy/*]

# One in-flight run per branch so two pushes don't race the same GitLab branch
# (force_push keeps the GitLab branch identical to GitHub).
concurrency:
  group: gitlab-sync-${{ github.ref }}
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # full history for a faithful mirror push

      - name: Sync to GitLab
        id: sync
        uses: royfw/gitlab-sync-action@v1
        with:
          gitlab_push_host: ${{ secrets.GITLAB_PUSH_HOST }}
          gitlab_project_path: royfw/apps/rfjs
          gitlab_project_id: 5
          gitlab_ref: ${{ github.ref_name }}
          deploy_env: royfw-dev
          # GitLab only runs deploy (deploy/*); main + release/* are mirror-only
          # (no GitLab job → triggering would 400). Version/publish run on GitHub.
          trigger_pipeline: ${{ startsWith(github.ref_name, 'deploy/') }}
          wait_for_pipeline: ${{ startsWith(github.ref_name, 'deploy/') }}
          gitlab_push_token: ${{ secrets.GITLAB_API_TOKEN }}
          gitlab_trigger_token: ${{ secrets.GITLAB_TRIGGER_TOKEN }}
          gitlab_api_token: ${{ secrets.GITLAB_API_TOKEN }}

      - name: Deploy if Pipeline Succeeded
        if: steps.sync.outputs.pipeline_status == 'success'
        run: echo "Pipeline ${{ steps.sync.outputs.pipeline_id }} succeeded"
```

## Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| GitLab returns `400 "No stages / jobs for this pipeline"` when the bridge triggers | The action triggers via a **trigger token**, so the pipeline's `CI_PIPELINE_SOURCE` is `"trigger"`, not `"push"`. Any job whose `rules:` bind `$CI_PIPELINE_SOURCE == "push"` never matches → empty pipeline → 400 | In `.gitlab-ci.yml`, bind job rules to the **branch** (`$CI_COMMIT_BRANCH`), never to the pipeline source |
| Same `400` on `main` / `release/*` pushes | Those branches have **no GitLab job at all** (version/publish moved to GitHub) — triggering an empty pipeline is a 400 | Make them **mirror-only**: gate the trigger on branches that have a job, e.g. `trigger_pipeline: ${{ startsWith(github.ref_name, 'deploy/') }}` |
| `detect_project` deploys to the wrong / no environment | Hand-rolled `curl` trigger omitted `DEPLOY_ENV` | Use `gitlab-sync-action@v1` with `deploy_env:` — it passes `DEPLOY_ENV` (see top of this doc) |
| Two pushes race the same GitLab branch | No concurrency guard; `force_push` makes the later push clobber the earlier mirror mid-pipeline | Add `concurrency: { group: gitlab-sync-${{ github.ref }}, cancel-in-progress: false }` |

## Alternative: devops-toolkit built-in reusable workflows

The toolkit also ships reusable GitHub workflows that perform the sync. Prefer
`gitlab-sync-action@v1` for version pinning and composability; reach for the built-in
reusable workflows only if a project is already standardized on them.

## GitHub-native deploy (no GitLab) — TBD

Some projects deploy directly via GitHub Actions reusable workflows (the `rf-devops`
repo) straight to Kubernetes, with no GitLab in the loop. That path is still bespoke
per-project and is **not yet covered** by this skill; it will be documented once
consolidated into a future `github-toolkit`. For now, treat GitHub-native deploy as out
of scope here.

---

<!--
Maintenance — this file is hand-maintained, not generated.
本檔內容衍生自 royfw/gitlab-sync-action（action.yml + README），並對照 royfw/apps/rfjs
的 .github/workflows/trigger-gitlab-pipeline.yml 真實用法。
- 權威來源 (authoritative): https://github.com/royfw/gitlab-sync-action
- 真實用法參考 (real usage):  github.com/royfw/apps/rfjs → .github/workflows/trigger-gitlab-pipeline.yml
- 本機 checkout（若有 / if present）: ~/_/royfw/_devops/gitlab-sync-action
- 最後對照 (last cross-checked): 2026-06-10（release/publish 已改 GitHub-native，bridge 僅為 deploy；參見 changeset-release 技能）
-->
