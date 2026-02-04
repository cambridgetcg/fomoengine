import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: Pool | undefined;
};

// Check if connecting to RDS (requires SSL)
const isRds = process.env.DATABASE_URL?.includes("rds.amazonaws.com");

// Serverless (Vercel) needs minimal connections; dev can use more
const isServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME;
const maxConnections = isServerless ? 1 : 3;

function getPool(): Pool {
    if (globalForPrisma.pool) {
        return globalForPrisma.pool;
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isRds ? { rejectUnauthorized: false } : false,
        max: maxConnections,
        min: 0, // Allow pool to shrink to 0 in serverless
        idleTimeoutMillis: 5000, // Release idle connections quickly
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

// Cache prisma client in globalThis for connection reuse across warm starts
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;

export default prisma;
