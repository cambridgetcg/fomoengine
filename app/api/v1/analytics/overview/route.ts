import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { overviewService } from "@/lib/services/analytics";
import { ApiResponse } from "@/lib/types/api";

// GET /api/v1/analytics/overview - Get dashboard overview
export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const dashboard = searchParams.get("dashboard") === "true";

    const data = dashboard
      ? await overviewService.getDashboardMetrics(ctx.organizationId)
      : await overviewService.getOverview(ctx.organizationId);

    const response: ApiResponse = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "OVERVIEW_FAILED",
        message: error instanceof Error ? error.message : "Failed to fetch overview",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
});
