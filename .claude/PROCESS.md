# Claude Code — Project Process

Rules for how Claude operates in this repo.

## Git workflow

**Everything goes through a PR. No direct pushes to `main`.**

This applies to all changes without exception — features, bug fixes, schema updates, config files, chores, `.gitignore`, CI, documentation. The workflow is always:

```bash
git checkout main && git pull
git checkout -b <branch-name>
# ... make changes ...
git add <files>
git commit -m "<message>"
git push -u origin <branch-name>
gh pr create --title "..." --body "..."
```

Never run `git push` targeting `main` directly.

## Branch naming

| Type | Pattern | Example |
|------|---------|---------|
| Implementation layer | `impl/<track>-l<N>-<name>` | `impl/site-l1-scaffold` |
| Spec layer | `spec/layer-<NN>-<name>` | `spec/layer-01-site-overview` |
| Bug fix | `fix/<short-description>` | `fix/sample-json-validation` |
| Chore / config | `chore/<short-description>` | `chore/gitignore-raw-data` |

## Quality gates

All three must be green before any PR can be merged. The pre-commit and pre-push hooks enforce them locally; CI enforces them on every push.

| Check | Command | When |
|-------|---------|------|
| Formatting | `npx oxfmt --check <staged-files>` | pre-commit |
| Linting | `npx oxlint <staged-files>` | pre-commit |
| Type checking | `npm run typecheck` (`tsc --noEmit`) | pre-push |

Hooks are managed by Husky and installed automatically via `npm install` → `prepare` script.

**Claude must not bypass hooks** — do not pass `--no-verify`. If a hook fails, fix the issue.

## PR review agent process

Before merging any implementation PR, run a review pass:

1. Read the full diff: `gh pr diff <number>`
2. Check the relevant spec layer (e.g. `spec/01-site-overview.md` Layer N) for deliverables and acceptance criteria
3. Verify every acceptance criterion is met by the diff
4. Check for TypeScript `any` suppressions, missing Zod validation at boundaries, and obvious spec gaps
5. Leave a comment on the PR for anything that needs addressing: `gh pr comment <number> --body "..."`
6. Only merge when all acceptance criteria are confirmed met and no open comments remain

When Claude is both author and reviewer of a PR (no human reviewer present), it must still do this review pass explicitly — do not skip it just because the code was just written.

## PR iteration

After a PR is opened, poll for reviewer comments with:
```bash
gh pr view <number> --json state,reviewDecision,comments,reviews
```

For each comment: apply the change on the branch, push a new commit, reply on the PR:
```bash
gh pr comment <number> --body "Addressed in <sha>: <explanation>"
```

Merge when approved with no open comments:
```bash
gh pr merge <number> --squash --delete-branch
```

## Implementation layers

Layers are built in dependency order per `spec/LAYERS.md`. Each layer gets its own PR. Dependent layers cannot be started until their upstream PRs are merged.

Parallel layers (same number across tracks) can be built simultaneously — spawn one agent per layer branch.

**Always pass `isolation: "worktree"` when spawning agents with the Agent tool.** This gives each agent an isolated git worktree so parallel agents cannot read or overwrite each other's in-progress files. Without worktree isolation, concurrent agents corrupt each other's work and mix unrelated changes into the same commit. This is non-negotiable for any multi-agent build.

## Testing

Tests use Playwright against the locally-running dev server (`npm run dev`).

- Tests live in `tests/` at the repo root
- Run all tests: `npx playwright test`
- Each layer's acceptance criteria should have corresponding Playwright test coverage before that layer's PR merges
- For pure data/schema layers (no UI), TypeScript compile + Zod `safeParse` on the sample data counts as the test

Claude should write or update tests as part of every implementation PR — not as a separate follow-up.

## Progress tracking

All layer progress is tracked in GitHub Issue #14:
https://github.com/Kaqemeex/leagues-ui/issues/14

The issue body contains a checklist of all 30 layers (6 tracks × 5 layers). Update it whenever a layer PR merges using the GitHub API:

```bash
# Fetch current issue body
BODY=$(gh api repos/Kaqemeex/leagues-ui/issues/14 --jq '.body')

# Edit the body string to check off the completed layer, then update:
gh api repos/Kaqemeex/leagues-ui/issues/14 \
  --method PATCH \
  --field body="$UPDATED_BODY"
```

**Claude must update issue #14 when merging any implementation PR** — check off the layer in the checklist and add a one-line note with the PR number and merge date. Do this as part of the merge step, not as a follow-up.
