# venvia/skills

Roy Chuang's public [Claude Code](https://claude.com/claude-code) skills, packaged
as a plugin marketplace.

## Install

Add the marketplace, then install the plugins you want:

```
/plugin marketplace add venvia/skills
/plugin install git-persona-sheet@venvia-skills
```

## Skills

| Plugin | What it does |
|--------|--------------|
| [git-persona-sheet](plugins/git-persona-sheet) | Profile a developer from git commit history against the five Cherny archetypes (Prototyper / Builder / Sweeper / Grower / Maintainer), score 0-10, and render an interactive inline-SVG radar build sheet across one or more repos. |
| [github-gitlab-sync](plugins/github-gitlab-sync) | Wire a GitHub-hosted repo to deploy through GitLab CI: mirror the repo, trigger the GitLab pipeline from GitHub Actions via royfw/gitlab-sync-action, and reflect the pipeline result back into the GitHub check. |
| [changeset-release](plugins/changeset-release) | Set up and debug the GitHub-native npm release path — Changesets versioning, release branches and prerelease channels, GitHub Actions version/publish workflows, dist-tags, and npm publish troubleshooting. |
| [start-ts-by](plugins/start-ts-by) | Scaffold new projects from git repo or local folder templates with the start-ts-by CLI — template source formats, file filtering, package renaming, and post-create commands. |

## License

MIT © Roy Chuang
