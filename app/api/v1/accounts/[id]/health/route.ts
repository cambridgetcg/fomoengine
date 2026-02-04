import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { healthService, accountService } from "@/lib/services/accounts";
import { ApiResponse } from "@/lib/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/accounts/:id/health - Get account health
export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;

      // Verify account belongs to organization
      await accountService.getById(id, ctx.organizationId);

      const health = await healthService.checkAccountHealth(id);

      const response: ApiResponse = {
        success: true,
        data: health,
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Account not found") {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Account not found",
          },
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: ApiResponse = {
        success: false,
        error: {
          code: "HEALTH_CHECK_FAILED",
          message: error instanceof Error ? error.message : "Health check failed",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);

// POST /api/v1/accounts/:id/health - Trigger health check
export const POST = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;

      // Verify account belongs to organization
      await accountService.getById(id, ctx.organizationId);

      const result = await healthService.checkAccountHealth(id);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Account not found") {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Account not found",
          },
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: ApiResponse = {
        success: false,
        error: {
          code: "HEALTH_CHECK_FAILED",
          message: error instanceof Error ? error.message : "Health check failed",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);
