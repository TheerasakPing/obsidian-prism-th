#!/usr/bin/env bash
set -Eeuo pipefail

EXPECTED_UPSTREAM_SHA="41cc4817bf6da79688236f42905450bdf93f40b1"
UPSTREAM_URL="https://github.com/RMvdesi/obsidian-prism.git"
BRANCH="integration/upstream-v1.0.8-beta.3"

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
info() { printf '\n==> %s\n' "$*"; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || fail "Run this script inside a Git clone of obsidian-prism-th."
cd "$ROOT"

[[ -f package.json ]] || fail "package.json not found; wrong repository?"
grep -q '"name": "obsidian-prism-th"' package.json || fail "This does not look like the Thai Edition repository."
[[ -z "$(git status --porcelain)" ]] || fail "Working tree is not clean. Commit or stash changes before continuing."

CURRENT_BRANCH="$(git branch --show-current)"
[[ "$CURRENT_BRANCH" == "main" ]] || fail "Run from main (current branch: $CURRENT_BRANCH)."

if git remote get-url upstream >/dev/null 2>&1; then
  git remote set-url upstream "$UPSTREAM_URL"
else
  git remote add upstream "$UPSTREAM_URL"
fi

info "Fetching upstream branches and tags"
git fetch upstream --tags

ACTUAL_SHA="$(git rev-parse upstream/main)"
[[ "$ACTUAL_SHA" == "$EXPECTED_UPSTREAM_SHA" ]] || fail "upstream/main moved. Expected $EXPECTED_UPSTREAM_SHA but found $ACTUAL_SHA. Re-audit upstream before importing."

if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  fail "Branch $BRANCH already exists. Inspect it; refusing to overwrite."
fi

info "Creating isolated integration branch"
git switch -c "$BRANCH"

info "Merging audited upstream commit without creating a commit"
set +e
git merge --allow-unrelated-histories --no-commit "$EXPECTED_UPSTREAM_SHA"
MERGE_STATUS=$?
set -e

if [[ "$MERGE_STATUS" -ne 0 ]]; then
  printf '\nMerge stopped for manual conflict resolution. No commit was created.\n'
  printf 'Conflicts:\n'
  git diff --name-only --diff-filter=U || true
  printf '\nResolve README.md and package.json deliberately; preserve Thai Edition docs/locales and all upstream notices.\n'
  printf 'Then run: git add -A && git status && git commit -m "chore: import upstream Obsidian Prism v1.0.8-beta.3"\n'
  exit 2
fi

printf '\nUpstream files are staged in the merge state. Review before committing:\n'
git status --short
printf '\nNext: reconcile README.md/package.json if needed, then run npm ci, npm test, and npm run validate:locales.\n'
