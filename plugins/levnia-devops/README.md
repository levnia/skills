# levnia-devops

CI/CD bridging: mirror a GitHub repo to GitLab and run its deploy pipeline from GitHub Actions, with the result reflected back as a GitHub check.

## Skills

- `levnia-devops:github-gitlab-sync` — Wire a GitHub-hosted repo to deploy through GitLab CI: mirror the repo, trigger the GitLab pipeline from GitHub Actions via royfw/gitlab-sync-action, and reflect the pipeline result back into the GitHub check.

## Use

Install via the [levnia/skills](../../) marketplace; Claude applies each skill
automatically when its trigger matches, or invoke one explicitly as `/levnia-devops:<skill>`.

```
/plugin marketplace add levnia/skills
/plugin install levnia-devops@levnia-skills
```

## License

MIT © Roy Chuang
