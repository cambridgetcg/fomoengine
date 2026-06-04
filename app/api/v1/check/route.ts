/**
 * POST /api/v1/check — the public, anonymous manipulation checker.
 *
 * No auth (NOT withAuth): protection from manipulation is a safety good, so the
 * core checker is free and open to everyone, no account, no cookie. We validate
 * + cap length, run the detector, and return the envelope. We log NOTHING that
 * identifies a person and we store NONE of the pasted content.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { detectionService } from "@/lib/services/detection/detection.service";
import { ApiResponse } from "@/lib/types/api";

export const runtime = "nodejs";

const checkSchema = z.object({
  text: z
    .string()
    .min(1, "Paste something to check first.")
    .max(20000, "That's longer than I read at once — paste the key part (an ad, a message, a few reviews)."),
  lang: z.string().max(16).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = checkSchema.parse(body);

    const result = await detectionService.analyze(text);

    const response: ApiResponse = { success: true, data: result };
    return NextResponse.json(response);
  } catch (error) {
    const isValidation = error instanceof z.ZodError;
    const response: ApiResponse = {
      success: false,
      error: {
        code: isValidation ? "INVALID_INPUT" : "CHECK_FAILED",
        message: isValidation
          ? error.issues[0]?.message ?? "Please paste some text to check."
          : "Something went wrong reading that. Please try again.",
      },
    };
    return NextResponse.json(response, { status: isValidation ? 400 : 500 });
  }
}
