import { NextResponse, type NextRequest } from "next/server";

/**
 * The shield is fully public and auth-independent — protection from manipulation
 * is a safety good, so the checker requires no account, no login, no Clerk, no DB.
 * Root lands on the checker; everything else passes through. A future paid
 * dashboard must introduce auth only inside its own scope.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/check", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
