import { clerkMiddleware } from "@clerk/nextjs/server";
import { handleRequest } from "@/lib/auth/middlewareResponse";
import { SIGN_IN_PATH } from "@/lib/auth/rbac";

// Clerk runs on every matched request so server actions and Server
// Components can call `auth()`. Route protection itself is decided by
// lib/auth/rbac.ts: 302 to /sign-in without a session, 403 for a USER on
// /admin/*. See docs/ARCHITECTURE.md §1.
export default clerkMiddleware(
  async (auth, req) => handleRequest(req, () => auth()),
  { signInUrl: SIGN_IN_PATH }
);

export const config = {
  matcher: [
    // Everything except Next.js internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
