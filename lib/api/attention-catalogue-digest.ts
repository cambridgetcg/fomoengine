import { createHash } from "node:crypto";
import { serializeCatalogueContent } from "../attention/artifact";

/** Digest 只辨認所宣告嘅 catalogue JSON bytes，唔係簽名或證據真確性保證。 */
export function attentionCatalogueDigest(): string {
  return `sha256:${createHash("sha256").update(serializeCatalogueContent(), "utf8").digest("hex")}`;
}
