# venvia-devops

CI/CD bridging: mirror a GitHub repo to GitLab and run its deploy pipeline from GitHub Actions, with the result reflected back as a GitHub check.

## Skills

- `venvia-devops:github-gitlab-sync` — Wire a GitHub-hosted repo to deploy through GitLab CI: mirror the repo, trigger the GitLab pipeline from GitHub Actions via royfw/gitlab-sync-action, and reflect the pipeline result back into the GitHub check.

## Use

Install via the [venvia/skills](../../) marketplace; Claude applies each skill
automatically when its trigger matches, or invoke one explicitly as `/venvia-devops:<skill>`.

```
/plugin marketplace add venvia/skills
/plugin install venvia-devops@venvia-skills
```

## License

MIT © Roy Chuang
