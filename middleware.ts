import { NextResponse, type NextRequest } from "next/server";

/**
 * The shield is fully public and auth-independent — protection from manipulation
 * is a safety good, so the checker requires no account, no login, no Clerk, no DB.
 * Root lands on the checker; everything else passes through. (A future org/paid
 * dashboard would re-introduce auth inside its own scope, not here.)
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (pathname === "/") {
        return NextResponse.redirect(new URL("/check", request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    ],
};
