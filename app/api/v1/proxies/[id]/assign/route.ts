import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { proxyService } from "@/lib/services/accounts";
import { ApiResponse } from "@/lib/types/api";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const assignSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
});

// POST /api/v1/proxies/:id/assign - Assign proxy to account
export const POST = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const { accountId } = assignSchema.parse(body);

      const account = await proxyService.assignToAccount(
        id,
        accountId,
        ctx.organizationId
      );

      const response: ApiResponse = {
        success: true,
        data: account,
      };

      return NextResponse.json(response);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === "Proxy not found" ||
          error.message === "Account not found")
      ) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: ApiResponse = {
        success: false,
        error: {
          code: "ASSIGN_FAILED",
          message:
            error instanceof Error ? error.message : "Failed to assign proxy",
        },
      };
      return NextResponse.json(response, { status: 400 });
    }
  }
);

// DELETE /api/v1/proxies/:id/assign - Unassign proxy from account
export const DELETE = withAuth(
  async (req: NextRequest, ctx: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const { accountId } = assignSchema.parse(body);

      // Verify proxy belongs to org
      await proxyService.getById(id, ctx.organizationId);

      const account = await proxyService.unassignFromAccount(accountId);

      const response: ApiResponse = {
        success: true,
        data: account,
      };

      return NextResponse.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: "UNASSIGN_FAILED",
          message:
            error instanceof Error ? error.message : "Failed to unassign proxy",
        },
      };
      return NextResponse.json(response, { status: 400 });
    }
  }
);
