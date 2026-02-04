import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { templateService } from "@/lib/services/comments";
import { updateTemplateSchema } from "@/lib/validations";
import { ApiResponse } from "@/lib/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/comments/templates/:id
export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const template = await templateService.getById(id, ctx.organizationId);

      const response: ApiResponse = {
        success: true,
        data: template,
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Template not found") {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Template not found",
          },
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: ApiResponse = {
        success: false,
        error: {
          code: "FETCH_FAILED",
          message: error instanceof Error ? error.message : "Failed to fetch template",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);

// PATCH /api/v1/comments/templates/:id
export const PATCH = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validated = updateTemplateSchema.parse(body);

      const template = await templateService.update(id, ctx.organizationId, validated);

      const response: ApiResponse = {
        success: true,
        data: template,
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Template not found") {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Template not found",
          },
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: ApiResponse = {
        success: false,
        error: {
          code: "UPDATE_FAILED",
          message: error instanceof Error ? error.message : "Failed to update template",
        },
      };
      return NextResponse.json(response, { status: 400 });
    }
  }
);

// DELETE /api/v1/comments/templates/:id
export const DELETE = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      await templateService.delete(id, ctx.organizationId);

      const response: ApiResponse = {
        success: true,
        data: { deleted: true },
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Template not found") {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Template not found",
          },
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: ApiResponse = {
        success: false,
        error: {
          code: "DELETE_FAILED",
          message: error instanceof Error ? error.message : "Failed to delete template",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);
