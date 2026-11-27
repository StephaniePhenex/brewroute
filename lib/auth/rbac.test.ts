// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  decideAccess,
  isAdminPath,
  isProtectedPath,
  parseAppRole,
  safeReturnTo,
  signInLocation,
  signInRedirect,
  type AuthSession,
} from "./rbac";

const USER: AuthSession = { userId: "user_explorer", appRole: "USER" };
const ADMIN: AuthSession = { userId: "user_organizer", appRole: "ADMIN" };

const signIn = (returnTo: string) =>
  `/sign-in?redirect_url=${encodeURIComponent(returnTo)}`;

describe("route table — / is public", () => {
  it.each([
    ["/", null],
    ["/", USER],
    ["/", ADMIN],
    ["/sign-in", null],
    ["/sign-in/sso-callback", null],
  ] as const)("%s with %o → next", (path, session) => {
    expect(decideAccess(path, "", session)).toEqual({ kind: "next" });
  });
});

describe("AC 5.1 — /stamp and /concierge require a session (302)", () => {
  it.each(["/stamp", "/concierge", "/stamp/passport", "/concierge/plan"])(
    "signed-out %s redirects to sign-in with a return path",
    (path) => {
      expect(decideAccess(path, "", null)).toEqual({
        kind: "redirect",
        location: signIn(path),
      });
    }
  );

  it("preserves the query string so a check-in returns to that café", () => {
    expect(decideAccess("/stamp", "?cafe=cafe-paper-lantern", null)).toEqual({
      kind: "redirect",
      location: signIn("/stamp?cafe=cafe-paper-lantern"),
    });
  });

  it.each([
    ["/stamp", USER],
    ["/stamp", ADMIN],
    ["/concierge", USER],
    ["/concierge", ADMIN],
  ] as const)("%s with a session → next", (path, session) => {
    expect(decideAccess(path, "", session)).toEqual({ kind: "next" });
  });
});

describe("AC 1.1 — /admin/* requires ADMIN (403 for USER)", () => {
  it.each(["/admin", "/admin/cafes", "/admin/raffle"])(
    "signed-out %s redirects to sign-in first (not 403)",
    (path) => {
      expect(decideAccess(path, "", null)).toEqual({
        kind: "redirect",
        location: signIn(path),
      });
    }
  );

  it.each(["/admin", "/admin/cafes", "/admin/raffle"])(
    "signed-in USER on %s is forbidden",
    (path) => {
      expect(decideAccess(path, "", USER)).toEqual({ kind: "forbidden" });
    }
  );

  it.each(["/admin", "/admin/cafes", "/admin/raffle"])(
    "ADMIN on %s → next",
    (path) => {
      expect(decideAccess(path, "", ADMIN)).toEqual({ kind: "next" });
    }
  );
});

describe("path matching is segment-exact and normalised", () => {
  it.each(["/administrator", "/stampede", "/concierge-tips", "/adminx"])(
    "%s is not a protected look-alike",
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
      expect(isAdminPath(path)).toBe(false);
    }
  );

  it.each([
    "/admin/",
    "//admin",
    "/ADMIN",
    "/Admin/Cafes",
    "/%61dmin",
    "/admin%2Fcafes",
  ])("%s is still treated as an admin path", (path) => {
    expect(isAdminPath(path)).toBe(true);
    expect(isProtectedPath(path)).toBe(true);
    expect(decideAccess(path, "", USER)).toEqual({ kind: "forbidden" });
  });

  it("treats a malformed percent-encoding as protected rather than crashing", () => {
    expect(isProtectedPath("/admin%")).toBe(true);
    expect(decideAccess("/admin%", "", USER)).toEqual({ kind: "forbidden" });
  });
});

describe("parseAppRole — only an exact ADMIN claim is ADMIN (fail closed)", () => {
  it("accepts ADMIN", () => {
    expect(parseAppRole("ADMIN")).toBe("ADMIN");
  });

  it.each([
    undefined,
    null,
    "",
    "USER",
    "admin",
    "Admin",
    " ADMIN",
    "SUPERADMIN",
    1,
    true,
    {},
    ["ADMIN"],
  ])("treats %o as USER", (claim) => {
    expect(parseAppRole(claim)).toBe("USER");
  });
});

describe("safeReturnTo — open-redirect guard (A01)", () => {
  it.each(["/", "/stamp", "/stamp?cafe=abc", "/admin/cafes#top"])(
    "keeps same-origin path %s",
    (path) => {
      expect(safeReturnTo(path)).toBe(path);
    }
  );

  it.each([
    null,
    undefined,
    "",
    "stamp",
    "//evil.example",
    "/\\evil.example",
    "https://evil.example/stamp",
    "javascript:alert(1)",
    "/stamp\nSet-Cookie: x=1",
    "/\tadmin",
  ])("rejects %o and falls back to /", (path) => {
    expect(safeReturnTo(path)).toBe("/");
  });
});

describe("AC 6.4 — the same 302 sign-in contract for server actions", () => {
  it("builds the sign-in location with an encoded, safe return path", () => {
    expect(signInLocation("/stamp?cafe=a b")).toBe(signIn("/stamp?cafe=a b"));
    expect(signInLocation("//evil.example")).toBe(signIn("/"));
  });

  it("signInRedirect returns status 302 and the sign-in location", () => {
    expect(signInRedirect("/stamp")).toEqual({
      status: 302,
      location: signIn("/stamp"),
    });
  });
});
