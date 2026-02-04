import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/lib/services/accounts";

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

// GET /api/cron/daily-reset - Reset daily counters
// Scheduled to run at midnight UTC via Vercel Cron
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
    // Reset daily comment counts for all accounts
    const result = await accountService.resetDailyComments();

    const duration = Date.now() - startTime;

    console.log(
      `Daily reset complete: ${result.count} accounts reset, ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      duration,
      accountsReset: result.count,
    });
  } catch (error) {
    console.error("Cron daily reset error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Daily reset failed",
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
