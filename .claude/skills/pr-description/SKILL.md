---
name: pr-description
description: Automatically inspect the current branch's GitHub Issue requirements, sprint layering rules, commit history, and test results to generate a standardized BrewRoute PR title and description with C.L.E.A.R. checklist and AI Disclosure.
---

# BrewRoute PR Description Generator

When invoked (via `/pr-description` or when asked to write/create a Pull Request), execute these steps in order without modifying application code:

1. **Identify Issue & Branch Context:**
   - Run `git branch --show-current`, `git log main..HEAD --oneline`, and `git diff main --stat` to inspect all commits and touched files on the current branch.
   - Extract the issue number `<N>` from the branch name (e.g., `feat/issue-6-...` -> `6`) or ask if ambiguous.
   - Run `gh issue view <N> --json title,body,labels` (and check `docs/user_stories.md` if referenced) to retrieve the exact Acceptance Criteria (AC) for Issue `#<N>`.

2. **Check Architectural & Layering Compliance:**
   - Read `docs/SPRINTS.md` and `docs/ARCHITECTURE.md` to verify whether all modified paths fall within Issue `#<N>`'s assigned directories.
   - Note any justified cross-boundary helpers, shared components, new `.env*` variables, or dependency changes (`package.json`) so they can be documented explicitly.

3. **Verify Quality Gates:**
   - Check recent test/lint/typecheck status from the session or run `npm run typecheck` / `npm test` if unverified, noting exact test counts, coverage metrics, and any manual browser/visual checks performed.

4. **Draft the Standardized PR Output:**
   Output a ready-to-copy **PR Title** (Conventional Commits format ending with `(#<N>)`) and **PR Description** containing:
   - `Closes #<N>`
   - **Summary:** Concise bullet points mapped directly to the Issue's Acceptance Criteria.
   - **Layering & Environment Notes:** Explicit callouts for any out-of-scope file paths, dependency additions, or required environment variables (e.g., `NEXT_PUBLIC_CARTO_BASEMAPS_KEY`, Supabase keys).
   - **C.L.E.A.R. + AI Disclosure:** Re-read the "Paste this at the end of every PR" block in `docs/SPRINTS.md` and copy it **verbatim** as the last section: same headings, same labels, same order. Do not rename, add, or drop a label. Fill in each label using the gate definitions in the `SPRINTS.md` C.L.E.A.R. table. The template is currently:

     <!-- prettier-ignore -->
     ```md
     ## C.L.E.A.R.
     - Correctness:
     - Layering:
     - Evidence:
     - Access:
     - Readability:

     ## AI Disclosure
     - % AI-generated:
     - Tools/Models used:
     - Human verification applied:
     ```

     - **Correctness:** which `AC X.Y` items pass, and their status codes per `docs/user_stories.md`.
     - **Layering:** whether the diff stays inside the Issue's owned paths; list every path outside them.
     - **Evidence:** test counts and coverage, plus the `test:` commit hash that comes before the `feat:` commit for Strict TDD issues.
     - **Access:** `302` / `403` / `409` enforced on the server, Zod inputs, no `.env` files, no UI-only admin checks (or `N/A` with a reason).
     - **Readability:** TypeScript strict with no `any`, ink `#3B2621`, cream `#F5EFE6`, hard-offset shadows, fonts via `next/font` only.
     - **Human verification applied:** include the workflow (`Explore → Plan → Implement → Commit`) and what a human actually checked.

     If `docs/SPRINTS.md` and this skill ever disagree, `SPRINTS.md` wins.

5. **Optional PR Creation:**
   - Ask whether to push the current branch and run `gh pr create` with the generated title and body (confirming the target base branch first if stacked on another feature branch).
