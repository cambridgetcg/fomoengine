import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

// brand/check.mjs (vendored from cambridgetcg/brandkit) holds brand/brandkit.json to the repository: the look's
// provenance, the kit, and every served file byte for byte. Running it here puts it in `npm test`, so the
// shield-guardrail workflow runs it on every push to main and every pull request. brand-kit.sync.test.ts beside this
// file still checks the head tags Next.js writes, which check.mjs can't see.
const CHECK = fileURLToPath(new URL("../brand/check.mjs", import.meta.url));

test("brand/check.mjs passes", () => {
  const run = spawnSync(process.execPath, [CHECK], { encoding: "utf8" });
  assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
});
