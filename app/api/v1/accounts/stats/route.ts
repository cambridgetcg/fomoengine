import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { accountService, healthService } from "@/lib/services/accounts";
import { ApiResponse } from "@/lib/types/api";

// GET /api/v1/accounts/stats - Get account statistics
export const GET = withAuth(async (_req: NextRequest, ctx: AuthContext) => {
  try {
    const [accountStats, healthSummary] = await Promise.all([
      accountService.getStats(ctx.organizationId),
      healthService.getHealthSummary(ctx.organizationId),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        accounts: accountStats,
        health: healthSummary,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "STATS_FAILED",
        message: error instanceof Error ? error.message : "Failed to fetch stats",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
});
