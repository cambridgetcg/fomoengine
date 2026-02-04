import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/setup - Bootstrap first user (only works if no users exist)
export async function POST(req: NextRequest) {
    try {
        // Check if any users exist
        const existingUsers = await prisma.user.count();

        if (existingUsers > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "SETUP_COMPLETE",
                        message: "Setup already completed. Users exist in database.",
                    },
                },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { email, password, name, organizationName } = body;

        if (!email || !password) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Email and password are required",
                    },
                },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create organization
        const orgSlug = (organizationName || "default")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        const organization = await prisma.organization.create({
            data: {
                name: organizationName || "Default Organization",
                slug: orgSlug,
            },
        });

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split("@")[0],
            },
        });

        // Link user to organization as owner
        await prisma.organizationMember.create({
            data: {
                userId: user.id,
                organizationId: organization.id,
                role: "owner",
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                organization: {
                    id: organization.id,
                    name: organization.name,
                    slug: organization.slug,
                },
            },
            message: "Setup complete. You can now sign in.",
        });
    } catch (error) {
        console.error("Setup error:", error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "SETUP_FAILED",
                    message: error instanceof Error ? error.message : "Setup failed",
                },
            },
            { status: 500 }
        );
    }
}

// GET /api/setup - Check setup status
export async function GET() {
    try {
        const userCount = await prisma.user.count();

        return NextResponse.json({
            success: true,
            data: {
                setupRequired: userCount === 0,
                userCount,
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "CHECK_FAILED",
                    message: error instanceof Error ? error.message : "Failed to check setup status",
                },
            },
            { status: 500 }
        );
    }
}
