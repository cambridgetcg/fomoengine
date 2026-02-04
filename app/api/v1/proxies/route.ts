import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { proxyService } from "@/lib/services/accounts";
import { createProxySchema, proxyFiltersSchema } from "@/lib/validations";
import { ApiResponse } from "@/lib/types/api";

// GET /api/v1/proxies - List proxies
export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);

    const filters = proxyFiltersSchema.parse({
      status: searchParams.get("status") || undefined,
      country: searchParams.get("country") || undefined,
      location: searchParams.get("location") || undefined,
      provider: searchParams.get("provider") || undefined,
    });

    const pagination = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
    };

    const result = await proxyService.list(
      { ...filters, organizationId: ctx.organizationId },
      pagination
    );

    const response: ApiResponse = {
      success: true,
      data: result.proxies,
      meta: result.pagination,
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error instanceof Error ? error.message : "Failed to fetch proxies",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
});

// POST /api/v1/proxies - Create proxy
export const POST = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const body = await req.json();
    const validated = createProxySchema.parse(body);

    const proxy = await proxyService.create({
      ...validated,
      organizationId: ctx.organizationId,
    });

    const response: ApiResponse = {
      success: true,
      data: proxy,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "CREATE_FAILED",
        message: error instanceof Error ? error.message : "Failed to create proxy",
      },
    };
    return NextResponse.json(response, { status: 400 });
  }
});
