# BrewRoute — User Stories & Acceptance Criteria

> API status codes (`200`, `201`, `302`, `400`, `403`, `409`) map directly to Next.js Server Action / Route Handler responses.  
> **Active season** = the single season record with `status: ACTIVE`.

---

## Role 1: Organizer (`ADMIN`)

### US-1: Manage Seasonal Themes
> **As an** Organizer, **I want to** create seasonal crawl themes and set which one is active, **so that** explorers always have a structured, current theme.

- **AC 1.1:** All `/admin/*` routes and season/café mutations enforce server-side role checks; any non-`ADMIN` request returns `403 Forbidden`.
- **AC 1.2:** Clicking **+ New seasonal theme** opens a rounded modal with fields for Season name, Theme, Min check-ins, and Winners. Clicking Cancel, `✕`, or the backdrop scrim closes the modal and resets form state.
- **AC 1.3:** A season name shorter than 3 characters (after sanitization) fails validation with `400 Bad Request` and displays an inline error without closing the modal.
- **AC 1.4:** A non-integer or `< 1` value for `min_checkins` or `winner_count` fails validation with `400 Bad Request`.
- **AC 1.5:** A valid submission returns `201 Created`, creates the season as `DRAFT`, auto-generates its default public seed (`<NAME-SLUG(≤16)>-<YEAR>`), sets it as the currently managed season, and closes the modal.
- **AC 1.6:** Clicking **Set active** returns `200 OK`, transitions the target season to `ACTIVE`, and automatically archives the previous `ACTIVE` season (`status: ARCHIVED`) so exactly one season is active at any time.
- **AC 1.7:** **Set active** is disabled on an already `ACTIVE` season, and **Manage** is disabled on the currently selected season.
- **AC 1.8:** Status badges render in semantic tokens: `ACTIVE` (mustard), `ARCHIVED` (slate), and `DRAFT` (paper).

### US-2: Curate Cafés with Validated Coordinates
> **As an** Organizer, **I want to** add, edit, soft-remove, and restore curated cafés on the map, **so that** explorers have an accurate route while historical reviews remain intact.

- **AC 2.1:** Clicking the organizer map populates Latitude and Longitude (4 decimal places) with a dashed draft marker; clicking an existing café marker loads that record into the edit form.
- **AC 2.2:** Saving a café validates all fields via `Zod` and returns `400 Bad Request` with a toast and inline field errors on failure:
  - `name` is required and `≤ 80` characters;
  - `address` is required;
  - `latitude ∈ [-90, 90]` and `longitude ∈ [-180, 180]` (numeric);
  - at least one feature tag is selected.
- **AC 2.3:** Creating a valid café returns `201 Created` and attaches it to the managed season; updating an existing café returns `200 OK`. All text inputs are sanitized against XSS (`<` / `>` stripped).
- **AC 2.4:** Organizers can create and immediately select custom tags via the `+` button or `Enter` key.
- **AC 2.5:** **Remove** performs a soft delete (`deleted_at` timestamp set) and returns `200 OK`, hiding the café from the streetscape, active maps, and passport grid while preserving existing reviews.
- **AC 2.6:** Historical reviews belonging to a soft-deleted café remain visible in the archive labeled `"(retired)"`.
- **AC 2.7:** **Restore** clears `deleted_at` and returns `200 OK`, restoring the café across all active views.
- **AC 2.8:** Stop numbers (`01`…) follow the active season's café order, cycling the 4-color Wes Anderson palette across storefronts, map pins, and cards.
- **AC 2.9:** On the `STREETSCAPE` tab, all active-season cafés render in full color; clicking **Manage this street** navigates to the `CAFÉS` tab.
- **AC 2.10:** Opening a café drawer in `ADMIN` mode displays a read-only `"Organizer preview"` panel without a check-in submission form.

### US-3: Run a Transparent, Deterministic Raffle
> **As an** Organizer, **I want to** draw winners from eligible participants using a public seed, **so that** anyone can verify and audit the raffle outcome.

- **AC 3.1:** Eligibility counts **unique cafés** reviewed per user within the target season (`unique_cafes >= min_checkins`); multiple reviews of the same café by one user count as **1** unique check-in. The participants table displays total reviews, unique cafés (noting repeat visits), and status (`Winner`, `Eligible`, or `"N short"`).
- **AC 3.2:** `min_checkins`, `winner_count`, and `public_seed` are locked once drawn; any mutation attempt after `raffle_drawn_at` is set returns `409 Conflict`.
- **AC 3.3:** **Preview draw** computes winners without persisting results; identical seeds and eligible pools always yield identical previews.
- **AC 3.4:** The deterministic draw algorithm:
  1. sorts eligible user IDs lexicographically;
  2. shuffles via Fisher–Yates driven by a `mulberry32` PRNG seeded from the hash of `public_seed`;
  3. selects `min(winner_count, pool.length)` distinct winners without out-of-bounds errors.
- **AC 3.5:** **Run transparent raffle** returns `200 OK`, persists `winners`, `pool_snapshot`, and `raffle_drawn_at`, and renders winner ticket stubs formatted `BR-<SEASON>-00N`.
- **AC 3.6:** Re-running a finalized raffle returns `409 Conflict` with a banner warning, leaving published results unchanged.
- **AC 3.7:** When `0 < pool.length < winner_count`, a notice clarifies that all eligible participants win; when `pool.length === 0`, zero tickets are issued.
- **AC 3.8:** **Verify draw** recomputes the draw from `pool_snapshot`, `public_seed`, and `winner_count`, displaying `✓` when verified against published winners and `✗` otherwise.

---

## Role 2: Explorer (`USER`)

### US-4: Explore the Season via Streetscape, Map & Passport
> **As an** Explorer, **I want to** browse the active season's cafés across a synchronized streetscape, interactive map, and passport card grid in one view, **so that** I can discover cafés and track progress seamlessly.

- **AC 4.1:** Header navigation displays `EXPLORE • STAMP • CONCIERGE` with the active tab highlighted as a burgundy pill; the top-right counter displays `X/Y STAMPS` when signed in (or `SIGNED OUT` for unauthenticated visitors).
- **AC 4.2:** The hero streetscape renders one storefront per active café: stamped cafés display in full pastel color, while unstamped cafés (and all storefronts when signed out) render in muted grayscale.
- **AC 4.3:** Hovering or focusing a storefront reveals its stop number, rating, tags, and stamp status; clicking opens its Café Dossier drawer.
- **AC 4.4:** `EXPLORE` displays the season title, raffle progress bar (`X / min cafés visited to unlock raffle entry`), and a responsive `45fr / 55fr` split view pairing the Leaflet map on the left with passport cards on the right.
- **AC 4.5:** The map's floating tag filter (`All` plus dynamic tags) uses `AND` filtering: non-matching pins and cards are hidden, while non-matching storefronts dim to `38%` opacity. Selecting `All` resets filters.
- **AC 4.6:** Stamped cafés display a color-matched map pin, pastel card fill, and `✓ STAMPED` badge; unstamped cafés display a muted gray pin and dashed card with `"Unstamped — click to check in"`.
- **AC 4.7:** Three-way synchronization: hovering or focusing a storefront, pin, or card highlights all three; clicking a pin scrolls its card into view and opens the drawer; clicking a card or storefront opens the drawer.
- **AC 4.8:** The Café Dossier drawer displays overall average rating (gracefully showing `"No ratings yet"` when `0` reviews exist, never `NaN`), per-criterion bar averages, community tasting notes, and external Google Maps / Apple Maps links.

### US-5: Check In, Rate & Unlock a Stamp
> **As an** Explorer, **I want to** rate a visited café and write a tasting note, **so that** my visit counts toward raffle eligibility and unlocks the café's colors.

- **AC 5.1:** Unauthenticated visitors attempting to check in see a **Sign in with Google** trigger that initiates the Google OAuth flow (`302` redirect) and returns them to the café view upon authentication.
- **AC 5.2:** `coffee_quality`, `ambiance`, and `workspace_friendliness` must each be integers in `[1, 5]`, and `note` (trimmed and sanitized) must be `10–500` characters. Invalid submissions return `400 Bad Request` with inline errors and a live `n/500` character counter.
- **AC 5.3:** Valid check-ins return `201 Created`, persist the review to the active season, display an animated stamp confirmation in the drawer, and immediately update the progress bar, `X/Y STAMPS` counter, and raffle status pill.
- **AC 5.4:** On a user's first check-in at a café, its storefront, map pin, and passport card transition smoothly (`500ms`) from grayscale to full pastel color with an animated `✓ STAMPED` badge.
- **AC 5.5:** Submitting a subsequent review for an already-stamped café returns `201 Created` and saves the note without incrementing unique check-in progress.
- **AC 5.6:** The `STAMP` view's passport header displays the live raffle status pill: `"Visit N more café(s) to enter the draw"`, `"Raffle entry unlocked"`, `"Raffle drawn {date}"`, or `"You won this season's raffle"`.

### US-6: Browse the Season-Filtered Review Archive
> **As an** Explorer, **I want to** filter community tasting notes by season and manage my own entries, **so that** I can revisit recommendations and delete my own posts if needed.

- **AC 6.1:** The `STAMP` view renders the Coffee Passport stamp book above the **Community review archive**, which features a single rounded **Season** `<select>` dropdown (`All seasons` plus each season and status) alongside a live `N results` counter.
- **AC 6.2:** Reviews are ordered newest-first, displaying café name (or `"(retired)"`), season, date, tasting note, tags, author (`"(you)"` for the signed-in user), and `C/A/W` scores.
- **AC 6.3:** Deleting one's own review returns `200 OK` and recalculates stamp count and raffle eligibility immediately.
- **AC 6.4:** Attempting to delete another user's review is blocked with `403 Forbidden`; unauthenticated delete attempts trigger Google OAuth sign-in.
- **AC 6.5:** Signing out returns `200 OK`, reverting storefronts, pins, and cards to grayscale and resetting the header counter to `SIGNED OUT`.

---

## Bonus Feature: AI Route & Tasting Concierge (Claude Agent SDK)

### US-7: Plan a Personalized Café Route
> **As an** Explorer, **I want to** describe my mood, flavor preferences, and available time in plain English, **so that** an AI concierge builds an optimized café route backed by real community notes.

- **AC 7.1:** Users configure free-text prompt, mood chips (default `"Quiet / Reading"`), flavor chips (default `"Fruity / floral"`), time budget (`60`, `90`, `120`, or `180` mins; default `120`), and travel mode (`Foot` or `Bike`). Free-text keywords augment tag and flavor matching.
- **AC 7.2:** The concierge executes three tools sequentially with visible step logs:
  1. `getSeasonalCafes(seasonId, tags)` — queries active-season cafés matching tags (falling back to all active cafés if none match).
  2. `searchCafeReviews(cafeIds, keywords)` — retrieves matching community tasting notes.
  3. `calculateRouteOrder(cafes)` — orders stops via Haversine nearest-neighbour.
- **AC 7.3:** Cafés are scored via `avg_rating (default 3) + 1.2 * matching_notes + 0.6 * tag_overlap`. Top 4 candidates are selected and pruned from lowest score until `travel_time + (20 min * stops) <= time_budget` (retaining at least 1 stop), using `4.8 km/h` (Foot) or `14 km/h` (Bike) and a `1.25x` street-distance factor.
- **AC 7.4:** The generated itinerary card displays total duration, total distance (`km`), ordered stops with leg distances, and a cited community tasting note (or café rating) per stop.
- **AC 7.5:** Clicking **Show route on map** switches to `EXPLORE`, clears active tag filters, highlights the first stop, plots a dashed burgundy polyline route on the Leaflet map, and displays a dismissible `"Concierge route plotted"` banner.

---

## Technical & Security Guardrails (Definition of Done)
- **Tech Stack:** Next.js (App Router), TypeScript, PostgreSQL (Supabase), Clerk (Google OAuth + RBAC), Leaflet, Claude Agent SDK, Vitest, Playwright, Vercel.
- **Server-Side RBAC:** Role checks enforced inside all Server Actions and API Route Handlers (never relying solely on client UI state).
- **Input Sanitization:** All form payloads and query parameters validated with `Zod` schemas to prevent XSS and SQL injection.
- **Test Coverage:** Minimum **70% code coverage** across unit/integration tests (Vitest) and critical end-to-end user journeys (Playwright).
