import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { ApiResponse, AuthContext } from "@/lib/types/api";

export type { AuthContext } from "@/lib/types/api";

// Handler for routes without params
export type AuthenticatedHandler = (
    req: NextRequest,
    context: AuthContext
) => Promise<NextResponse>;

// Handler for routes with params (like /api/v1/accounts/[id])
export type AuthenticatedHandlerWithParams<T> = (
    req: NextRequest,
    context: AuthContext,
    routeContext: T
) => Promise<NextResponse>;

// Overloaded withAuth function
export function withAuth(handler: AuthenticatedHandler): (req: NextRequest) => Promise<NextResponse>;
export function withAuth<T>(handler: AuthenticatedHandlerWithParams<T>): (req: NextRequest, routeContext: T) => Promise<NextResponse>;
export function withAuth<T>(
    handler: AuthenticatedHandler | AuthenticatedHandlerWithParams<T>
) {
    return async (req: NextRequest, routeContext?: T): Promise<NextResponse> => {
        try {
            const session = await getServerSession(authOptions);

            if (!session?.user?.email) {
                return NextResponse.json<ApiResponse<null>>(
                    {
                        success: false,
                        error: {
                            code: "UNAUTHORIZED",
                            message: "Not authenticated",
                        },
                    },
                    { status: 401 }
                );
            }

            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                include: {
                    organizations: {
                        include: { organization: true },
                    },
                },
            });

            if (!user) {
                return NextResponse.json<ApiResponse<null>>(
                    {
                        success: false,
                        error: {
                            code: "USER_NOT_FOUND",
                            message: "User not found",
                        },
                    },
                    { status: 404 }
                );
            }

            // Get organization from header or default to first
            const orgId =
                req.headers.get("x-organization-id") ||
                user.organizations[0]?.organizationId;

            if (!orgId) {
                return NextResponse.json<ApiResponse<null>>(
                    {
                        success: false,
                        error: {
                            code: "NO_ORGANIZATION",
                            message: "No organization found",
                        },
                    },
                    { status: 403 }
                );
            }

            const membership = user.organizations.find(
                (m: typeof user.organizations[number]) => m.organizationId === orgId
            );

            if (!membership) {
                return NextResponse.json<ApiResponse<null>>(
                    {
                        success: false,
                        error: {
                            code: "FORBIDDEN",
                            message: "Not a member of this organization",
                        },
                    },
                    { status: 403 }
                );
            }

            const authContext: AuthContext = {
                userId: user.id,
                organizationId: orgId,
                role: membership.role,
            };

            if (routeContext !== undefined) {
                return (handler as AuthenticatedHandlerWithParams<T>)(req, authContext, routeContext);
            }
            return (handler as AuthenticatedHandler)(req, authContext);
        } catch (error) {
            console.error("Auth middleware error:", error);
            return NextResponse.json<ApiResponse<null>>(
                {
                    success: false,
                    error: {
                        code: "INTERNAL_ERROR",
                        message: "Authentication failed",
                    },
                },
                { status: 500 }
            );
        }
    };
}

// Helper to create JSON responses
export function apiResponse<T>(
    data: T,
    status: number = 200
): NextResponse<ApiResponse<T>> {
    return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
    code: string,
    message: string,
    status: number = 400,
    details?: unknown
): NextResponse<ApiResponse<null>> {
    return NextResponse.json(
        { success: false, error: { code, message, details } },
        { status }
    );
}
