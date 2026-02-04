import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create test organization
    const org = await prisma.organization.upsert({
        where: { slug: "test-org" },
        update: {},
        create: {
            name: "Test Organization",
            slug: "test-org",
        },
    });

    // Create test user
    const user = await prisma.user.upsert({
        where: { email: "test@fomoengine.com" },
        update: {},
        create: {
            email: "test@fomoengine.com",
            name: "Test User",
            password: hashedPassword,
        },
    });

    // Link user to organization
    await prisma.organizationMember.upsert({
        where: {
            userId_organizationId: {
                userId: user.id,
                organizationId: org.id,
            },
        },
        update: {},
        create: {
            userId: user.id,
            organizationId: org.id,
            role: "owner",
        },
    });

    console.log("Seeded test user:");
    console.log("  Email: test@fomoengine.com");
    console.log("  Password: password123");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await pool.end();
        await prisma.$disconnect();
    });
