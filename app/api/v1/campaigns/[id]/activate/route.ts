import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { campaignService } from "@/lib/services/campaigns";
import { ApiResponse } from "@/lib/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/v1/campaigns/:id/activate - Activate campaign
export const POST = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const campaign = await campaignService.activate(id, ctx.organizationId);

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

      if (
        error instanceof Error &&
        (error.message.includes("Invalid status") ||
          error.message.includes("must have"))
      ) {
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
          code: "ACTIVATE_FAILED",
          message: error instanceof Error ? error.message : "Failed to activate campaign",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);

// DELETE /api/v1/campaigns/:id/activate - Pause campaign
export const DELETE = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const campaign = await campaignService.pause(id, ctx.organizationId);

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
          code: "PAUSE_FAILED",
          message: error instanceof Error ? error.message : "Failed to pause campaign",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);
