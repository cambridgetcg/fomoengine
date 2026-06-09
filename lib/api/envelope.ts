/**
 * Tiny JSON-envelope helpers for the PUBLIC API routes.
 *
 * Deliberately separate from lib/middleware/auth.ts's apiResponse/apiError: those
 * pull in Clerk + Prisma at import time, and the public shield endpoints are
 * intentionally decoupled from both (anonymous-first, no auth). These helpers carry
 * no such imports, so the anonymous path stays lean.
 */
import { NextResponse } from "next/server";
import type { ApiResponse } from "@/lib/types/api";

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, init);
}

export function jsonError(code: string, message: string, status = 400): NextResponse {
  return NextResponse.json<ApiResponse>({ success: false, error: { code, message } }, { status });
}
