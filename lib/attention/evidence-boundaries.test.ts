import { strict as assert } from "node:assert";
import { test } from "node:test";
import { getMechanism } from "./mechanisms";
import { getSource } from "./sources";

test("arousal replication identifies willingness, not measured platform sharing", () => {
  const claim = getMechanism("arousal")?.claims.find((item) => item.id === "arousal-replication-null");
  assert.ok(claim);
  assert.match(claim.text, /willingness/i);
  assert.match(claim.text, /not actual platform sharing/i);
  assert.match(claim.context, /preregistered/i);
  const source = getSource("arousal-replication-2024");
  assert.ok(source);
  assert.match(source.context, /sharing willingness, not observed sharing/i);
});
