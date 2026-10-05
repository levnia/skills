#!/usr/bin/env bash
#
# collect-commits.sh — dump the commit signals needed to score a repo against
# the five developer archetypes. Run it once per repo; read the output and apply
# references/archetypes.md to assign scores.
#
# Usage:
#   collect-commits.sh <repo-path> [author-regex]
#
#   <repo-path>     path to a git working tree (its toplevel is auto-detected)
#   [author-regex]  optional --author filter (e.g. "Roy" or an email). Omit to
#                   include all authors; the author table below tells you who
#                   dominates so you can decide whether to re-run with a filter.
#
# Output is plain text grouped by signal. Nothing is scored here — scoring is a
# judgment call the agent makes from these signals.

set -euo pipefail

REPO="${1:?usage: collect-commits.sh <repo-path> [author-regex]}"
AUTHOR="${2:-}"

cd "$REPO"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

AUTHOR_ARGS=()
[ -n "$AUTHOR" ] && AUTHOR_ARGS=(--author="$AUTHOR")

echo "############################################################"
echo "# REPO: $ROOT"
[ -n "$AUTHOR" ] && echo "# AUTHOR FILTER: $AUTHOR"
echo "############################################################"

echo
echo "=== authors (shortlog) ==="
git shortlog -sne --all | head -20

echo
echo "=== total commits on HEAD${AUTHOR:+ (filtered)} ==="
git rev-list --count "${AUTHOR_ARGS[@]}" HEAD

echo
echo "=== conventional-commit type distribution ==="
git log "${AUTHOR_ARGS[@]}" --pretty=format:"%s" \
  | grep -oE "^[a-z]+(\([^)]*\))?" | sed -E 's/\(.*\)//' \
  | sort | uniq -c | sort -rn

echo
echo "=== time span + per-month volume ==="
echo "first: $(git log "${AUTHOR_ARGS[@]}" --reverse --pretty=%ad --date=short | head -1)   last: $(git log "${AUTHOR_ARGS[@]}" --pretty=%ad --date=short | head -1)"
git log "${AUTHOR_ARGS[@]}" --pretty=format:"%ad" --date=format:"%Y-%m" | sort | uniq -c

echo
echo "=== most-touched directories (commit-touch frequency) ==="
git log "${AUTHOR_ARGS[@]}" --pretty=format: --name-only \
  | grep -v '^$' | sed -E 's|/[^/]+$||' | sort | uniq -c | sort -rn | head -25

echo
echo "=== refactor / test / revert subjects (Sweeper + Maintainer signals) ==="
git log "${AUTHOR_ARGS[@]}" --pretty=format:"%ad | %s" --date=short \
  --grep="^refactor" --grep="test" --grep="revert" --grep="rename" -i | head -40

echo
echo "=== full commit subjects (newest first) ==="
git log "${AUTHOR_ARGS[@]}" --pretty=format:"%ad | %s" --date=short
echo
