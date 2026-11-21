# CLAUDE.md — BrewRoute Project Constitution

## 1. Project Context & Tech Stack
- **Overview:** BrewRoute is a seasonal café crawl, interactive map, tasting archive, and transparent raffle platform featuring a sunlit Wes Anderson streetscape aesthetic and a Color-as-Reward check-in mechanic.
- **Stack:** Next.js 15 (App Router), TypeScript (`strict: true`), Tailwind CSS, PostgreSQL (Supabase), Auth.js / Clerk (Google OAuth + RBAC), Leaflet (`react-leaflet`), Claude Agent SDK (`@anthropic-ai/sdk`), Vitest, Playwright, Vercel.
- **Modular Documentation (`@imports`):**
  - Product Context & Personas: @docs/prd.md
  - User Stories & API Contracts: @docs/user_stories.md
  - Visual Design Tokens & Motion Rules: @docs/Design.md
  - System Architecture & DB Schema: @docs/ARCHITECTURE.md
- **Claude Code Extensibility Index:**
  - Skills: `.claude/skills/` (`/clear-review`, `/add-feature`)
  - Sub-Agents: `.claude/agents/` (`security-reviewer`, `test-writer`)
  - Hooks & Permissions: `.claude/settings.json` (`PreToolUse`, `PostToolUse`, `Stop`)
  - MCP Servers: `.mcp.json` (Supabase / Playwright / GitHub)

## 2. Architecture Decisions (ADRs)
- **ADR-1 Server-First Data & Auth:** Use Next.js Server Components for reads and Server Actions / Route Handlers for mutations. Enforce RBAC (`ADMIN` vs. `USER`) server-side on every `/admin/*` route and mutation (`403 Forbidden` on unauthorized calls; `302` redirect on unauthenticated check-ins).
- **ADR-2 Single Active Season Invariant:** Exactly one season may hold `status = 'ACTIVE'`. Activating a season runs inside a transaction that transitions all other `ACTIVE` seasons to `ARCHIVED`.
- **ADR-3 Soft-Delete Cafés:** Removing a café sets `cafes.deleted_at` (never hard `DELETE`) so historical reviews remain intact in the archive labeled `(retired)`.
- **ADR-4 Deterministic & Auditable Raffle:** Count unique cafés reviewed per user per season (`unique_cafes >= min_checkins`). Sort eligible user IDs lexicographically, shuffle via Fisher-Yates driven by `mulberry32` seeded from `public_seed`, persist `pool_snapshot` and `raffle_drawn_at`, and block re-draws with `409 Conflict`.
- **ADR-5 Color-as-Reward Sync:** Stamped cafés unlock pastel tones across storefront, map pin, and passport card; unstamped cafés render in muted grayscale (`#EAE7E1`).

## 3. Coding Conventions & Commands
- **Commands:** `npm run dev` | `npm run lint` | `npm run typecheck` (`tsc --noEmit`) | `npm run test` | `npm run test:coverage` | `npm run test:e2e` | `npm audit`
- **Directory & Naming:** App Router route groups (`(public)`, `(explorer)`, `admin/`). UI components in `PascalCase.tsx`; pure domain logic (raffle engine, Haversine route sorter, Zod schemas) in `lib/*.ts` in `camelCase.ts`.
- **Styling & Fonts:** Map `@docs/Design.md` tokens into Tailwind config; load all 5 fonts via `next/font/google` (never runtime `@import`).

## 4. Testing Strategy, Git & Context Workflow
- **4-Phase Workflow (`Explore → Plan → Implement → Commit`):** Always explore existing files with `Glob`/`Grep`/`Read` and enter **Plan Mode** (`Shift+Tab`) before editing code.
- **Strict TDD (`Red → Green → Refactor`):**
  1. **RED (`test:`):** Commit failing Vitest unit/integration tests mapped to `AC X.Y` in `@docs/user_stories.md` BEFORE writing implementation code (pure `lib/` logic ≥ 90% coverage; repo-wide ≥ 70%).
  2. **GREEN (`feat:` / `fix:`):** Implement minimal code to pass tests.
  3. **REFACTOR (`refactor:`):** Clean up while keeping tests green.
  4. **E2E (`test:e2e`):** Verify critical journeys (OAuth redirect, stamp unlock, archive filter, admin `403`, raffle `409`) via Playwright.
- **Branching, PR Reviews & AI Disclosure:** Never commit/push directly to `main`. Use feature branches (`feat/issue-<id>-<slug>`) or `git worktree` for parallel tasks. Every PR must apply the **C.L.E.A.R.** review framework and include an **AI Disclosure block** (`% AI-generated`, `Tools/Models used`, `Human verification applied`).
- **Context & Memory Hygiene:** Run `/clear` between unrelated features, `/compact` when context grows large, and `claude --continue` to resume sessions. Persist architectural learnings in project auto-memory (`MEMORY.md`).

## 5. Security & OWASP Top 10 Guardrails (Do's & Don'ts)

### DO (Mandatory Practices)
- **A01 Broken Access Control:** Enforce server-side session & role checks inside every `/admin/*` middleware, Server Action, and Route Handler; enforce ownership checks on review deletion (`403 Forbidden`).
- **A03 Injection & XSS:** Use parameterized Supabase/ORM queries exclusively; validate all inputs/params with `Zod` schemas in `lib/validations/` and sanitize text (`<`, `>`).
- **A02/A05 Secrets & Security Config:** Keep secrets in `.env.local` (never committed; protected by Gitleaks + `.claude/settings.json` deny rules) and run `npm audit` in CI.
- **A10 SSRF & External Links:** Restrict Claude Agent SDK tools (`getSeasonalCafes`, `searchCafeReviews`, `calculateRouteOrder`) to read-only internal DB queries; render external Maps links with `rel="noopener noreferrer"`.
- **Frontend Fidelity & Quality Gate:** Unify `#3B2621` ink borders, `#F5EFE6` cream fills, hard-offset shadows (`0` blur), rounded corners, and sepia-styled CartoDB Positron Leaflet tiles. Run `npm run typecheck && npm run lint && npm run test` before every commit/PR.

### DON'T (Strict Prohibitions)
- **No Client-Only Security:** Never rely solely on hiding UI buttons for `ADMIN` protection or review ownership.
- **No Destructive Data Ops:** Never hard-delete `cafes` rows and never allow raffle re-draws once `raffle_drawn_at` is set (`409 Conflict`).
- **No Prototype Copy-Paste:** Never paste single-file Claude Artifact code into production components or use runtime `@import` fonts.
- **No Unverified Code:** Never push directly to `main`, never commit `.env*` secrets, never use TypeScript `any`, and never use blurred drop shadows (`shadow-sm/md/lg`) or sharp `90deg` corners.
