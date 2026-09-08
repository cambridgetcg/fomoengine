import { createCatalogue } from "@/lib/attention/artifact";
import { createAttentionRoute } from "@/lib/api/attention-lab";
import { attentionCatalogueDigest } from "@/lib/api/attention-catalogue-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const route = createAttentionRoute("GET", () => createCatalogue(attentionCatalogueDigest()));
export const GET = route.handle;
export const HEAD = route.handle;
export const OPTIONS = route.options;
export const POST = route.methodNotAllowed;
export const PUT = route.methodNotAllowed;
export const PATCH = route.methodNotAllowed;
export const DELETE = route.methodNotAllowed;
