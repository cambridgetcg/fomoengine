import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { jobService } from "@/lib/services/comments";
import { ApiResponse } from "@/lib/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/comments/jobs/:id
export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const job = await jobService.getById(id, ctx.organizationId);

      const response: ApiResponse = {
        success: true,
        data: job,
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Job not found") {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Job not found",
          },
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: ApiResponse = {
        success: false,
        error: {
          code: "FETCH_FAILED",
          message: error instanceof Error ? error.message : "Failed to fetch job",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);

// DELETE /api/v1/comments/jobs/:id - Cancel job
export const DELETE = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      await jobService.cancel(id, ctx.organizationId);

      const response: ApiResponse = {
        success: true,
        data: { cancelled: true },
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Job not found") {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Job not found",
          },
        };
        return NextResponse.json(response, { status: 404 });
      }

      if (error instanceof Error && error.message.includes("Can only cancel")) {
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
          code: "CANCEL_FAILED",
          message: error instanceof Error ? error.message : "Failed to cancel job",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);
