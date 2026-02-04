import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { generatorService } from "@/lib/services/comments";
import { generateCommentSchema } from "@/lib/validations";
import { ApiResponse } from "@/lib/types/api";

// POST /api/v1/comments/generate - Generate AI comments
export const POST = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const body = await req.json();
    const validated = generateCommentSchema.parse(body);

    // Add organization context for logging/billing
    console.log(`Generating comments for org: ${ctx.organizationId}`);

    const comments = await generatorService.generate(validated);

    const response: ApiResponse = {
      success: true,
      data: {
        comments,
        input: {
          platform: validated.platform,
          tone: validated.tone,
          fomoType: validated.fomoType,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "GENERATION_FAILED",
        message: error instanceof Error ? error.message : "Failed to generate comments",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
});
