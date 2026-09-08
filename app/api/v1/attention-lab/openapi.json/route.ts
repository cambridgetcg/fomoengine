import { getAttentionOpenApi } from "@/lib/attention/openapi";
import { createAttentionRoute } from "@/lib/api/attention-lab";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const route = createAttentionRoute("GET", getAttentionOpenApi, undefined, { rawDocument: true });
export const GET = route.handle;
export const HEAD = route.handle;
export const OPTIONS = route.options;
export const POST = route.methodNotAllowed;
export const PUT = route.methodNotAllowed;
export const PATCH = route.methodNotAllowed;
export const DELETE = route.methodNotAllowed;
