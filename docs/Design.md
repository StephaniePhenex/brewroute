---
version: 1.0
name: BrewRoute
aesthetic: Pastel Wes Anderson Streetscape & Tactile Coffee Passport
colors:
  pink: "#F7C5D0"       # Masthead, drawer/modal headers, active-nav text, route banner
  paper: "#F5EFE6"      # Page canvas, inputs, ghost buttons, tags, skin-0 card/wall
  surface: "#EEE5D6"    # Panels, drawers, map frame, toasts, admin forms
  pave: "#F6EFE2"       # Decorative pavement strip beneath storefronts
  burg: "#6B2133"       # Wordmark, headings, primary buttons, active nav pill, stamps
  rose: "#F2B8C6"       # Skin-1 card/wall
  sage: "#9EB09E"       # Skin-2 card/wall, 100% progress bar, 2xx toast
  mustard: "#D4A84F"    # Skin-3 card/wall, progress fill, focus ring, raffle tickets, ACTIVE badge
  slate: "#6B8299"      # Archive/drawer tag pills, ARCHIVED badge, flavor chips, 3xx toast
  ink: "#3B2621"        # Unified primary text, borders, hard shadows, illustration strokes
  muted: "#6E5D56"      # Secondary text, labels, captions, map neighborhood labels
  water: "#BCCAD6"      # Map water bodies, window glass accents
  lockedBg: "#EAE7E1"   # Unstamped card/pin background
  lockedInk: "#6E6A63"  # Unstamped card/pin text
  lockedLine: "#A8A29A" # Unstamped dashed border / pin stroke
typography:
  display: "Fredoka, Rubik, sans-serif"          # 700: BREWROUTE wordmark (clamp 36-54px), passport holder (30px)
  heading: "Jost, Futura, sans-serif"            # 600-700 UPPERCASE, tracking 0.14em: nav (13px), buttons (12px), tags (10px)
  serif: "Cormorant Garamond, Georgia, serif"    # 600 italic: season taglines, tasting notes (18px), concierge voice
  mono: "Space Mono, monospace"                  # 400/700: stop numbers (24px), counters, ratings, audit logs
  body: "Plus Jakarta Sans, sans-serif"          # 400-600: body copy (14px), addresses, descriptions
borders:
  standard: "1.5px solid #3B2621"
  cardStamped: "2px solid #3B2621"
  cardLocked: "1.5px dashed #A8A29A"
rounded:
  drawer: "24px 0 0 24px"
  card: "16px"
  modal: "16px"
  toast: "14px"
  textarea: "14px"
  input: "12px"
  button: "12px"
  scoreSquare: "10px"
  badge: "8px"
  pill: "9999px"
shadows:
  panel: "4px 4px 0 #3B2621"
  cardRest: "3px 3px 0 #3B2621"
  cardSelected: "6px 6px 0 #3B2621"
  cardPressed: "2px 2px 0 #3B2621"
---

## 1. Overview & Signature Mechanic

BrewRoute uses a **sunlit Wes Anderson editorial streetscape** aesthetic: flat pastel color blocks, `#3B2621` espresso ink linework, soft rounded corners, and crisp hard-offset shadows with zero blur.

- **Color-as-Reward (Core UX Mechanic):** A café's **storefront**, **map pin**, and **passport card** render in muted grayscale (`lockedBg` / `grayscale(0.95)`) until the signed-in Explorer stamps it via check-in. Upon saving a check-in, all three transition smoothly (`500ms ease`) into the café's assigned pastel tone while the drawer's scrim (`rgba(43,27,23,0.35)`) keeps the unlock visible behind it.

---

## 2. Storefront & Card Color Cycle (4-Stop Rotation)

Storefront façades, map pins, and stamped café cards cycle in lockstep every 4 stops (`index % 4`):

| Stop Cycle | Theme Name | Card & Wall Fill | Card Ink | Storefront Frame / Trim & Architectural Details |
| :--- | :--- | :--- | :--- | :--- |
| `01, 05, 09…` | Warm Cream | `#F5EFE6` (`paper`) | `#6B2133` (`burg`) | Frame `#FCF8F1` / Trim `#E6D8C2` / Striped awning `#8E9AA3` & `#F2DCC4`, flower boxes, topiary pots |
| `02, 06, 10…` | Dusty Rose | `#F2B8C6` (`rose`) | `#5E1D2E` | Frame `#F8D2DB` / Trim `#E29AAE` / Striped awning `#F2B8C6` & `#FBF4EA`, brick quoins, cup decal |
| `03, 07, 11…` | Muted Sage | `#9EB09E` (`sage`) | `#1F2D24` | Frame `#B4C3B2` / Trim `#879A88` / Panelled fascia with pilasters, hanging `OPEN` door sign |
| `04, 08, 12…` | Warm Ochre | `#D4A84F` (`mustard`) | `#362218` | Frame `#E2C27E` / Trim `#B88D3A` / Panelled fascia with pilasters, upper transom window panes |

- **Fixed Illustration Accents:** Window glass `#848E96`, terracotta pots `#C98F72`, foliage `#7F9A6E`, map blocks `#E6DCC5`.

---

## 3. Page Architecture & Navigation

Five full-bleed vertical bands with no outer page frame:

1. **Masthead (`#F7C5D0`, min-height `150px`, `px-6 md:px-12 py-6`):**
   - **Center:** `BREWROUTE` wordmark (`Fredoka 700`) + `46px` burgundy circle holding a `24px` pink moka-pot SVG (`strokeWidth 1.6`). Directly beneath are three interactive sub-logo nav pills (`13px Jost`, `tracking 0.18em`) separated by `•`:
     - **Explorer:** `EXPLORE • STAMP • CONCIERGE`
     - **Organizer:** `STREETSCAPE • CAFÉS • RAFFLE`
     - Active tab: burgundy pill (`#6B2133`) with pink text (`#F7C5D0`), `aria-current="page"`.
   - **Top-Right Utility:** `EXPLORER / ORGANIZER` segmented pill (dev/demo only) above `X/Y STAMPS` (`16px Jost 700`) or `N CURATED STOPS`.
2. **Hero Streetscape:** Full-width horizontal flex row of storefronts (`min-w-[220px]`, `viewBox="0 0 320 274"`), flush under masthead. Stamped cafés show a tilted circular burgundy `STAMPED` postmark (`mix-blend-mode: multiply`). Non-matching storefronts under active tag filters drop to `opacity: 0.38`.
3. **Pavement Strip:** `40px` `#F6EFE2` band with subtle vertical joints every `96px` (`rgba(59,38,33,0.09)`, `aria-hidden="true"`).
4. **Main Canvas (`#F5EFE6`, `pt-10 pb-20 px-6 md:px-12`):**
   - **`EXPLORE`:** Season header + `14px` pill raffle progress bar (`mustard` fill, turning `sage` at 100%), followed by a `45fr / 55fr` split (`lg+`, `28px` gap): interactive map on left, passport cards (`1 / 2 / 3` cols, `16px` gap) on right.
   - **`STAMP`:** Coffee Passport stamp book (`2 / 3 / 5` cols; alternating perforated square postage stamps & circular postmarks in `burg`/`slate`/`mustard` tilted `-4°` to `5°`, staggered `90ms`) above the Community Review Archive filtered by a single pill-shaped **Season** `<select>` (`min-w-[240px]`).
   - **`CONCIERGE`:** 2-column AI route planner (mood/flavor chips, duration select, Foot `4.8 km/h` / Bike `14 km/h` toggle, `20 min` dwell/stop) + live Space Mono tool-call log (`650ms` step interval) & itinerary card plotting a `2.6px` dashed burgundy route (`stroke-dasharray="6 4"`) back onto `EXPLORE`.
   - **`ORGANIZER`:** `STREETSCAPE` (full-color preview), `CAFÉS` (season rows + `3/2` split map/table & CRUD form), and `RAFFLE` (`1/2` split seed config, `BR-{SEASON}-00N` winner ticket stubs, & audit verification box).
5. **Base Strip:** Solid `12px` `#6B2133` footer bar.

---

## 4. Component Specs, Motion & Accessibility

- **Café Cards (`.awa-card`, `p-4`, `16px` radius):**
  - *Stamped:* Card-tone fill & ink, `2px solid #3B2621` border, `3px 3px 0 #3B2621` shadow (`-2px,-2px` lift with `6px 6px 0` shadow when selected), `#F5EFE6` pill tags, and rotated (`-4deg`) double-bordered `✓ STAMPED` ink badge (`8px` radius, `stampIn` `0.55s cubic-bezier(.2,.9,.3,1.2)`).
  - *Locked:* `#EAE7E1` fill, `#6E6A63` text, `1.5px dashed #A8A29A` border, no shadow, and dashed `"Unstamped — click to check in"` slot (`10px` radius, `max-w-[132px]`).
- **Map Pins & Floating Filter (`CityMap`):** `15px` octagon hotel-key-tag pins (`22px` `3.5px` mustard highlight ring when selected; sage check badge when stamped). Floating filter bar inset `10px` from top/left/right (`bd hard`, `paper` fill, `10px` chips).
- **Café Dossier Drawer:** Right slide-over (`max-w-lg`, `24px 0 0 24px` corners, `drawerIn` `0.25s ease-out`), sticky pink header, 3 criteria progress bars (`10px` height, mustard fill), three `5 × (36×34px, 10px radius)` score-picker squares, and `500`-char tasting note textarea.
- **Toasts:** Fixed `bottom-6 left-6` (`max-w-sm`, `14px` radius, `aria-live="polite"`, `3.6s` auto-dismiss) with left HTTP status block (`2xx` sage, `3xx` slate, `409` mustard, `4xx` burg).
- **Accessibility & Motion:** Global `2px solid #D4A84F` focus outline (`offset 2px`; `-4px` on storefronts). Use `role="dialog"`, `role="radiogroup"`, `role="progressbar"`, and keyboard-focusable map pins (`tabIndex={0}`). Disable keyframe animations and `500ms` transitions under `prefers-reduced-motion: reduce`.

---

## 5. Production Implementation Rules (Do's & Don'ts)

- **Do:** Build modular Next.js App Router components, map Tailwind theme tokens to the YAML palette above, load all 5 fonts via `next/font/google`, and render the interactive map with Leaflet styled to match the parchment/sage/water palette.
- **Do:** Unify all dark ink borders/shadows to `#3B2621` and all cream fills to `#F5EFE6`, preserving crisp hard-offset shadows and button press physics (`active:translate-x-[1px] active:translate-y-[1px]`).
- **Don't:** Copy-paste single-file prototype code, use runtime Google Fonts `@import`, use blurred drop shadows (`shadow-sm/md/lg`), or leave sharp `90deg` corners on inputs, modals, or cards.