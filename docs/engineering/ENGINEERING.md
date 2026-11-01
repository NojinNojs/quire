# How work happens in Quire

Written down so the process is not a mood. Every rule below has a reason, and the reason is the part
that matters.

## 1. One branch, one issue

`<type>/<slug>`, where type is `feat`, `fix`, `chore`, `refactor`, `docs` or `test`, and the slug names
the issue. Examples: `feat/shelf-screen`, `fix/streak-month-rollover`.

A branch that closes two issues is two branches. The only exception is a stacked branch, where one
change genuinely cannot compile without the one under it, and then the PR says so in its body.

Parallel work uses git worktrees under `.worktrees/`, one per branch, with **declared file
ownership** in the brief. Two workers never touch the same file; if they must, they run in sequence.

## 2. Commit messages

`<type>(<scope>): <what changed>`, imperative, lower case, no full stop.

```
feat(catalog): normalise catalogue language codes
fix(streak): refill the restore quota in a new month
```

Forbidden: `wip`, `fix stuff`, `update`, and messages that describe the file instead of the change.
The `commit-msg` hook rejects them.

## 3. The gate is the only definition of green

`npm run gate` runs, in order: biome, typecheck, unit tests, build, the database smoke test against
the local Supabase, and the Playwright suite. It must be green on your branch before a PR and again on
`main` after the merge.

There is no hosted CI. GitHub Actions cannot run on this account, so the gate runs locally and its
**real output is pasted into the PR**. A screenshotted claim is not evidence; the text is.

## 4. A pull request carries evidence

Every PR uses the template and answers three questions:

1. What changed, and which issue it closes.
2. How it was verified, with the gate output and what was clicked in a browser.
3. What is still missing, under `Known gaps`, instead of pretending.

A PR without evidence is not reviewed. It is sent back.

## 5. Merge rules

- Squash or rebase only. Linear history on `main`, enforced by branch protection.
- No force pushes to `main`, no direct commits to `main`, no branch deletion by hand.
- The author merges after the reviewer has read the diff, not after the branch goes green.
- After merging, the issue gets a comment with the merge commit and is closed. The project board moves
  the item to Done, so the board never lies.

## 6. Reviewing

Review in this order, because that is the order failures cost money:

1. **Correctness**: does it do what the issue says, and what happens when the input is wrong?
2. **Data and security**: does it respect RLS, does it invent a default instead of leaving a field empty?
3. **Tests**: do they fail if the behaviour regresses, or do they only describe the happy path?
4. **Craft**: tokens instead of raw values, no em dash, radius at most 3, English copy, mobile at 390.
5. **Evidence**: does the pasted gate output actually come from this branch?

## 7. Releases

`npm run release <version>` verifies, builds, bumps, tags and pushes the tag. The changelog is
generated from conventional commits, never hand written. A release notes file is attached to the tag.

## 8. Documents before code

The product has seven documents, in order: PRD, TRD, app flow, design brief, design system, schema,
implementation plan. A feature that changes behaviour updates the document it contradicts in the same
PR. A document that is wrong is worse than no document.

## 9. Decisions worth remembering

Architecture decisions live in `docs/adr/` as short records: context, decision, consequence. One file
per decision, numbered, never rewritten after the fact. If a decision is reversed, a new record
supersedes it and says so.
