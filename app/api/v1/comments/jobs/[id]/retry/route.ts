import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { jobService } from "@/lib/services/comments";
import { ApiResponse } from "@/lib/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/v1/comments/jobs/:id/retry - Retry failed job
export const POST = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const job = await jobService.retry(id, ctx.organizationId);

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

      if (
        error instanceof Error &&
        (error.message.includes("Can only retry") ||
          error.message.includes("Maximum retry"))
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
          code: "RETRY_FAILED",
          message: error instanceof Error ? error.message : "Failed to retry job",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);
