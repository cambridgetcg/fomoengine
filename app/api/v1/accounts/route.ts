import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { accountService } from "@/lib/services/accounts";
import { createAccountSchema, accountFiltersSchema } from "@/lib/validations";
import { ApiResponse } from "@/lib/types/api";

// GET /api/v1/accounts - List accounts
export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);

    const filters = accountFiltersSchema.parse({
      platform: searchParams.get("platform") || undefined,
      status: searchParams.get("status") || undefined,
      warmupPhase: searchParams.get("warmupPhase") || undefined,
      search: searchParams.get("search") || undefined,
    });

    const pagination = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
    };

    const result = await accountService.list(
      { ...filters, organizationId: ctx.organizationId },
      pagination
    );

    const response: ApiResponse = {
      success: true,
      data: result.accounts,
      meta: result.pagination,
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error instanceof Error ? error.message : "Failed to fetch accounts",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
});

// POST /api/v1/accounts - Create account
export const POST = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const body = await req.json();
    const validated = createAccountSchema.parse(body);

    const account = await accountService.create({
      ...validated,
      organizationId: ctx.organizationId,
    });

    const response: ApiResponse = {
      success: true,
      data: account,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: "DUPLICATE_ACCOUNT",
          message: error.message,
        },
      };
      return NextResponse.json(response, { status: 409 });
    }

    const response: ApiResponse = {
      success: false,
      error: {
        code: "CREATE_FAILED",
        message: error instanceof Error ? error.message : "Failed to create account",
      },
    };
    return NextResponse.json(response, { status: 400 });
  }
});
