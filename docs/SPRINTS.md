# BrewRoute Sprint Plan

Pair plan for `StephaniePhenex/brewroute`. Two sprints. Sprint 1 is two independent tracks. Sprint 2 integrates those tracks, then runs exactly two features in separate git worktrees.

Source of truth: `CLAUDE.md`, `docs/prd.md`, `docs/user_stories.md`, `docs/Design.md`, `docs/ARCHITECTURE.md`.

## Current baseline

The repo is the Next.js 15.5.29 App Router scaffold (`strict: true`, Tailwind v4, no `src/`).

| Present | Not present yet |
| :--- | :--- |
| `app/layout.tsx`, `app/page.tsx`, `app/globals.css` (default Geist fonts and starter page) | `middleware.ts`, `lib/`, `supabase/`, `components/` |
| `docs/prd.md`, `docs/user_stories.md`, `docs/Design.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md` | `app/stamp`, `app/concierge`, `app/admin` |
| `.claude/settings.json` | Vitest, Playwright, Leaflet, Supabase, Clerk |

`docs/ARCHITECTURE.md` still has `[TODO: Teammate to finalize]` markers for SQL DDL / RLS, the auth session shape, and the raffle seed hash. Sprint 1 Backend closes those markers.

## Pair ownership

| | Partner A — Backend / Infra | Partner B — Frontend / UI |
| :--- | :--- | :--- |
| Sprint 1 | Schema, RLS, auth middleware, raffle engine | Tokens, fonts, storefronts, EXPLORE shell |
| Sprint 2 integration | Check-in server contract, organizer actions, CI | Check-in drawer, review archive, organizer screens except raffle |
| Sprint 2 worktree | Issue 12 — raffle dashboard | Issue 11 — concierge |

Neither partner pushes to `main`. Branches are `feat/issue-1-<slug>` through `feat/issue-12-<slug>`.

### File boundary

Sprint 1 tracks do not edit the same feature files. `package.json` and `package-lock.json` are the only shared files. Add dependencies in separate PRs and rebase. Do not edit them during the Sprint 2 worktree window except for the concierge SDK (Issue 11 only).

| Path | Sprint 1 owner |
| :--- | :--- |
| `supabase/**`, `docs/ARCHITECTURE.md` (DDL / RLS sections), `middleware.ts`, `lib/auth/**`, `app/sign-in/**`, `lib/raffleEngine.ts`, `lib/raffleEngine.test.ts` | Partner A |
| `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `components/storefront/**`, `components/explore/**`, `components/map/**`, `lib/types/**`, `lib/mocks/**` | Partner B |

## PR rules (every issue)

Review with **C.L.E.A.R.** before merge:

| | Gate |
| :--- | :--- |
| **C**orrectness | Listed `AC X.Y` items pass. Status codes match `docs/user_stories.md`. |
| **L**ayering | The diff stays inside this issue's owned paths. |
| **E**vidence | Tests cover the AC. Strict TDD issues contain a `test:` commit before any `feat:` commit. `lib/` logic stays at or above 90% coverage. Repo-wide target is 70%. |
| **A**ccess | `302` / `403` / `409` are enforced on the server. Inputs use Zod. No `.env` files. Admin checks are not UI-only. |
| **R**eadability | TypeScript strict, no `any`. Ink `#3B2621`, cream `#F5EFE6`, hard-offset shadows, fonts via `next/font` only. |

Paste this at the end of every PR:

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

Strict TDD (`CLAUDE.md`): commit a failing Vitest test mapped to the AC (`test:`), then the minimum implementation (`feat:`), then cleanup (`refactor:`). Issues marked **Strict TDD** below follow that order. Others still need tests; they do not need the red commit first.

## Sprint 1 — Separate tracks

**Goal:** Partner A can demonstrate a Supabase schema, a `302` / `403` gate, and a pure raffle draw. Partner B can demonstrate the Wes Anderson EXPLORE streetscape and a CartoDB Positron map from typed mocks. No live check-in, no admin CRUD, no concierge, no persisted raffle.

**Planning checklist**

- [ ] Milestones `Sprint 1` and `Sprint 2` exist on `StephaniePhenex/brewroute`.
- [ ] Each issue below has a milestone, owner, and branch name.
- [ ] Partners confirm the file boundary table and do not open PRs that cross it.
- [ ] Partner A replaces the architecture DDL / RLS TODOs. Partner B does not edit that section.
- [ ] EXPLORE reads `lib/mocks/` only. It does not import Supabase.
- [ ] `CityMap` accepts an optional route overlay prop so Sprint 2 concierge does not edit the map component.

### Backend track (Partner A)

#### Issue 1 — Finalize Supabase DDL and RLS

- **Milestone:** Sprint 1
- **Branch:** `feat/issue-1-supabase-ddl-rls`
- **Owns:** `supabase/migrations/**`, `docs/ARCHITECTURE.md` (replace the DDL / RLS TODO only)
- **Does not edit:** `app/**`, `components/**`, `lib/raffleEngine.ts`
- **Acceptance criteria:**
  - AC 1.5 / AC 1.6 — `seasons.status` is `DRAFT | ACTIVE | ARCHIVED`; a partial unique index allows exactly one `ACTIVE` row.
  - AC 1.5 — `public_seed` can store `<NAME-SLUG(≤16)>-<YEAR>`.
  - AC 2.2 — `cafes.name` ≤ 80, lat ∈ [−90, 90], lng ∈ [−180, 180], `tags` non-empty.
  - AC 2.5 / AC 2.7 — `cafes.deleted_at` is nullable. No hard-delete policy for cafés.
  - AC 3.2 / AC 3.5 — `public_seed`, `pool_snapshot`, `raffle_drawn_at`, `winners` exist.
  - AC 5.2 — review scores are integers 1–5; `note` length is enforced in the database or documented as action-level Zod (state which).
  - RLS matches `docs/ARCHITECTURE.md`: `anon` reads live data; `USER` inserts and deletes only their reviews; `ADMIN` mutates seasons and cafés.
- **Done when:** migrations apply on a local Supabase project and the architecture TODO for DDL / RLS is gone.

#### Issue 2 — Auth and RBAC middleware (`302` / `403`)

- **Milestone:** Sprint 1
- **Branch:** `feat/issue-2-auth-rbac-middleware`
- **Owns:** `middleware.ts`, `lib/auth/**`, `app/sign-in/**` (Clerk; replaces the Auth.js-only `app/api/auth/**`)
- **Does not edit:** explorer or admin UI, `lib/raffleEngine.ts`
- **Acceptance criteria:**
  - AC 1.1 — a signed-in `USER` hitting `/admin/*` gets `403`.
  - AC 5.1 — no session on a protected explorer path or check-in entry returns `302` to `/sign-in?redirect_url=<path+query>` (Clerk, Google), which returns to the café view after sign-in.
  - AC 6.4 — an unauthenticated delete attempt is a `302` to the same OAuth start (action wiring can return the redirect contract; the archive UI is Sprint 2).
  - Architecture route table: `/` stays public; `/stamp` and `/concierge` require a session; `/admin/*` requires `ADMIN`.
- **Done when:** `lib/auth/rbac.ts` is a pure function covered by Vitest (`next` vs `302` vs `403`) and `middleware.ts` calls it. Auth.js vs Clerk is chosen and the architecture session TODO is updated. No admin or stamp pages are built here.

#### Issue 3 — Deterministic raffle engine (**Strict TDD**)

- **Milestone:** Sprint 1
- **Branch:** `feat/issue-3-raffle-engine`
- **Owns:** `lib/raffleEngine.ts`, `lib/raffleEngine.test.ts`
- **Does not edit:** `app/admin/**`, Supabase clients, UI
- **Acceptance criteria:**
  - AC 3.4 — sort eligible ids lexicographically, shuffle with Fisher–Yates driven by `mulberry32` seeded from a stable hash of `public_seed`, take `min(winnerCount, pool.length)` with no out-of-bounds read.
  - AC 3.3 — same seed and same pool always return the same winners. This function does not write.
  - AC 3.7 — a short non-empty pool returns everyone; an empty pool returns no ids.
  - AC 3.8 — `verifyDraw` recomputes from `pool_snapshot`, `public_seed`, and `winner_count` and reports match or mismatch.
- **Done when:** the first commit on the branch is a failing `test:` commit for those AC items, followed by `feat:` and any `refactor:`. `lib/raffleEngine.ts` coverage is ≥ 90%. Persistence, `409`, and ticket UI stay in Issue 12.

### Frontend track (Partner B)

Mocks only. A café passed into the UI is a TypeScript interface in `lib/types/`, populated from `lib/mocks/`. No Supabase import.

#### Issue 4 — Design tokens and five Google fonts

- **Milestone:** Sprint 1
- **Branch:** `feat/issue-4-design-tokens-fonts`
- **Owns:** `app/globals.css`, `app/layout.tsx`
- **Does not edit:** `middleware.ts`, `supabase/**`, `lib/raffleEngine.ts`, `app/page.tsx`
- **Acceptance criteria:**
  - Design YAML colors, radii, and hard-offset shadows are Tailwind v4 `@theme` tokens. Ink is `#3B2621`. Cream is `#F5EFE6`. No `shadow-sm` / `shadow-md` / `shadow-lg`.
  - AC 1.8 tokens exist for badge colors: `ACTIVE` mustard `#D4A84F`, `ARCHIVED` slate `#6B8299`, `DRAFT` paper `#F5EFE6`.
  - `app/layout.tsx` loads Fredoka, Jost, Cormorant Garamond, Space Mono, and Plus Jakarta Sans through `next/font/google`. Geist and any runtime `@import` for fonts are removed.
- **Done when:** the root layout applies those fonts and the starter page inherits the paper canvas. Feature UI is not built in this issue.

#### Issue 5 — Four-stop storefront SVG components

- **Milestone:** Sprint 1
- **Branch:** `feat/issue-5-storefront-svgs`
- **Owns:** `components/storefront/**`
- **Does not edit:** `app/page.tsx` (Issue 6 mounts the component), backend paths
- **Acceptance criteria:**
  - AC 2.8 / Design §2 — `index % 4` cycles Warm Cream, Dusty Rose, Muted Sage, and Warm Ochre, including the frame, trim, and awning details in `docs/Design.md`. `viewBox="0 0 320 274"`.
  - AC 4.2 — a `stamped` prop renders full pastel; `stamped={false}` renders muted grayscale (`lockedBg` / `grayscale(0.95)`).
  - Reduced motion disables the stamp animation.
- **Done when:** the four variants render from props in isolation (a Story-free preview page is unnecessary). No map and no check-in form.

#### Issue 6 — EXPLORE streetscape and CartoDB Positron map shell

- **Milestone:** Sprint 1
- **Branch:** `feat/issue-6-explore-map-shell`
- **Owns:** `app/page.tsx`, `components/explore/**`, `components/map/**`, `lib/types/**`, `lib/mocks/**`
- **Does not edit:** `middleware.ts`, `supabase/**`, `lib/raffleEngine.ts`, `components/storefront/**` internals (import them only)
- **Acceptance criteria:**
  - AC 4.1 — masthead shows `EXPLORE • STAMP • CONCIERGE` with EXPLORE as the burgundy pill. The counter reads `SIGNED OUT` for the mock signed-out state and `X/Y STAMPS` when the mock user is signed in.
  - AC 4.2 / AC 4.4 — one storefront per mock café, then a season title, mustard progress bar, and a `45fr / 55fr` map-and-passport split.
  - AC 4.5 — tag filter is `AND`. Non-matching pins and cards hide. Non-matching storefronts use opacity `0.38`. `All` resets.
  - AC 4.6 / AC 4.7 — stamped vs unstamped pin and card styles; hover or focus highlights storefront, pin, and card together.
  - AC 4.8 — the dossier drawer shows an average, or `No ratings yet` when there are zero reviews (never `NaN`), plus mock notes and Maps links with `rel="noopener noreferrer"`. The check-in form is not submitted in this sprint.
  - Leaflet uses CartoDB Positron (`light_all`) with a sepia treatment. Pins are keyboard focusable. `CityMap` takes an optional route overlay so Issue 11 does not modify this file.
- **Done when:** `/` renders entirely from `lib/mocks/explore.ts`. The map is client-only (`ssr: false`).

### Sprint 1 rituals

**Async standups** (three per partner; post in the issue or the pair channel)

| # | Partner A — yesterday / today / blocker | Partner B — yesterday / today / blocker |
| :--- | :--- | :--- |
| 1 | | |
| 2 | | |
| 3 | | |

**Retrospective**

- What stayed inside the file boundary?
- Which PR crossed a path it did not own?
- What will Sprint 2 integrate first?

## Sprint 2 — Integration, then one worktree pair

**Goal:** Real check-ins, the review archive, and organizer season/café tools read and write Supabase under the Sprint 1 middleware. CI runs typecheck, lint, unit tests, and the critical Playwright paths. After those PRs are on `main`, Partner B and Partner A build the concierge and the raffle dashboard at the same time, in two worktrees, with no shared files.

**Planning checklist**

- [ ] Sprint 1 PRs are merged. `main` has schema, middleware, raffle engine, tokens, storefronts, and the mock EXPLORE shell.
- [ ] Issue 7, Issue 8, Issue 9, and Issue 10 merge before either worktree is created.
- [ ] Parallel issues are only Issue 11 and Issue 12.
- [ ] Worktrees are created from the same `origin/main` with the commands at the end of this section.
- [ ] Partner A does not edit `app/concierge/**` or `lib/concierge/**`. Partner B does not edit `app/admin/raffle/**`.

Merge Issue 7, then Issue 8, then Issue 9, then Issue 10 to `main`. Issue 11 and Issue 12 start only after those four are on `main`.

### Issue 7 — Check-in ratings (**Strict TDD**)

- **Milestone:** Sprint 2
- **Owner:** Partner A owns `lib/validations/review.ts`, `app/actions/reviews.ts`, and their tests. Partner B owns `components/dossier/**` after the action tests are green. Same branch, sequential commits, not a worktree pair.
- **Branch:** `feat/issue-7-check-in-ratings`
- **Owns:** those paths plus the progress and stamp updates in `components/explore/**` required to show live stamp state
- **Does not edit:** `app/admin/**`, `app/concierge/**`, `lib/raffleEngine.ts`, `app/stamp/**`
- **Acceptance criteria:**
  - AC 5.1 — signed-out check-in starts Google OAuth with `302` and returns to that café.
  - AC 5.2 — each of `coffee_quality`, `ambiance`, and `workspace_friendliness` is an integer 1–5; `note` is 10–500 after trim; `<` and `>` are stripped. Failure is `400` with inline errors and an `n/500` counter.
  - AC 5.3 — success is `201`, stored on the active season, with stamp confirmation and an updated `X/Y STAMPS` counter and progress bar.
  - AC 5.4 — the first check-in at a café transitions storefront, pin, and card from grayscale to pastel in `500ms`, unless reduced motion is on.
  - AC 5.5 — another review of a stamped café is `201` and does not increase the unique-café count.
  - AC 5.6 / AC 6.5 — the stamp header pill shows the four raffle sentences, and sign-out returns `200` and `SIGNED OUT`.
- **Done when:** a `test:` commit fails on the Zod and `createReview` cases before the `feat:` commit. The drawer submits to the server action.

### Issue 8 — Season-filtered review archive

- **Milestone:** Sprint 2
- **Owner:** Partner B
- **Branch:** `feat/issue-8-review-archive`
- **Owns:** `app/stamp/**`, `components/archive/**`, `lib/queries/reviews.ts`
- **Does not edit:** `app/actions/reviews.ts` create path (call `deleteReview` added in this issue's own `app/stamp/actions.ts` if the check-in file must stay untouched), `app/admin/**`, `app/concierge/**`
- **Acceptance criteria:**
  - AC 6.1 — passport stamp book above the archive; one Season `<select>` (`All seasons` plus each season and status); live `N results`.
  - AC 6.2 — newest first; café name or `(retired)`; season, date, note, tags, author or `(you)`, and `C/A/W` scores.
  - AC 6.3 — deleting one's own review returns `200` and recomputes stamps and eligibility.
  - AC 6.4 — deleting someone else's review returns `403`. Signed-out delete starts OAuth (`302`).
- **Done when:** the archive reads Supabase and the retired label comes from `cafes.deleted_at`, not a second copy of the café name.

### Issue 9 — Organizer season and cafe tools (**Strict TDD**)

- **Milestone:** Sprint 2
- **Owner:** Partner A owns `lib/validations/season.ts`, `lib/validations/cafe.ts`, `app/admin/actions/seasons.ts`, `app/admin/actions/cafes.ts`, and tests. Partner B owns `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/cafes/**`, and `components/admin/**`.
- **Branch:** `feat/issue-9-organizer-admin`
- **Does not edit:** `app/admin/raffle/**`, `lib/raffleEngine.ts`, `app/concierge/**`, `app/stamp/**`
- **Acceptance criteria:**
  - AC 1.1 — season and café mutations return `403` for a non-`ADMIN`.
  - AC 1.2–AC 1.8 — create-season modal, `400` for a name under 3 characters or a count that is not an integer ≥ 1, `201` as `DRAFT` with the default seed, `200` set-active that archives the previous active season, disabled buttons, mustard / slate / paper badges.
  - AC 2.1–AC 2.10 — map click fills coordinates to 4 decimal places, Zod `400`, `201` create, `200` update, custom tags, soft delete and restore, `(retired)` reviews preserved, stop order and the 4-color cycle, streetscape tab, organizer preview drawer with no check-in form.
- **Done when:** failing validation tests land in a `test:` commit before implementation. Activating a season is one transaction (ADR-2).

### Issue 10 — CI/CD pipeline and Playwright E2E

- **Milestone:** Sprint 2
- **Owner:** Partner A
- **Branch:** `feat/issue-10-ci`
- **Owns:** `.github/workflows/ci.yml`, the `typecheck`, `test`, `test:coverage`, and `test:e2e` scripts in `package.json`
- **Does not edit:** feature routes
- **Acceptance criteria:**
  - Pull requests run `npm run typecheck`, `npm run lint`, `npm run test`, and coverage. The workflow fails under 70% repo coverage.
  - Playwright covers the critical paths named in `CLAUDE.md`: OAuth `302`, stamp unlock, archive filter, admin `403`, raffle `409`. Specs that do not have UI yet are skipped with an explicit comment and enabled by Issue 11 and Issue 12.
  - `npm audit` runs in CI. `.env*` is not uploaded.
- **Done when:** a green run is linked from the PR. Vercel preview is confirmed for `main` without committing secrets.

### Parallel worktree pair

Create these only after Issue 7, Issue 8, Issue 9, and Issue 10 are on `origin/main`. These are the only two Sprint 2 issues that run side by side.

| | Issue 11 | Issue 12 |
| :--- | :--- | :--- |
| Issue | AI Route and Tasting Concierge | Organizer raffle audit dashboard |
| Owner | Partner B | Partner A |
| Owns | `app/concierge/**`, `lib/concierge/**` | `app/admin/raffle/**` (page, UI, and Server Actions in this folder) |
| May add | `@anthropic-ai/sdk` in `package.json` on this branch only | nothing in `package.json` |
| Must not edit | `app/admin/**`, `lib/raffleEngine.ts`, `components/map/**` (pass a route query into the Sprint 1 overlay prop) | `app/concierge/**`, `lib/concierge/**`, `lib/raffleEngine.ts` (import it; do not change the algorithm) |

```bash
git fetch origin
git worktree add -b feat/issue-11-ai-concierge ../brewroute-concierge origin/main
git worktree add -b feat/issue-12-raffle-dashboard ../brewroute-raffle origin/main
```

Run the concierge dev server from `../brewroute-concierge` and the raffle dev server from `../brewroute-raffle` on a different port (`npm run dev -- --port 3001`). Remove the worktrees after both PRs merge:

```bash
git worktree remove ../brewroute-concierge
git worktree remove ../brewroute-raffle
```

#### Issue 11 — AI Route and Tasting Concierge

- **Milestone:** Sprint 2
- **Branch:** `feat/issue-11-ai-concierge`
- **Acceptance criteria:**
  - AC 7.1 — prompt, mood chips (default `Quiet / Reading`), flavor chips (default `Fruity / floral`), time budget `60 | 90 | 120 | 180` (default `120`), mode `foot | bike`.
  - AC 7.2 — visible step log, in order: `getSeasonalCafes`, `searchCafeReviews`, `calculateRouteOrder`. Tools are read-only queries. Tag match falls back to all live cafés in the season.
  - AC 7.3 — score is `(avgRating ?? 3) + 1.2 * matchingNotes + 0.6 * tagOverlap`. Keep the top 4, then drop the lowest score until `travelMinutes + 20 * stops <= timeBudget`, always leaving one stop. Haversine × `1.25`. Foot `4.8 km/h`, bike `14 km/h`.
  - AC 7.4 — itinerary shows duration, kilometers, ordered stops, leg distances, and a cited note or rating.
  - AC 7.5 — **Show route on map** goes to `/?route=…`, clears tag filters, highlights stop 1, draws the dashed burgundy polyline (`stroke-dasharray="6 4"`), and shows a dismissible `Concierge route plotted` banner. Implement the handoff by the query param the Sprint 1 map already accepts.
- **Done when:** scoring and pruning are unit-tested in `lib/concierge/`. The model does not compute the order.

#### Issue 12 — Organizer raffle audit dashboard

- **Milestone:** Sprint 2
- **Branch:** `feat/issue-12-raffle-dashboard`
- **Acceptance criteria:**
  - AC 3.1 — eligibility is `COUNT(DISTINCT cafe_id) >= min_checkins`. The table shows total reviews, unique cafés (repeat visits noted), and `Winner`, `Eligible`, or `N short`.
  - AC 3.2 / AC 3.6 — after `raffle_drawn_at` is set, changes to `min_checkins`, `winner_count`, or `public_seed`, and a second run, return `409` and leave the published result in place.
  - AC 3.3 — preview uses `drawWinners` and writes nothing.
  - AC 3.5 — run returns `200` and stores `winners`, `pool_snapshot`, and `raffle_drawn_at`. Tickets render `BR-<SEASON>-00N`.
  - AC 3.7 — short-pool and empty-pool copy matches the user story.
  - AC 3.8 — verify shows `✓` or `✗` against the stored winners.
  - AC 1.1 — a non-`ADMIN` call returns `403`.
- **Done when:** Server Actions in `app/admin/raffle/actions.ts` call `lib/raffleEngine.ts` and the `409` paths are tested. The raffle page is the `1/2` seed-and-audit layout from `docs/Design.md`.

### Sprint 2 rituals

**Async standups** (three per partner)

| # | Partner A — yesterday / today / blocker | Partner B — yesterday / today / blocker |
| :--- | :--- | :--- |
| 1 | | |
| 2 | | |
| 3 | | |

**Retrospective**

- Did the worktrees touch the same file?
- Which AC still fails on `main`?
- What should the next milestone cover (seed data, production auth provider, coverage gaps)?

## Issue index

| Issue | Milestone | Owner | Branch | Strict TDD |
| :--- | :--- | :--- | :--- | :--- |
| Issue 1 | Sprint 1 | A | `feat/issue-1-supabase-ddl-rls` | No |
| Issue 2 | Sprint 1 | A | `feat/issue-2-auth-rbac-middleware` | No |
| Issue 3 | Sprint 1 | A | `feat/issue-3-raffle-engine` | Yes |
| Issue 4 | Sprint 1 | B | `feat/issue-4-design-tokens-fonts` | No |
| Issue 5 | Sprint 1 | B | `feat/issue-5-storefront-svgs` | No |
| Issue 6 | Sprint 1 | B | `feat/issue-6-explore-map-shell` | No |
| Issue 7 | Sprint 2 | A, then B | `feat/issue-7-check-in-ratings` | Yes |
| Issue 8 | Sprint 2 | B | `feat/issue-8-review-archive` | No |
| Issue 9 | Sprint 2 | A, then B | `feat/issue-9-organizer-admin` | Yes |
| Issue 10 | Sprint 2 | A | `feat/issue-10-ci` | No |
| Issue 11 | Sprint 2 | B | `feat/issue-11-ai-concierge` | No |
| Issue 12 | Sprint 2 | A | `feat/issue-12-raffle-dashboard` | No |

Issue 11 and Issue 12 are the only `git worktree` pair. They start after Issue 7, Issue 8, Issue 9, and Issue 10 are merged to `main`.
