import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Redirect root to dashboard
    if (pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Check auth for dashboard routes
    if (pathname.startsWith("/dashboard")) {
        const token = await getToken({ req: request });

        if (!token) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/dashboard/:path*"],
};
