---
name: start-ts-by
description: >-
  Use when the user wants to create a new project from a template, scaffold a project,
  bootstrap from a git repo, initialize a project from boilerplate, or generate a new
  codebase from an existing repository. Triggers on: scaffold, bootstrap, create from
  template, start a new project from a repo, generate from repo, clone and customize,
  set up a project based on an existing starter. Also triggers when the user mentions
  start-ts-by directly. Do NOT use for: cloning an existing repo to work on it,
  writing components, debugging, refactoring, adding endpoints, writing tests,
  deploying, or setting up linting/formatting.
license: MIT
metadata:
  summary: "Scaffold new projects from git repo or local folder templates with the start-ts-by CLI — template source formats, file filtering, package renaming, and post-create commands."
  category: development
---

# start-ts-by

Scaffold new projects from git repository or local folder templates using the `start-ts-by` CLI tool.

## Overview

`start-ts-by` creates projects from git repo templates or local folders. It handles cloning/copying the template, removing unwanted files, renaming the package, and running post-creation commands.

Run via: `npx start-ts-by [options] [name]`

## Template Source Formats

The `-t, --template` flag accepts:

| Format | Example |
|--------|---------|
| GitHub shorthand | `user/repo` |
| GitHub with branch | `user/repo#branch` |
| GitHub with branch + subdir | `user/repo#branch/subdir` |
| SSH URL | `git@host:org/repo.git#ref/subdir` |
| HTTPS git URL | `https://host/org/repo.git#ref/subdir` |
| Local relative path | `./local-folder` |
| Local absolute path | `/absolute/path` |

Git sources copy only tracked files (`git ls-files`).

## Key Flags

| Flag | Description |
|------|-------------|
| `-t, --template <repo>` | Template source (required in non-interactive mode) |
| `--no-interaction, --ni` | Skip all prompts |
| `--monorepo` | Remove lock files, workspace config, .npmrc, .husky, .github, packageManager field |
| `--rm <files...>` | Remove specific files/folders (space-separated) |
| `--no-husky` | Remove .husky directory |
| `--no-gitlab` | Remove GitLab CI/CD config |
| `--no-deploy` | Remove deploy/.deploy configuration |
| `--git-init` | Run `git init` after creation |
| `--npm-install` | Run `npm install` after creation |
| `--vars <pairs...>` | Variables as `key=value` (supports nesting: `a.b=value`) |
| `--vars-file <path>` | Load variables from a file |
| `--yes, -y` | Use defaults and skip confirmations |
| `--list` | List all available templates |

## Workflow

1. **Determine template source** — If user didn't specify, run `npx start-ts-by --list` and ask them to choose.
2. **Determine project name** — Use what the user provided, or ask.
3. **Identify flags** — Based on user intent (see `rfjs-templates` skill for flag recommendations).
4. **Execute** — Interactive mode if details are missing, `--ni` if all parameters are clear.
5. **Verify** — Check the project was created at the expected directory.

## Common Mistakes

- Forgetting `--ni` requires both `name` and `--template` — otherwise the tool exits with error.
- `--rm` takes space-separated names: `--rm file1 file2`, not `--rm file1,file2`.
- `user/repo` is GitHub shorthand. For other hosts, use full HTTPS or SSH URLs.
- Use `./` or `file:` prefix for local directories to distinguish from GitHub shorthand.
