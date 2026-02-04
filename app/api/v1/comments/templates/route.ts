import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { templateService } from "@/lib/services/comments";
import { createTemplateSchema, templateFiltersSchema } from "@/lib/validations";
import { ApiResponse } from "@/lib/types/api";

// GET /api/v1/comments/templates - List templates
export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);

    const filters = templateFiltersSchema.parse({
      platform: searchParams.get("platform") || undefined,
      tone: searchParams.get("tone") || undefined,
      fomoType: searchParams.get("fomoType") || undefined,
      isActive: searchParams.get("isActive")
        ? searchParams.get("isActive") === "true"
        : undefined,
      search: searchParams.get("search") || undefined,
    });

    const pagination = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
    };

    const result = await templateService.list(
      { ...filters, organizationId: ctx.organizationId },
      pagination
    );

    const response: ApiResponse = {
      success: true,
      data: result.templates,
      meta: result.pagination,
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error instanceof Error ? error.message : "Failed to fetch templates",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
});

// POST /api/v1/comments/templates - Create template
export const POST = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const body = await req.json();
    const validated = createTemplateSchema.parse(body);

    const template = await templateService.create({
      ...validated,
      organizationId: ctx.organizationId,
    });

    const response: ApiResponse = {
      success: true,
      data: template,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "CREATE_FAILED",
        message: error instanceof Error ? error.message : "Failed to create template",
      },
    };
    return NextResponse.json(response, { status: 400 });
  }
});
