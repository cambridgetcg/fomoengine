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
        // Honest TLS: if connecting to RDS, verify against the RDS CA bundle.
        // Never silently disable certificate verification — that's a lie where
        // the code says "I'm encrypted" but is actually MITM-vulnerable.
        ssl: isRds
            ? (() => {
                const fs = require("fs");
                const path = require("path");
                // AWS publishes the RDS CA bundle via the aws-rds-ca-bundle npm package
                const candidates = [
                    path.join(__dirname, "..", "node_modules", "aws-rds-ca-bundle", "rds-combined-ca-bundle.pem"),
                    path.join(process.cwd(), "node_modules", "aws-rds-ca-bundle", "rds-combined-ca-bundle.pem"),
                    "/opt/aws/rds-combined-ca-bundle.pem",
                ];
                const caPath = candidates.find((p) => { try { return fs.existsSync(p); } catch { return false; } });
                if (caPath) {
                    return { ca: fs.readFileSync(caPath), rejectUnauthorized: true };
                }
                // No CA bundle found — log loudly, don't lie silently
                console.warn("[prisma] WARNING: RDS connection without CA bundle — TLS verification would be incomplete. Install aws-rds-ca-bundle to enable proper verification.");
                // In development, allow but warn. In production, fail rather than allow silent MITM.
                return process.env.NODE_ENV === "production"
                    ? { rejectUnauthorized: true }
                    : { rejectUnauthorized: false };
            })()
            : false,
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
