---
name: github-gitlab-sync
description: Wire a project whose code lives on GitHub but whose CI/CD deploy runs on GitLab. Use this skill whenever the user wants to mirror a GitHub repository to GitLab, trigger a GitLab pipeline from GitHub Actions, reflect a GitLab pipeline's pass/fail back into a GitHub job, or wire the `royfw/gitlab-sync-action` GitHub Action. Trigger even when the user only says things like "sync my GitHub repo to GitLab", "deploy via GitLab from GitHub Actions", "mirror deploy/* to GitLab", or hits the `400 "No stages / jobs for this pipeline"` empty-pipeline error — even if they never say "gitlab-sync-action". Do NOT use for configuring the GitLab side itself (`.gitlab-ci.yml`, `.deploy/`, Helm, Dockerfile) — that's the internal DevOps deploy tooling's job — nor for npm version/publish, which is the `changeset-release` skill.
license: MIT
metadata:
  version: "1.0.0"
  summary: "Wire a GitHub-hosted repo to deploy through GitLab CI: mirror the repo, trigger the GitLab pipeline from GitHub Actions via royfw/gitlab-sync-action, and reflect the pipeline result back into the GitHub check."
  category: development
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
argument-hint: e.g. "wire GitHub→GitLab sync", "add gitlab-sync-action to this repo"
---

# GitHub → GitLab Sync Bridge

Wire a repo whose code lives on **GitHub** but whose CI/CD **deploy** runs on **GitLab**
(a devops-toolkit pipeline). A GitHub Actions workflow mirrors the pushed branch to GitLab,
triggers the GitLab pipeline for branches that actually have a job, and reflects the
pipeline result back into the GitHub run.

Two scopes this bridge deliberately does **not** own:

- **The GitLab side itself** (`.gitlab-ci.yml`, `.deploy/`, Helm overlays, Dockerfile) is
  configured separately by the internal DevOps deploy tooling. This skill only wires the
  GitHub→GitLab bridge that sits on top of an already-configured GitLab pipeline.
- **npm version + publish** run GitHub-native — that's the `changeset-release` skill. So
  `main` and `release/*` are typically *mirror-only* (pushed to GitLab, not triggered).

## When this applies

- Code on GitHub; deploy on a (often self-hosted) GitLab running `shared/devops-toolkit`.
- You want `push` on `deploy/*` to land on the matching GitLab branch, kick the pipeline,
  and turn the GitHub run red if GitLab fails.

If the repo deploys **directly via GitLab** (push goes straight to GitLab), you don't need
this bridge at all — just configure the GitLab CI/deploy side directly.

## How to wire it

1. Use the composite action **`royfw/gitlab-sync-action@v1`** — do **not** hand-roll
   `git push` + `curl` to the trigger API. The action does push + trigger + (optional) wait
   in one pinnable step and passes the trigger variables the toolkit expects (`DEPLOY_ENV`,
   `SOURCE_REF`, `SOURCE_SHA`, `TRIGGER_SOURCE`). A bare `curl --form ref=...` omits
   `DEPLOY_ENV`, so deploy routing silently misbehaves.
2. Copy `examples/.github/workflows/sync-to-gitlab.yml` into the repo's `.github/workflows/`,
   replace the GitLab project path/id and host, and configure the three GitHub secrets
   (see `examples/README.md`).
3. Gate `trigger_pipeline`/`wait_for_pipeline` to the branches GitLab actually has jobs for
   (`deploy/*`); mirror-only branches (`main`, `release/*`) must **not** be triggered, or
   GitLab returns `400 "No stages / jobs for this pipeline"`. The branch names you trigger
   **must match** the GitLab `.gitlab-ci.yml` routing rules — branch name is the contract.

Read **`./github-sync-reference.md`** for the full input/output/token reference, the
branch-name contract, both worked examples, and the pitfalls table. The ready-to-copy
workflow and its setup notes live in **`examples/`**.

## Authoritative sources

The reference here is hand-maintained, derived from the action itself:

- action (authoritative): https://github.com/royfw/gitlab-sync-action
- real usage: `royfw/apps/rfjs` → `.github/workflows/trigger-gitlab-pipeline.yml`
- local checkout (if present): `~/_/royfw/_devops/gitlab-sync-action`
