# github-gitlab-sync

A Claude Code plugin for projects whose **code lives on GitHub but whose CI/CD
deploy runs on GitLab** (often self-hosted). It wires the bridge end to end:

- mirror the pushed branch to the GitLab project,
- trigger the GitLab pipeline from GitHub Actions via
  [`royfw/gitlab-sync-action`](https://github.com/royfw/gitlab-sync-action),
- wait for the pipeline and reflect its pass/fail back into the GitHub job.

It also knows the classic pitfalls — e.g. the `400 "No stages / jobs for this
pipeline"` empty-pipeline error from job rules bound to
`$CI_PIPELINE_SOURCE == "push"`, and which branches should be mirror-only.

## Use

Install via the [venvia/skills](../../) marketplace, then ask Claude Code things
like *"sync my GitHub repo to GitLab"* or *"deploy via GitLab from GitHub
Actions"*. A ready-to-adapt workflow lives in
`skills/github-gitlab-sync/examples/`.

## License

MIT © Roy Chuang
