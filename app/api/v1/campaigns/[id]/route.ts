import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { campaignService } from "@/lib/services/campaigns";
import { updateCampaignSchema } from "@/lib/validations";
import { ApiResponse } from "@/lib/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/campaigns/:id
export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const campaign = await campaignService.getById(id, ctx.organizationId);

      const response: ApiResponse = {
        success: true,
        data: campaign,
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Campaign not found") {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Campaign not found",
          },
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: ApiResponse = {
        success: false,
        error: {
          code: "FETCH_FAILED",
          message: error instanceof Error ? error.message : "Failed to fetch campaign",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);

// PATCH /api/v1/campaigns/:id
export const PATCH = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validated = updateCampaignSchema.parse(body);

      const campaign = await campaignService.update(id, ctx.organizationId, {
        ...validated,
        startDate: validated.startDate ? new Date(validated.startDate) : undefined,
        endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      });

      const response: ApiResponse = {
        success: true,
        data: campaign,
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Campaign not found") {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Campaign not found",
          },
        };
        return NextResponse.json(response, { status: 404 });
      }

      if (error instanceof Error && error.message.includes("archived")) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "INVALID_STATE",
            message: error.message,
          },
        };
        return NextResponse.json(response, { status: 400 });
      }

      const response: ApiResponse = {
        success: false,
        error: {
          code: "UPDATE_FAILED",
          message: error instanceof Error ? error.message : "Failed to update campaign",
        },
      };
      return NextResponse.json(response, { status: 400 });
    }
  }
);

// DELETE /api/v1/campaigns/:id
export const DELETE = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      await campaignService.delete(id, ctx.organizationId);

      const response: ApiResponse = {
        success: true,
        data: { deleted: true },
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Campaign not found") {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Campaign not found",
          },
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: ApiResponse = {
        success: false,
        error: {
          code: "DELETE_FAILED",
          message: error instanceof Error ? error.message : "Failed to delete campaign",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);
