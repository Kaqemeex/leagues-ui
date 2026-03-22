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

## Implementation layers

Layers are built in dependency order per `spec/LAYERS.md`. Each layer gets its own PR. Dependent layers cannot be started until their upstream PRs are merged.

Parallel layers (same number across tracks) can be built simultaneously — spawn one agent per layer branch.

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
