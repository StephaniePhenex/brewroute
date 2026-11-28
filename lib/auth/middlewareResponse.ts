/**
 * Turns an RBAC decision into a middleware response (Issue #2).
 *
 * Status codes are explicit: `NextResponse.redirect` and Clerk both default
 * to 307, but the route contract (docs/ARCHITECTURE.md §1) is 302 for a
 * missing session and 403 for a signed-in USER on /admin/*.
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  decideAccess,
  isProtectedPath,
  parseAppRole,
  type AccessDecision,
  type AuthSession,
} from "@/lib/auth/rbac";

/** The subset of Clerk's middleware `auth()` result that routing needs. */
export interface MiddlewareAuthState {
  userId: string | null;
  sessionClaims?: unknown;
}

/** Clerk auth state → RBAC session. The role comes from `app_role` only. */
export function sessionFromAuth(
  state: MiddlewareAuthState
): AuthSession | null {
  if (!state.userId) return null;
  const claims = state.sessionClaims;
  const appRole =
    typeof claims === "object" && claims !== null && "app_role" in claims
      ? parseAppRole(claims.app_role)
      : "USER";
  return { userId: state.userId, appRole };
}

export function toResponse(
  decision: AccessDecision,
  req: NextRequest
): NextResponse {
  switch (decision.kind) {
    case "redirect":
      return NextResponse.redirect(new URL(decision.location, req.url), 302);
    case "forbidden":
      return new NextResponse("Forbidden", {
        status: 403,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    case "next":
      return NextResponse.next();
  }
}

/** Public routes skip `auth()`; protected routes go through `decideAccess`. */
export async function handleRequest(
  req: NextRequest,
  getAuth: () => Promise<MiddlewareAuthState>
): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  if (!isProtectedPath(pathname)) return NextResponse.next();
  const session = sessionFromAuth(await getAuth());
  return toResponse(decideAccess(pathname, search, session), req);
}
