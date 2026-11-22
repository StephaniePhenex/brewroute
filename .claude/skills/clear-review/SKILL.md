---
name: clear-review
description: Review a GitHub Pull Request against its linked Issue acceptance criteria, BrewRoute security/architecture guardrails, and TDD commit history using the C.L.E.A.R. framework. Usage: /clear-review <pr-number>
argument-hint: "<pr-number>"
allowed-tools: Bash(gh pr view *), Bash(gh pr diff *), Bash(gh pr checks *), Bash(gh issue view *), Bash(git log *), Bash(git diff *), Bash(git status), Bash(npm run typecheck), Bash(npm run lint), Bash(npm run test:coverage), Read, Grep, Glob
---

# /clear-review — C.L.E.A.R. Pull Request Review

Review PR **#$ARGUMENTS** against its original GitHub Issue, `docs/user_stories.md` acceptance criteria, and the BrewRoute guardrails in `CLAUDE.md`.

> **Read-only guardrail:** NEVER post comments, submit `gh pr review`, approve, merge, close, label, or edit the PR or Issue on GitHub unless the user explicitly instructs you to post it in this conversation. Produce the review in the terminal only. Do not edit files, commit, or push.

If `$ARGUMENTS` is empty or not a number, stop and ask for the PR number.

---

## Step 1 — Extract Original Issue Requirements First

Do this **before** looking at code quality.

1. Fetch PR metadata:
   ```bash
   gh pr view $ARGUMENTS --json number,title,body,headRefName,baseRefName,closingIssuesReferences,commits,files
   ```
2. Identify the linked Issue number, in this order of precedence:
   1. `closingIssuesReferences[].number`
   2. `#N` / `Closes #N` / `Fixes #N` in the PR title or body
   3. `issue-N` in `headRefName` (e.g. `feat/issue-6-explore-map-shell` → `6`)

   If none is found, record "No linked Issue" as a **blocking issue** and continue with ACs inferred from the PR body.

3. Fetch the exact original Issue specification:
   ```bash
   gh issue view <issue-number> --json number,title,body,labels
   ```
4. Read the project specs and pull every Acceptance Criterion referenced by that Issue:
   - `docs/user_stories.md` — `AC X.Y` text (expand ranges like `AC 4.1–4.8` into each AC)
   - `docs/prd.md` — persona/role context
   - `docs/SPRINTS.md` — the Issue's sprint scope, owner, and file boundary
5. Build an explicit **Requirement Traceability Checklist** covering every requirement from **both** the GitHub Issue body and `docs/user_stories.md`. One line per atomic requirement; split compound ACs (e.g. AC 4.6 → pin color, card fill, badge, unstamped copy):
   ```
   [ ] Req 1 — (Issue #N) <requirement text>
   [ ] Req 2 — (AC 4.5) Tag filter uses AND logic; non-matching pins/cards hidden
   [ ] Req 3 — (AC 4.5) Non-matching storefronts dim to 38% opacity
   ...
   ```
   Note explicitly when the Issue marks an AC as out of scope or deferred.

---

## Step 2 — Inspect Code Diff & Audit via C.L.E.A.R.

1. Get the diff:
   ```bash
   gh pr diff $ARGUMENTS
   ```
   Use `Read`, `Grep`, and `Glob` on the checked-out files for full context when a hunk is insufficient.
2. Verify **every** checklist item against implementation **and** test files. Mark each `Pass`, `Partial`, or `Fail` with `file:line` evidence. A requirement only passes if it is implemented and covered by a test (or an explicit E2E note for Playwright-only journeys).
3. **If any requirement is missing or incomplete, the verdict MUST be `REQUEST CHANGES`.**

Then audit each C.L.E.A.R. dimension:

### C — Correctness & AC Alignment

- Exact HTTP status codes per `docs/ARCHITECTURE.md` §3: `201` create, `200` update/delete/activate, `302` unauthenticated USER mutation, `400` Zod failure, `403` RBAC/ownership, `409` raffle re-draw or locked config.
- Edge cases: 0 reviews → `"No ratings yet"` (never `NaN`); repeat check-ins at the same café don't inflate unique café count; `pool.length === 0` issues no tickets; `0 < pool.length < winner_count` → everyone wins; `min(winner_count, pool.length)` without out-of-bounds.

### L — Logic & Domain Guardrails

- Soft-delete only: cafés set/clear `deleted_at`; any `DELETE FROM cafes` / `.delete()` on cafés is blocking. Retired cafés render `"(retired)"` in the archive.
- Raffle is deterministic: lexicographic sort → hash `public_seed` → `mulberry32` → Fisher–Yates; persists `pool_snapshot`, `winners`, `raffle_drawn_at`.
- Concierge scoring (`avgRating ?? 3 + 1.2·notes + 0.6·tags`), pruning, Haversine × 1.25, and route order live in TypeScript tool code — **never delegated to the LLM**.
- Single ACTIVE season enforced in a transaction.
- Timestamps stored in UTC; displayed with `America/Vancouver` formatting.

### E — Error Handling & Security (OWASP)

- Server-side RBAC runs **before** any database access: `403` for non-ADMIN on `/admin/*` and season/café/raffle mutations, `403` for cross-user review deletion, `302` OAuth redirect when unauthenticated. Client-only hiding of buttons is blocking.
- All inputs validated with Zod (`lib/validations/`); text sanitized of `<` / `>`; parameterized queries only.
- No secrets / `.env*` in the diff; external map links use `rel="noopener noreferrer"`; no TypeScript `any`.

### A — Architecture & Scope Hygiene

- Changes stay inside the Issue's file boundary from `docs/SPRINTS.md` (e.g. `components/explore/**` & `components/map/**` for frontend vs. `supabase/**`, `middleware.ts`, `lib/auth/**`, `lib/raffleEngine.ts` for backend/raffle). Flag unrelated or cross-boundary edits, and unexplained `package.json` changes.
- Leaflet / `react-leaflet` imported only via `next/dynamic(..., { ssr: false })`.
- Server Components for reads, Server Actions / Route Handlers for mutations; pure logic in `lib/*.ts` (camelCase), components in `PascalCase.tsx`.
- Design rules: `#3B2621` ink, `#F5EFE6` cream, hard-offset 0-blur shadows (no `shadow-sm/md/lg`), rounded corners, fonts via `next/font/google` (no runtime `@import`), no prototype copy-paste.

### R — Red-Green-Refactor TDD & Checks

- Inspect commit order:
  ```bash
  git log --reverse --format='%h %s' <baseRefName>..<headRefName>
  ```
  (fall back to the `commits` array from `gh pr view` if the branch isn't local). A failing `test:` commit must precede the `feat:`/`fix:` commits it covers; `refactor:` comes after green. Missing RED commits are blocking.
- Run the quality gate and report actual output (do not claim a pass you didn't see):
  ```bash
  npm run typecheck
  npm run lint
  npm run test:coverage
  ```
  Coverage targets: pure `lib/` logic ≥ 90%, repo-wide ≥ 70%. Run `git status` first; if the PR branch is not the current checkout (or the tree is dirty), say so and state which tree the checks ran against.
- Report CI status for the PR head (failing required checks are blocking):
  ```bash
  gh pr checks $ARGUMENTS
  ```

---

## Step 3 — Structured Output (Read-Only)

Print the review in this exact structure:

```markdown
## PR #<n> — <title>

**Branch:** <head> → <base> · **Linked Issue:** #<n> <title>

### PR Summary

<2–4 sentences: what the PR does and which ACs it targets>

### Verdict: APPROVE | REQUEST CHANGES | COMMENT

### Requirement Traceability Checklist

| #   | Source   | Requirement | Status                         | Evidence                                    |
| --- | -------- | ----------- | ------------------------------ | ------------------------------------------- |
| 1   | Issue #N | ...         | ✅ Pass / ⚠️ Partial / ❌ Fail | `path/file.tsx:42`, `path/file.test.tsx:88` |

### C.L.E.A.R. Scorecard

| Dimension                        | Score (Pass/Warn/Fail) | Notes                               |
| -------------------------------- | ---------------------- | ----------------------------------- |
| C — Correctness & AC Alignment   |                        |                                     |
| L — Logic & Domain Guardrails    |                        |                                     |
| E — Error Handling & Security    |                        |                                     |
| A — Architecture & Scope Hygiene |                        |                                     |
| R — Red-Green-Refactor & Checks  |                        | typecheck / lint / coverage results |

### Blocking Issues

1. `file:line` — problem → required fix

### Non-Blocking Suggestions

- `file:line` — suggestion
```

**Verdict rules**

- `REQUEST CHANGES` — any requirement `Fail`/`Partial`, any failing check, missing RED commit, or any security/domain guardrail violation.
- `APPROVE` — every requirement passes, all checks green, no blocking issues.
- `COMMENT` — no blocking issues but open questions the author must answer (e.g. ambiguous AC scope).

End by asking whether the user wants the review posted to GitHub. Only if they explicitly say yes, post it with `gh pr review $ARGUMENTS --comment|--request-changes|--approve --body "<review markdown>"`.
