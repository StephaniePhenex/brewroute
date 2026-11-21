# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

BrewRoute is a seasonal café-crawl app (map discovery, check-in "stamps", tasting-note archive, AI route concierge, deterministic end-of-season raffle). The repo is currently a **fresh `create-next-app` scaffold** (Next.js 15 App Router, React 19, TypeScript strict, Tailwind v4) plus specs in `docs/`. Almost nothing in the specs is implemented yet: Supabase, auth, Zod, Leaflet, the Claude Agent SDK, Vitest, and Playwright are planned but **not installed**.

Note: `~/CLAUDE.md` describes an unrelated project (Star-Office-UI) and does not apply here.

## Commands

```bash
npm run dev           # next dev --turbopack (http://localhost:3000)
npm run build         # next build --turbopack
npm run lint          # eslint (flat config: next/core-web-vitals + next/typescript + prettier)
npm run format        # prettier --write .
npm run format:check
```

No test runner is configured yet. The spec calls for Vitest (unit: `drawWinners`, Zod schemas, route pruner) and Playwright (e2e: `302`/`403`/`409` paths), with a ≥ 70% coverage target.

Env vars: copy `.env.example` → `.env.local` (Supabase URL/anon/service-role keys, `AUTH_SECRET`, `ANTHROPIC_API_KEY`).

## Specs are the source of truth

Read the relevant doc before implementing a feature — they are detailed and prescriptive:

- `docs/ARCHITECTURE.md` — route tree, middleware/RBAC matrix, DB schema, Server Action contracts (with HTTP codes), Zod boundaries, concierge tool interfaces, raffle algorithm. Items marked `[TODO: Teammate to finalize]` are intentionally undecided (Auth.js vs Clerk, RLS DDL, seed hash, etc.) — ask rather than invent.
- `docs/user_stories.md` — acceptance criteria per story (AC numbers), including exact UI behaviors and status codes.
- `docs/Design.md` — design tokens (colors, fonts, borders, radii, hard-offset shadows) in YAML front matter, plus the "color-as-reward" mechanic.
- `docs/prd.md` — problem, personas (`ADMIN` Organizer, `USER` Explorer), value prop.

`docs/` is excluded from Prettier.

## Key architectural rules (from the specs)

- **Roles & route protection:** `/` is public; `/stamp` and `/concierge` require a session; `/admin/*` requires `ADMIN`. `middleware.ts` redirects missing sessions (`302` to Google OAuth, `callbackUrl` = requested path) and returns `403` for `USER` on admin routes. Server Actions **re-check the session and role on every call** — UI state is never the authority.
- **Server Action order:** Zod validation → RBAC → SQL. `400` returns inline field errors (modal stays open).
- **Active season:** exactly one `seasons` row with `status = ACTIVE`; setting a season active archives the previous one.
- **Soft delete:** cafés use `deleted_at`; live views omit them but their reviews remain and render the café as `"(retired)"`.
- **Stamps:** a stamp = a distinct café reviewed in a season (`COUNT(DISTINCT cafe_id)`); repeat reviews are stored but add no stamp. Raffle eligibility compares this to `min_checkins`.
- **Raffle is deterministic** and shared by preview (no write), run (persist; `409` if already drawn), and verify (replay `pool_snapshot`): sort eligible ids → hash `public_seed` → seed `mulberry32` → Fisher–Yates → take `min(winnerCount, pool.length)`. Raffle config is locked after draw.
- **Concierge:** the three tools (`getSeasonalCafes` → `searchCafeReviews` → `calculateRouteOrder`) run in order; scoring, pruning to the time budget, and nearest-neighbour ordering live in **tool code, not the model**. Formulas and constants (score weights, Haversine × 1.25, 4.8/14 km/h, 20 min per stop) are in `docs/ARCHITECTURE.md` §4.
- **Color-as-reward UI:** storefront, map pin, and passport card stay grayscale until stamped, then transition (`500ms ease`) to the café's pastel, cycling by `index % 4`.

## Conventions

- Path alias `@/*` → repo root.
- Prettier: double quotes, semicolons, `trailingComma: "es5"`.
