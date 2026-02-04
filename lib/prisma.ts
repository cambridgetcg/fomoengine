import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: Pool | undefined;
};

// Check if connecting to RDS (requires SSL)
const isRds = process.env.DATABASE_URL?.includes("rds.amazonaws.com");

function getPool(): Pool {
    if (globalForPrisma.pool) {
        return globalForPrisma.pool;
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isRds ? { rejectUnauthorized: false } : false,
        max: 3, // Keep pool small to prevent exhaustion
        min: 1,
        idleTimeoutMillis: 10000, // Release idle connections quickly
        connectionTimeoutMillis: 5000,
    });

    globalForPrisma.pool = pool;
    return pool;
}

function createPrismaClient(): PrismaClient {
    const pool = getPool();
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;
