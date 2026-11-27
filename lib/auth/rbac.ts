/**
 * Route protection decisions (Issue #2). RED-phase stub: signatures only.
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

export function parseAppRole(claim: unknown): AppRole {
  void claim;
  throw new Error("not implemented");
}

export function isProtectedPath(pathname: string): boolean {
  void pathname;
  throw new Error("not implemented");
}

export function isAdminPath(pathname: string): boolean {
  void pathname;
  throw new Error("not implemented");
}

export function safeReturnTo(path: string | null | undefined): string {
  void path;
  throw new Error("not implemented");
}

export function signInLocation(returnTo: string): string {
  void returnTo;
  throw new Error("not implemented");
}

export function signInRedirect(returnTo: string): {
  status: 302;
  location: string;
} {
  void returnTo;
  throw new Error("not implemented");
}

export function decideAccess(
  pathname: string,
  search: string,
  session: AuthSession | null
): AccessDecision {
  void pathname;
  void search;
  void session;
  throw new Error("not implemented");
}
