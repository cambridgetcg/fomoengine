import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { proxyService } from "@/lib/services/accounts";
import { updateProxySchema } from "@/lib/validations";
import { ApiResponse } from "@/lib/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/proxies/:id - Get proxy details
export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const proxy = await proxyService.getById(id, ctx.organizationId);

      const response: ApiResponse = {
        success: true,
        data: proxy,
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Proxy not found") {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Proxy not found",
          },
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: ApiResponse = {
        success: false,
        error: {
          code: "FETCH_FAILED",
          message: error instanceof Error ? error.message : "Failed to fetch proxy",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);

// PATCH /api/v1/proxies/:id - Update proxy
export const PATCH = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validated = updateProxySchema.parse(body);

      const proxy = await proxyService.update(id, ctx.organizationId, validated);

      const response: ApiResponse = {
        success: true,
        data: proxy,
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Proxy not found") {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Proxy not found",
          },
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: ApiResponse = {
        success: false,
        error: {
          code: "UPDATE_FAILED",
          message: error instanceof Error ? error.message : "Failed to update proxy",
        },
      };
      return NextResponse.json(response, { status: 400 });
    }
  }
);

// DELETE /api/v1/proxies/:id - Delete proxy
export const DELETE = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      await proxyService.delete(id, ctx.organizationId);

      const response: ApiResponse = {
        success: true,
        data: { deleted: true },
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Proxy not found") {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Proxy not found",
          },
        };
        return NextResponse.json(response, { status: 404 });
      }

      if (error instanceof Error && error.message.includes("Cannot delete")) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "PROXY_IN_USE",
            message: error.message,
          },
        };
        return NextResponse.json(response, { status: 400 });
      }

      const response: ApiResponse = {
        success: false,
        error: {
          code: "DELETE_FAILED",
          message: error instanceof Error ? error.message : "Failed to delete proxy",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);
