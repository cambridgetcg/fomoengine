import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { templateService, jobService } from "@/lib/services/comments";
import { ApiResponse } from "@/lib/types/api";

// GET /api/v1/comments/stats - Get comment statistics
export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateRange =
      startDate && endDate
        ? { start: new Date(startDate), end: new Date(endDate) }
        : undefined;

    const [templateStats, jobStats] = await Promise.all([
      templateService.getStats(ctx.organizationId),
      jobService.getStats(ctx.organizationId, dateRange),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        templates: templateStats,
        jobs: jobStats,
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
