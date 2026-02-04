import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { jobService } from "@/lib/services/comments";
import { createJobSchema, jobFiltersSchema } from "@/lib/validations";
import { ApiResponse } from "@/lib/types/api";

// GET /api/v1/comments/jobs - List jobs
export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);

    const filters = jobFiltersSchema.parse({
      accountId: searchParams.get("accountId") || undefined,
      campaignId: searchParams.get("campaignId") || undefined,
      status: searchParams.get("status") || undefined,
      targetPlatform: searchParams.get("targetPlatform") || undefined,
      scheduledAfter: searchParams.get("scheduledAfter")
        ? new Date(searchParams.get("scheduledAfter")!)
        : undefined,
      scheduledBefore: searchParams.get("scheduledBefore")
        ? new Date(searchParams.get("scheduledBefore")!)
        : undefined,
    });

    const pagination = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
    };

    const result = await jobService.list(
      { ...filters, organizationId: ctx.organizationId },
      pagination
    );

    const response: ApiResponse = {
      success: true,
      data: result.jobs,
      meta: result.pagination,
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error instanceof Error ? error.message : "Failed to fetch jobs",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
});

// POST /api/v1/comments/jobs - Create job
export const POST = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const body = await req.json();
    const validated = createJobSchema.parse(body);

    const job = await jobService.create({
      ...validated,
      organizationId: ctx.organizationId,
      scheduledFor: validated.scheduledFor
        ? new Date(validated.scheduledFor)
        : undefined,
    });

    const response: ApiResponse = {
      success: true,
      data: job,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("limit reached")) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: "LIMIT_REACHED",
          message: error.message,
        },
      };
      return NextResponse.json(response, { status: 429 });
    }

    const response: ApiResponse = {
      success: false,
      error: {
        code: "CREATE_FAILED",
        message: error instanceof Error ? error.message : "Failed to create job",
      },
    };
    return NextResponse.json(response, { status: 400 });
  }
});
