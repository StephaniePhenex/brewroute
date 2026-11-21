# BrewRoute Architecture

> Next.js App Router · TypeScript · Supabase (PostgreSQL) · Claude Agent SDK  
> Roles: `USER` (Explorer), `ADMIN` (Organizer). **Active season** = the single row with `status = ACTIVE`.  
> HTTP codes are Server Action / Route Handler results. Google OAuth via Auth.js or Clerk. UI state is never the authority.

## 1. Next.js App Router Directory & Route Protection

```
app/
  layout.tsx                  # root shell, next/font, providers
  page.tsx                    # PUBLIC   /              EXPLORE
  stamp/page.tsx              # USER     /stamp         STAMP
  concierge/page.tsx          # USER     /concierge     CONCIERGE
  admin/
    layout.tsx                # ADMIN gate for /admin/*
    page.tsx                  #          /admin         STREETSCAPE
    cafes/page.tsx            #          /admin/cafes   CAFÉS
    raffle/page.tsx           #          /admin/raffle  RAFFLE
  actions/                    # Server Actions: Zod, then RBAC, then SQL
  api/auth/[...nextauth]/     # OAuth start + callback
middleware.ts                 # session + role gate before RSC render
```

| Path | Who | No session | `USER` | `ADMIN` |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Public read | `200` | `200` | `200` |
| `/stamp`, `/concierge` | Explorer | Middleware `302` → Google OAuth | `200` | `200` |
| `/admin/*` | Organizer | Middleware `302` → Google OAuth | Middleware `403` | `200` |

**Middleware** matches `/stamp`, `/concierge`, and `/admin/:path*`.

- Missing session → `302` to the Google OAuth start URL. `callbackUrl` is the requested path so a check-in returns to that café.
- Session role `USER` on `/admin/*` → `403 Forbidden`. A signed-in Explorer cannot reach organizer pages.
- `/` is unmatched. Signed-out visitors get the grayscale streetscape, map, and passport; the header reads `SIGNED OUT`.

**Server Actions** load the session again on every call:

- No session on a `USER` mutation (`createReview`, `deleteReview`) → `302` OAuth. Public reads stay `200`.
- Role ≠ `ADMIN` on season, café, or raffle mutations → `403`.
- `USER` deleting another user's review → `403`. Deleting one's own review → `200` and stamp counts are recomputed.
- `signOut` → `200`. Storefronts, pins, and cards return to grayscale.

`[TODO: Teammate to finalize]` Auth.js vs Clerk session claims, the middleware `matcher`, and the OAuth `callbackUrl` shape.

## 2. PostgreSQL (Supabase) Database Schema & RLS Overview

Keys are `uuid`. Timestamps are `timestamptz`. Stored text has `<` and `>` stripped. `users`: `id` PK (OAuth subject), `role` (`USER` or `ADMIN`), `display_name` (the `"(you)"` label is rendered, not stored).

### `seasons`

| Column | Notes |
| :--- | :--- |
| `id` | PK. |
| `name`, `theme` | Name length ≥ 3 after trim. |
| `status` | `DRAFT` \| `ACTIVE` \| `ARCHIVED`. Exactly one `ACTIVE`. |
| `min_checkins`, `winner_count` | Integers ≥ 1. Locked once drawn. |
| `public_seed` | Default `<NAME-SLUG(≤16)>-<YEAR>`. Locked once drawn. |
| `pool_snapshot` | `jsonb`. Eligible user ids frozen at draw time. |
| `raffle_drawn_at` | Null until the raffle is finalized. |
| `winners` | `jsonb` ordered ids. Tickets render `BR-<SEASON>-00N`. |

Create inserts `DRAFT` and selects it as the managed season. **Set active** sets the target to `ACTIVE` and the previous `ACTIVE` row to `ARCHIVED`.

### `cafes`

| Column | Notes |
| :--- | :--- |
| `id` | PK. |
| `season_id` | FK → `seasons.id`. |
| `name` | Required, ≤ 80. |
| `address` | Required. |
| `latitude`, `longitude` | Numeric. Lat ∈ [−90, 90], lng ∈ [−180, 180]. |
| `tags` | `text[]`, at least one. |
| `sort_order` | Stop labels `01…`. Pastel cycle is `index % 4`. |
| `deleted_at` | Soft delete. **Remove** sets it (`200`); **Restore** clears it (`200`). |

Live maps, the streetscape, and the passport omit rows where `deleted_at` is set. Their reviews stay in the archive and the café name renders `"(retired)"`.

### `reviews`

| Column | Notes |
| :--- | :--- |
| `id` | PK. |
| `user_id` | FK → `users.id`. |
| `cafe_id` | FK → `cafes.id`. |
| `season_id` | FK → `seasons.id`. The active season at check-in. |
| `coffee_quality`, `ambiance`, `workspace_friendliness` | Integers ∈ [1, 5]. |
| `note` | Trimmed, 10–500 characters. |
| `created_at` | Archive order is newest first. |

Raffle eligibility is `COUNT(DISTINCT cafe_id)` for that user and season, compared with `min_checkins`. A second review of the same café is stored (`201`) and does not add a stamp.

### RLS

`[TODO: Teammate to finalize]` DDL (`CHECK`s, partial unique index for one `ACTIVE` season, FK delete behavior) and policies:

- `anon` may `SELECT` live active-season cafés, season metadata, and reviews.
- `authenticated` `USER` may insert and delete only their own reviews.
- `ADMIN` may mutate seasons and cafés. Raffle columns reject updates when `raffle_drawn_at` is not null (enforced again in the action as `409`).

## 3. Server Actions & API Route Contracts

`Zod` runs before any query. `400` returns inline field errors and leaves the modal open.

| Action | Role | OK | Reject |
| :--- | :--- | :--- | :--- |
| `createSeason` | ADMIN | `201` `DRAFT` + seed | `400` name or counts; `403` |
| `setActiveSeason` | ADMIN | `200` one `ACTIVE` | `403` |
| `createCafe` | ADMIN | `201` on managed season | `400` Zod; `403` |
| `updateCafe` | ADMIN | `200` | `400` Zod; `403` |
| `softDeleteCafe` | ADMIN | `200` sets `deleted_at` | `403` |
| `restoreCafe` | ADMIN | `200` clears `deleted_at` | `403` |
| `previewRaffle` | ADMIN | `200` no write; same inputs, same winners | `403` |
| `runRaffle` | ADMIN | `200` writes `winners`, `pool_snapshot`, `raffle_drawn_at` | `409` if already drawn; `403` |
| `verifyRaffle` | ADMIN | `200` replay snapshot; `✓` or `✗` | `403` |
| `updateRaffleConfig` | ADMIN | `200` while undrawn | `409` on `min_checkins`, `winner_count`, `public_seed` after draw; `403` |
| `createReview` | USER | `201` first stamp or extra note | `400` scores or note; `302` if signed out |
| `deleteReview` | USER | `200` own row; recount stamps | `403` another user; `302` if signed out |
| `signOut` | session | `200` | — |
| `getExplore` | public | `200` cafés, averages, stamp overlay | — |
| `listReviews` | public | `200` newest first; optional season | — |
| `planRoute` | USER | `200` itinerary + tool log | `400` budget or mode; `302` if signed out |

**Zod boundaries**

- Season: `name` ≥ 3 after trim; `min_checkins` and `winner_count` are integers ≥ 1.
- Café: `name` 1–80; `address` non-empty; lat/lng numeric and in range; `tags.min(1)`.
- Review: each score is an integer 1–5; `note` is 10–500 after trim and sanitizing.
- Concierge: `timeBudget ∈ {60, 90, 120, 180}` (default 120); `mode ∈ {"foot", "bike"}`.

`[TODO: Teammate to finalize]` action module split, the `400` body (`{ field, message }`), and which reads are Server Actions vs Route Handlers.

## 4. AI Concierge Tooling Architecture (Claude Agent SDK)

`/concierge` calls the three tools in order and prints each step. The model writes the reply. Scoring, pruning, and stop order stay in tool code.

```ts
interface GetSeasonalCafesInput { seasonId: string; tags: string[] }
interface SeasonalCafe {
  id: string; name: string; latitude: number; longitude: number;
  tags: string[]; avgRating: number | null; // null scores as 3
}
interface GetSeasonalCafesOutput {
  cafes: SeasonalCafe[]; // tag match; if none, all live cafés in the season
}
interface SearchCafeReviewsInput { cafeIds: string[]; keywords: string[] }
interface ReviewHit { cafeId: string; note: string; matched: boolean }
interface SearchCafeReviewsOutput { reviews: ReviewHit[] }
interface RouteCafe {
  id: string; name: string; latitude: number; longitude: number; score: number;
}
interface CalculateRouteOrderInput { cafes: RouteCafe[] }
interface RouteStop { cafeId: string; name: string; legKm: number; citation: string }
interface CalculateRouteOrderOutput {
  stops: RouteStop[]; totalKm: number; totalMinutes: number;
}
```

Score is `(avgRating ?? 3) + 1.2 * matchingNotes + 0.6 * tagOverlap`. Keep the top 4, then drop the lowest score until `travelMinutes + 20 * stopCount ≤ timeBudget`, always leaving at least one stop. Distance is Haversine × `1.25`. Speed is `4.8 km/h` (Foot) or `14 km/h` (Bike). `calculateRouteOrder` orders that set by nearest neighbour. Each stop cites a matching note, or the café rating when no note matches.

**Show route on map** goes to `/`, clears tag filters, highlights stop 1, and draws the dashed burgundy polyline.

`[TODO: Teammate to finalize]` Agent SDK tool registration, the keyword match, and the nearest-neighbour tie-break.

### Deterministic raffle (`mulberry32` + Fisher–Yates)

Shared by preview (no write), run (persist), and verify (replay `pool_snapshot`).

1. Eligible ids are users with enough unique cafés. Sort them lexicographically.
2. Hash `public_seed` and seed `mulberry32`.
3. Fisher–Yates shuffle with that PRNG.
4. Take `min(winnerCount, pool.length)`. An empty pool issues no tickets; a short pool means everyone eligible wins.

```ts
function mulberry32(seed: number): () => number;
function drawWinners(userIds: string[], publicSeed: string, winnerCount: number): string[];
```

`[TODO: Teammate to finalize]` the stable 32-bit hash of `public_seed` and the `pool_snapshot` JSON shape. Vitest covers `drawWinners`, Zod, and the pruner; Playwright covers the `302`, `403`, and `409` paths. Coverage target ≥ 70%.
