import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
            const { userId: clerkUserId } = await auth();

            if (!clerkUserId) {
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

            // Get Clerk user for email
            const clerkUser = await currentUser();
            const email = clerkUser?.emailAddresses[0]?.emailAddress;

            if (!email) {
                return NextResponse.json<ApiResponse<null>>(
                    {
                        success: false,
                        error: {
                            code: "UNAUTHORIZED",
                            message: "No email found for user",
                        },
                    },
                    { status: 401 }
                );
            }

            // Find or create user in database
            let user = await prisma.user.findUnique({
                where: { email },
                include: {
                    organizations: {
                        include: { organization: true },
                    },
                },
            });

            // Auto-create user if not exists (first login via Clerk)
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email,
                        name: clerkUser?.firstName
                            ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
                            : email.split("@")[0],
                        clerkId: clerkUserId,
                        avatarUrl: clerkUser?.imageUrl,
                    },
                    include: {
                        organizations: {
                            include: { organization: true },
                        },
                    },
                });

                // Create default organization for new user
                const org = await prisma.organization.create({
                    data: {
                        name: `${user.name}'s Organization`,
                        slug: `org-${user.id.slice(0, 8)}`,
                    },
                });

                await prisma.organizationMember.create({
                    data: {
                        userId: user.id,
                        organizationId: org.id,
                        role: "OWNER",
                    },
                });

                // Refetch user with organizations
                user = await prisma.user.findUnique({
                    where: { id: user.id },
                    include: {
                        organizations: {
                            include: { organization: true },
                        },
                    },
                });
            }

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

            // Update clerkId if not set (for existing users)
            if (!user.clerkId) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { clerkId: clerkUserId },
                });
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
