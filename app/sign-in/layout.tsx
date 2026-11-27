import { ClerkProvider } from "@clerk/nextjs";
import { SIGN_IN_PATH } from "@/lib/auth/rbac";

// ClerkProvider is scoped to the sign-in route so the root layout (Issue 4)
// stays untouched in Sprint 1. Middleware and server `auth()` don't need it.
export default function SignInLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider signInUrl={SIGN_IN_PATH} signInFallbackRedirectUrl="/">
      {children}
    </ClerkProvider>
  );
}
