/**
 * Turns an RBAC decision into a middleware response (Issue #2).
 * RED-phase stub: signatures only.
 */
import type { NextRequest, NextResponse } from "next/server";
import type { AccessDecision, AuthSession } from "@/lib/auth/rbac";

export interface MiddlewareAuthState {
  userId: string | null;
  sessionClaims?: unknown;
}

export function sessionFromAuth(
  state: MiddlewareAuthState
): AuthSession | null {
  void state;
  throw new Error("not implemented");
}

export function toResponse(
  decision: AccessDecision,
  req: NextRequest
): NextResponse {
  void decision;
  void req;
  throw new Error("not implemented");
}

export async function handleRequest(
  req: NextRequest,
  getAuth: () => Promise<MiddlewareAuthState>
): Promise<NextResponse> {
  void req;
  void getAuth;
  throw new Error("not implemented");
}
