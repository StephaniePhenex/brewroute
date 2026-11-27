import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { SIGN_IN_PATH } from "@/lib/auth/rbac";

export const metadata: Metadata = { title: "Sign in · BrewRoute" };

// Google is the only sign-in method enabled on the Clerk instance (AC 5.1).
// Clerk reads `?redirect_url=` (set by middleware via safeReturnTo) and
// returns the explorer to the page they were trying to reach. The catch-all
// segment also serves Clerk's /sign-in/sso-callback step.
export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <SignIn routing="path" path={SIGN_IN_PATH} />
    </main>
  );
}
