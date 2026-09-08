import { createComparisonArtifact } from "@/lib/attention/artifact";
import { comparisonInputSchema } from "@/lib/attention/contract";
import { createAttentionRoute } from "@/lib/api/attention-lab";
import { attentionCatalogueDigest } from "@/lib/api/attention-catalogue-digest";

export const runtime = "nodejs";
const route = createAttentionRoute("POST", (input) => createComparisonArtifact(input, attentionCatalogueDigest()), comparisonInputSchema);
export const POST = route.handle;
export const OPTIONS = route.options;
export const GET = route.methodNotAllowed;
export const HEAD = route.methodNotAllowed;
export const PUT = route.methodNotAllowed;
export const PATCH = route.methodNotAllowed;
export const DELETE = route.methodNotAllowed;
