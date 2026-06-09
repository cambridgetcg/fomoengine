/**
 * Mint a public-API key.
 *
 *   npx tsx scripts/mint-api-key.ts "Acme prod" --tier STARTER [--quota 10000]
 *
 * The secret is printed ONCE and is never stored in raw form — copy it immediately.
 * We persist only sha256(secret), so a leaked database can't reveal anyone's key.
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { generateKey } from "@/lib/services/api-keys/api-key.service";
import type { ApiTier } from "@prisma/client";

const DEFAULT_QUOTA: Record<ApiTier, number> = { FREE: 1000, STARTER: 10000, PRO: 100000 };

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const name = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : undefined;
  if (!name) {
    console.error('Usage: npx tsx scripts/mint-api-key.ts "<name>" [--tier FREE|STARTER|PRO] [--quota <n>]');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL is not set. Add a Postgres connection string to .env, then retry.");
    process.exit(1);
  }

  const tier = (flag("--tier") || "STARTER").toUpperCase() as ApiTier;
  if (!["FREE", "STARTER", "PRO"].includes(tier)) {
    console.error(`✗ Invalid --tier "${tier}". Use FREE, STARTER, or PRO.`);
    process.exit(1);
  }
  const quotaArg = flag("--quota");
  const monthlyQuota = quotaArg !== undefined ? parseInt(quotaArg, 10) : DEFAULT_QUOTA[tier];
  if (Number.isNaN(monthlyQuota) || monthlyQuota < 0) {
    console.error(`✗ Invalid --quota "${quotaArg}". Use a non-negative integer (0 = unlimited).`);
    process.exit(1);
  }

  const { secret, keyHash, prefix } = generateKey();
  const key = await prisma.apiKey.create({ data: { name, keyHash, prefix, tier, monthlyQuota } });

  console.log("\n✓ API key created.\n");
  console.log(`  name    ${key.name}`);
  console.log(`  tier    ${key.tier}`);
  console.log(`  quota   ${monthlyQuota === 0 ? "unlimited" : `${monthlyQuota} checks / month`}`);
  console.log(`  id      ${key.id}`);
  console.log("\n  SECRET — shown once, copy it now:\n");
  console.log(`    ${secret}\n`);
  console.log(`  Test it:\n`);
  console.log(`    curl -s https://YOUR_HOST/api/v1/check \\`);
  console.log(`      -H "Authorization: Bearer ${secret}" \\`);
  console.log(`      -H "Content-Type: application/json" \\`);
  console.log(`      -d '{"text":"Only 2 left! Offer ends in 04:59."}'\n`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("✗ Failed to mint key:", err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
