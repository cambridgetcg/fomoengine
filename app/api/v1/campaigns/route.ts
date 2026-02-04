import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { campaignService } from "@/lib/services/campaigns";
import { createCampaignSchema, campaignFiltersSchema } from "@/lib/validations";
import { ApiResponse } from "@/lib/types/api";

// GET /api/v1/campaigns - List campaigns
export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);

    const filters = campaignFiltersSchema.parse({
      status: searchParams.get("status") || undefined,
      targetPlatform: searchParams.get("targetPlatform") || undefined,
      search: searchParams.get("search") || undefined,
    });

    const pagination = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
    };

    const result = await campaignService.list(
      { ...filters, organizationId: ctx.organizationId },
      pagination
    );

    const response: ApiResponse = {
      success: true,
      data: result.campaigns,
      meta: result.pagination,
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error instanceof Error ? error.message : "Failed to fetch campaigns",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
});

// POST /api/v1/campaigns - Create campaign
export const POST = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const body = await req.json();
    const validated = createCampaignSchema.parse(body);

    const campaign = await campaignService.create({
      ...validated,
      organizationId: ctx.organizationId,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
    });

    const response: ApiResponse = {
      success: true,
      data: campaign,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "CREATE_FAILED",
        message: error instanceof Error ? error.message : "Failed to create campaign",
      },
    };
    return NextResponse.json(response, { status: 400 });
  }
});
