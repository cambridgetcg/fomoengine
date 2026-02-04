import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { accountService } from "@/lib/services/accounts";
import { updateAccountSchema } from "@/lib/validations";
import { ApiResponse } from "@/lib/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/accounts/:id - Get account details
export const GET = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const account = await accountService.getById(id, ctx.organizationId);

      const response: ApiResponse = {
        success: true,
        data: account,
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
          code: "FETCH_FAILED",
          message: error instanceof Error ? error.message : "Failed to fetch account",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);

// PATCH /api/v1/accounts/:id - Update account
export const PATCH = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validated = updateAccountSchema.parse(body);

      const account = await accountService.update(id, ctx.organizationId, validated);

      const response: ApiResponse = {
        success: true,
        data: account,
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
          code: "UPDATE_FAILED",
          message: error instanceof Error ? error.message : "Failed to update account",
        },
      };
      return NextResponse.json(response, { status: 400 });
    }
  }
);

// DELETE /api/v1/accounts/:id - Delete account
export const DELETE = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      await accountService.delete(id, ctx.organizationId);

      const response: ApiResponse = {
        success: true,
        data: { deleted: true },
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
          code: "DELETE_FAILED",
          message: error instanceof Error ? error.message : "Failed to delete account",
        },
      };
      return NextResponse.json(response, { status: 500 });
    }
  }
);
