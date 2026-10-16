# orelvo-js

JavaScript/TypeScript ecosystem tools: the @rfjs package catalog and template selection, start-ts-by project scaffolding, and Changesets-based npm releases on GitHub Actions.

## Skills

- `orelvo-js:changeset-release` — Set up and debug the GitHub-native npm release path — Changesets versioning, release branches and prerelease channels, GitHub Actions version/publish workflows, dist-tags, and npm publish troubleshooting.
- `orelvo-js:rfjs-packages` — First-party @rfjs/* npm package catalog — choosing libraries for filtering, JWT, retries, type conversion, object manipulation, and Postgres utilities, plus the template build-config factories.
- `orelvo-js:rfjs-templates` — Pick the right @rfjs start-ts-by template — bundler, framework, ORM, and simple vs. monorepo layout — for a new TypeScript/JavaScript project.
- `orelvo-js:start-ts-by` — Scaffold new projects from git repo or local folder templates with the start-ts-by CLI — template source formats, file filtering, package renaming, and post-create commands.

## Use

Install via the [orelvo/skills](../../) marketplace; Claude applies each skill
automatically when its trigger matches, or invoke one explicitly as `/orelvo-js:<skill>`.

```
/plugin marketplace add orelvo/skills
/plugin install orelvo-js@orelvo-skills
```

## License

MIT © Roy Chuang
