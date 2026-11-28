/**
 * Route protection decisions for middleware and server actions (Issue #2,
 * AC 1.1 / 5.1 / 6.4). Pure: no Next.js or Clerk imports.
 *
 * Route table (docs/ARCHITECTURE.md §1):
 *   /                   public
 *   /stamp, /concierge  signed-in session required → otherwise 302 sign-in
 *   /admin/*            ADMIN required → signed out 302 sign-in, USER 403
 *
 * `appRole` comes from the Clerk session claim `app_role` and is used for
 * page routing only. Data access is still authorised by RLS, which reads
 * `users.role` from the database (see §2 Identity & JWT contract).
 */

export type AppRole = "USER" | "ADMIN";

export interface AuthSession {
  userId: string;
  appRole: AppRole;
}

export type AccessDecision =
  | { kind: "next" }
  | { kind: "redirect"; location: string }
  | { kind: "forbidden" };

export const SIGN_IN_PATH = "/sign-in";

const ADMIN_PATH = "/admin";
const SESSION_PATHS = ["/stamp", "/concierge", ADMIN_PATH] as const;

/** Only the exact claim `"ADMIN"` grants ADMIN; anything else is USER. */
export function parseAppRole(claim: unknown): AppRole {
  return claim === "ADMIN" ? "ADMIN" : "USER";
}

/**
 * Decode, lowercase, collapse repeated slashes and drop a trailing slash so
 * `/ADMIN`, `//admin` and `/%61dmin` cannot slip past the prefix checks.
 * Returns `null` for malformed percent-encoding.
 */
function normalizePath(pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const collapsed = decoded.toLowerCase().replace(/\/{2,}/g, "/");
  return collapsed.length > 1 ? collapsed.replace(/\/$/, "") : collapsed;
}

const underSegment = (path: string, base: string): boolean =>
  path === base || path.startsWith(`${base}/`);

/** Admin routes. Malformed paths fail closed and count as admin. */
export function isAdminPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === null || underSegment(path, ADMIN_PATH);
}

/** Routes that need a signed-in session (explorer pages and all admin). */
export function isProtectedPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === null || SESSION_PATHS.some((p) => underSegment(path, p));
}

const hasControlChar = (value: string): boolean =>
  [...value].some((ch) => {
    const code = ch.charCodeAt(0);
    return code < 0x20 || code === 0x7f;
  });

/**
 * Same-origin relative path or `/`. Blocks open redirects (`//host`,
 * `/\host`, absolute URLs, `javascript:`) and header injection (CR/LF).
 */
export function safeReturnTo(path: string | null | undefined): string {
  if (typeof path !== "string" || !path.startsWith("/")) return "/";
  if (path.startsWith("//") || path.includes("\\") || hasControlChar(path)) {
    return "/";
  }
  // Defence in depth: the checks above already keep `path` relative, and a
  // relative path against a valid base never throws.
  const base = "http://brewroute.invalid";
  return new URL(path, base).origin === base ? path : "/";
}

export function signInLocation(returnTo: string): string {
  return `${SIGN_IN_PATH}?redirect_url=${encodeURIComponent(
    safeReturnTo(returnTo)
  )}`;
}

/** The 302 sign-in contract shared by middleware and server actions (AC 6.4). */
export function signInRedirect(returnTo: string): {
  status: 302;
  location: string;
} {
  return { status: 302, location: signInLocation(returnTo) };
}

export function decideAccess(
  pathname: string,
  search: string,
  session: AuthSession | null
): AccessDecision {
  if (!isProtectedPath(pathname)) return { kind: "next" };
  if (!session) {
    return { kind: "redirect", location: signInLocation(pathname + search) };
  }
  if (isAdminPath(pathname) && session.appRole !== "ADMIN") {
    return { kind: "forbidden" };
  }
  return { kind: "next" };
}
