// @vitest-environment node
// Compiles middleware.ts's real `config.matcher` with Next's own matcher
// compiler, so these assertions match what `next start` does. Clerk's default
// matcher skips any path ending in a static extension. Protected segments must
// still reach the middleware, e.g. a future /admin/export.csv Route Handler
// (AC 1.1, ADR-1). Route Handlers still check the role themselves (defense in
// depth); this only closes the middleware gap.
import { createRequire } from "node:module";
import type { MiddlewareMatcher } from "next/dist/build/analysis/get-page-static-info";
import { getMiddlewareRouteMatcher } from "next/dist/shared/lib/router/utils/middleware-route-matcher";
import type { BaseNextRequest } from "next/dist/server/base-http";
import { describe, expect, it } from "vitest";
import { config } from "@/middleware";

// Exported at runtime by Next 15 but missing from its .d.ts.
const { getMiddlewareMatchers } = createRequire(import.meta.url)(
  "next/dist/build/analysis/get-page-static-info"
) as {
  getMiddlewareMatchers: (
    matcher: string[],
    nextConfig: { i18n: null }
  ) => MiddlewareMatcher[];
};

const matches = getMiddlewareRouteMatcher(
  getMiddlewareMatchers(config.matcher, { i18n: null })
);
// No matcher entry uses `has`/`missing`, so the request is never read.
const noRequest = { headers: {}, cookies: {} } as unknown as BaseNextRequest;
const runsOn = (pathname: string) => matches(pathname, noRequest, {});

describe("middleware matcher", () => {
  it.each([
    "/",
    "/stamp",
    "/stamp?cafe=x",
    "/concierge",
    "/admin",
    "/admin/cafes",
    "/sign-in",
    "/api/anything",
  ])("runs on page and API route %s", (path) => {
    expect(runsOn(path.split("?")[0])).toBe(true);
  });

  it.each([
    "/admin/export.csv",
    "/admin/report.xlsx",
    "/admin/x.html",
    "/admin/raffle/audit.json",
    "/stamp/a.png",
    "/concierge/route.js",
  ])("runs on protected path with a static extension %s", (path) => {
    expect(runsOn(path)).toBe(true);
  });

  it.each([
    "/ADMIN/export.csv",
    "/Admin/x.csv",
    "/StAmP/a.png",
    "//admin/x.csv",
  ])("runs on case and slash variants %s (rbac normalises them)", (path) => {
    expect(runsOn(path)).toBe(true);
  });

  it.each([
    "/%61dmin/export.csv",
    "/admin%2Fexport.csv",
    "/x/%2e%2e/admin/a.csv",
  ])(
    "runs on percent-encoded path %s (rbac decodes them, fails closed)",
    (path) => {
      expect(runsOn(path)).toBe(true);
    }
  );

  it.each([
    "/_next/static/chunks/main.js",
    "/_next/image",
    "/favicon.ico",
    "/logo.png",
    "/fonts/jost.woff2",
    "/administrator.png",
    "/stampede/poster.jpg",
  ])("still skips public static asset %s", (path) => {
    expect(runsOn(path)).toBe(false);
  });
});
