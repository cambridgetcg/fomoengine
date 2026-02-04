import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { campaignService } from "@/lib/services/campaigns";
import { ApiResponse } from "@/lib/types/api";

// GET /api/v1/campaigns/stats - Get campaign statistics
export const GET = withAuth(async (_req: NextRequest, ctx: AuthContext) => {
  try {
    const stats = await campaignService.getStats(ctx.organizationId);

    const response: ApiResponse = {
      success: true,
      data: stats,
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
