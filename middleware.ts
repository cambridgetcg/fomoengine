import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/setup(.*)",
    "/api/webhook(.*)",
    // The shield is free + anonymous for everyone — no auth on the public surfaces.
    "/check(.*)",
    "/api/v1/check(.*)",
    "/learn(.*)",
]);

const isApiRoute = createRouteMatcher(["/api/(.*)"]);

export default clerkMiddleware(async (auth, request) => {
    const { pathname } = request.nextUrl;

    // Root lands on the public checker — the front door is the shield, not a dashboard.
    if (pathname === "/") {
        return NextResponse.redirect(new URL("/check", request.url));
    }

    // Allow public routes
    if (isPublicRoute(request)) {
        return NextResponse.next();
    }

    // Protect all other routes
    const { userId } = await auth();

    if (!userId && !isPublicRoute(request)) {
        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set("redirect_url", pathname);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
