# venvia/skills

Roy Chuang's public [Claude Code](https://claude.com/claude-code) skills, packaged
as a plugin marketplace.

## Install

Add the marketplace, then install the groups you want:

```
/plugin marketplace add venvia/skills
/plugin install venvia-ui@venvia-skills
/plugin install venvia-js@venvia-skills
/plugin install venvia-dev@venvia-skills
/plugin install venvia-devops@venvia-skills
```

## Skills

Skills are grouped into plugins by where they are needed, so each environment can
install only the groups it uses. Installed skills appear as `<plugin>:<skill>`
(e.g. `venvia-ui:fleet-ui`).

| Plugin | Skill | What it does |
|--------|-------|--------------|
| venvia-ui | fleet-ui | 結構統一、皮膚自訂的 React/Next.js 後台 UI 設計指南——token 契約、元件配方、工作區外殼、頁面原型，與金融/地圖/流程選配模組。 |
| venvia-js | changeset-release | Set up and debug the GitHub-native npm release path — Changesets versioning, release branches and prerelease channels, GitHub Actions version/publish workflows, dist-tags, and npm publish troubleshooting. |
| venvia-js | rfjs-packages | First-party @rfjs/* npm package catalog — choosing libraries for filtering, JWT, retries, type conversion, object manipulation, and Postgres utilities, plus the template build-config factories. |
| venvia-js | rfjs-templates | Pick the right @rfjs start-ts-by template — bundler, framework, ORM, and simple vs. monorepo layout — for a new TypeScript/JavaScript project. |
| venvia-js | start-ts-by | Scaffold new projects from git repo or local folder templates with the start-ts-by CLI — template source formats, file filtering, package renaming, and post-create commands. |
| venvia-dev | git-persona-sheet | Profile a developer from git commit history against the five Cherny archetypes (Prototyper / Builder / Sweeper / Grower / Maintainer), score 0-10, and render an interactive inline-SVG radar build sheet across one or more repos. |
| venvia-dev | proposal-visual-aid | 在提案、方案比較、路線圖或 UI/流程說明時,產出風格統一的自包含 HTML 視覺輔助文件。 |
| venvia-devops | github-gitlab-sync | Wire a GitHub-hosted repo to deploy through GitLab CI: mirror the repo, trigger the GitLab pipeline from GitHub Actions via royfw/gitlab-sync-action, and reflect the pipeline result back into the GitHub check. |

## License

MIT © Roy Chuang
