import { NextRequest, NextResponse } from "next/server";
import { queueService } from "@/lib/services/queue/queue.service";
import { prisma } from "@/lib/prisma";

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

// GET /api/cron/cleanup - Clean up old data
// Scheduled to run daily at 3 AM UTC via Vercel Cron
export async function GET(req: NextRequest) {
  // In production, verify the cron secret
  if (process.env.NODE_ENV === "production" && !verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  const results = {
    queueJobsDeleted: 0,
    oldAnalyticsDeleted: 0,
    errors: [] as string[],
  };

  try {
    // Clean up completed/failed queue jobs older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const queueCleanup = await queueService.cleanup(sevenDaysAgo);
    results.queueJobsDeleted = queueCleanup.deleted;

    // Clean up analytics older than 90 days (keep recent data)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Clean account analytics
    const accountAnalyticsDeleted = await prisma.accountAnalytics.deleteMany({
      where: { date: { lt: ninetyDaysAgo } },
    });

    // Clean template analytics
    const templateAnalyticsDeleted = await prisma.templateAnalytics.deleteMany({
      where: { date: { lt: ninetyDaysAgo } },
    });

    // Clean campaign analytics
    const campaignAnalyticsDeleted = await prisma.campaignAnalytics.deleteMany({
      where: { date: { lt: ninetyDaysAgo } },
    });

    // Clean daily analytics
    const dailyAnalyticsDeleted = await prisma.dailyAnalytics.deleteMany({
      where: { date: { lt: ninetyDaysAgo } },
    });

    results.oldAnalyticsDeleted =
      accountAnalyticsDeleted.count +
      templateAnalyticsDeleted.count +
      campaignAnalyticsDeleted.count +
      dailyAnalyticsDeleted.count;

    const duration = Date.now() - startTime;

    console.log(
      `Cleanup complete: ${results.queueJobsDeleted} queue jobs, ${results.oldAnalyticsDeleted} analytics records, ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      duration,
      results,
    });
  } catch (error) {
    console.error("Cron cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cleanup failed",
        duration: Date.now() - startTime,
        results,
      },
      { status: 500 }
    );
  }
}
