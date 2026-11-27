// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  handleRequest,
  sessionFromAuth,
  toResponse,
  type MiddlewareAuthState,
} from "./middlewareResponse";

const ORIGIN = "http://localhost:3000";
const req = (path: string) => new NextRequest(new URL(path, ORIGIN));

const signedOut: MiddlewareAuthState = { userId: null };
const asUser: MiddlewareAuthState = {
  userId: "user_explorer",
  sessionClaims: { sub: "user_explorer", role: "authenticated" },
};
const asAdmin: MiddlewareAuthState = {
  userId: "user_organizer",
  sessionClaims: {
    sub: "user_organizer",
    role: "authenticated",
    app_role: "ADMIN",
  },
};

const isPassThrough = (res: Response) =>
  res.status === 200 && res.headers.get("x-middleware-next") === "1";

describe("toResponse — explicit status codes", () => {
  it("redirects with 302 (not Next's default 307) and an absolute Location", () => {
    const res = toResponse(
      { kind: "redirect", location: "/sign-in?redirect_url=%2Fstamp" },
      req("/stamp")
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      `${ORIGIN}/sign-in?redirect_url=%2Fstamp`
    );
  });

  it("returns a plain 403 with no redirect", () => {
    const res = toResponse({ kind: "forbidden" }, req("/admin"));
    expect(res.status).toBe(403);
    expect(res.headers.get("location")).toBeNull();
  });

  it("passes the request through for next", () => {
    expect(isPassThrough(toResponse({ kind: "next" }, req("/")))).toBe(true);
  });
});

describe("sessionFromAuth — Clerk auth state → RBAC session", () => {
  it("is null when signed out", () => {
    expect(sessionFromAuth(signedOut)).toBeNull();
  });

  it("defaults to USER without an app_role claim", () => {
    expect(sessionFromAuth(asUser)).toEqual({
      userId: "user_explorer",
      appRole: "USER",
    });
  });

  it("reads ADMIN from the app_role claim", () => {
    expect(sessionFromAuth(asAdmin)).toEqual({
      userId: "user_organizer",
      appRole: "ADMIN",
    });
  });

  it("ignores the Postgres role claim and non-object claims", () => {
    expect(
      sessionFromAuth({ userId: "u1", sessionClaims: { role: "ADMIN" } })
    ).toEqual({ userId: "u1", appRole: "USER" });
    expect(sessionFromAuth({ userId: "u1", sessionClaims: "ADMIN" })).toEqual({
      userId: "u1",
      appRole: "USER",
    });
    expect(sessionFromAuth({ userId: "u1", sessionClaims: null })).toEqual({
      userId: "u1",
      appRole: "USER",
    });
  });
});

describe("handleRequest — middleware wiring (AC 1.1, 5.1)", () => {
  it("signed-out /stamp?cafe=x → 302 to sign-in with the return path", async () => {
    const res = await handleRequest(
      req("/stamp?cafe=x"),
      async () => signedOut
    );
    expect(res.status).toBe(302);
    const location = new URL(res.headers.get("location") ?? "");
    expect(location.pathname).toBe("/sign-in");
    expect(location.searchParams.get("redirect_url")).toBe("/stamp?cafe=x");
  });

  it("signed-out /admin → 302 (sign in before any 403)", async () => {
    const res = await handleRequest(req("/admin"), async () => signedOut);
    expect(res.status).toBe(302);
  });

  it("USER on /admin/cafes → 403", async () => {
    const res = await handleRequest(req("/admin/cafes"), async () => asUser);
    expect(res.status).toBe(403);
  });

  it("ADMIN on /admin/raffle → pass through", async () => {
    const res = await handleRequest(req("/admin/raffle"), async () => asAdmin);
    expect(isPassThrough(res)).toBe(true);
  });

  it("public / → pass through without needing auth", async () => {
    let called = false;
    const res = await handleRequest(req("/"), async () => {
      called = true;
      return signedOut;
    });
    expect(isPassThrough(res)).toBe(true);
    expect(called).toBe(false);
  });
});
