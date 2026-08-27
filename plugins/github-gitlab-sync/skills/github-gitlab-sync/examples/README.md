# Example: GitHub → GitLab sync bridge

For a project whose code lives on **GitHub** but whose CI/CD deploy runs on **GitLab**
(the devops-toolkit pipeline). The workflow mirrors the pushed branch to GitLab and — for
branches GitLab actually has a job for (`deploy/*`) — triggers the pipeline and makes the
GitHub job go red if it fails. Other branches (`main`) are **mirror-only**.

> **Deploy only.** npm version/publish run GitHub-native (GitHub Actions) — see the
> `changeset-release` skill — so `release/*` branches are not part of this bridge.
> Triggering a branch GitLab has no job for returns `400 "No stages / jobs"`, which is why
> `trigger_pipeline`/`wait_for_pipeline` are gated on the `deploy/` prefix.

Full details: [`../github-sync-reference.md`](../github-sync-reference.md).

## How to use

1. Copy `.github/workflows/sync-to-gitlab.yml` into your GitHub repo.
2. Replace `gitlab_project_path` / `gitlab_project_id` (and the host secret) with your
   GitLab project's values.
3. Keep `trigger_pipeline`/`wait_for_pipeline` gated to the branches your GitLab
   `.gitlab-ci.yml` actually has jobs for; the names you trigger **must match** its routing
   rules (branch name is the contract). Add other branches to `on.push.branches` only if
   you want them mirrored.
4. Configure the GitHub Actions secrets below.

## Secrets (GitHub repo → Settings → Secrets and variables → Actions)

| Secret | What it is | Scope |
|--------|-----------|-------|
| `GITLAB_PUSH_HOST` | GitLab host, no protocol (e.g. `gitlab.example.com`) | — |
| `GITLAB_API_TOKEN` | GitLab PAT reused for push + status poll | `write_repository` + `read_api` |
| `GITLAB_TRIGGER_TOKEN` | GitLab pipeline trigger token (distinct token type, not a PAT) | — |

For strict least-privilege, split `GITLAB_API_TOKEN` into a push token (`write_repository`)
and a separate api token (`read_api`) and wire them to `gitlab_push_token` /
`gitlab_api_token` respectively.
