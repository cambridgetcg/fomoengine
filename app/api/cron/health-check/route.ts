import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { healthService } from "@/lib/services/accounts";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn("CRON_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// GET /api/cron/health-check - Run health checks on all accounts
// Scheduled to run hourly via Vercel Cron
export async function GET(req: NextRequest) {
  // In production, verify the cron secret
  if (process.env.NODE_ENV === "production" && !verifyCronSecret(req)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const startTime = Date.now();

  try {
    // Get all organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true },
    });

    const results = [];

    for (const org of organizations) {
      try {
        const result = await healthService.checkAllAccountsHealth(org.id);
        results.push({
          organizationId: org.id,
          organizationName: org.name,
          ...result,
        });
      } catch (error) {
        console.error(`Health check failed for org ${org.id}:`, error);
        results.push({
          organizationId: org.id,
          organizationName: org.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const duration = Date.now() - startTime;

    // Log summary
    const totalChecked = results.reduce(
      (sum, r) => sum + ("checked" in r ? r.checked : 0),
      0
    );
    const totalHealthy = results.reduce(
      (sum, r) => sum + ("healthy" in r ? r.healthy : 0),
      0
    );

    console.log(
      `Health check complete: ${totalChecked} accounts checked, ${totalHealthy} healthy, ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      duration,
      summary: {
        organizations: organizations.length,
        totalChecked,
        totalHealthy,
        totalUnhealthy: totalChecked - totalHealthy,
      },
      results,
    });
  } catch (error) {
    console.error("Cron health check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Health check failed",
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
