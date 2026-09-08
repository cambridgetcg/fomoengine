import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { X509Certificate } from "node:crypto";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const bundlePath = resolve(root, "lib/certs/aws-rds-global-bundle.pem");

test("vendored AWS bundle contains only self-signed public RDS CA certificates", () => {
  const pem = readFileSync(bundlePath, "utf8");
  const pattern = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g;
  const certificates = pem.match(pattern) ?? [];
  assert.ok(certificates.length > 0);
  assert.equal(pem.replace(pattern, "").trim(), "");
  for (const block of certificates) {
    const certificate = new X509Certificate(block);
    assert.equal(certificate.ca, true);
    assert.match(certificate.subject, /Amazon RDS/);
    assert.equal(certificate.subject, certificate.issuer);
    assert.equal(certificate.verify(certificate.publicKey), true);
  }
});

function runProductionImport(code: string) {
  // 獨立 child process，唔借用真 DB，任何開 socket 嘅動作都會失敗。
  return spawnSync(process.execPath, ["--import", "tsx", "--eval", `
    const assert = require("node:assert/strict");
    require("node:net").Socket.prototype.connect = () => { throw new Error("Unexpected network connection"); };
    ${code}
  `], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://fixture:fixture@synthetic.rds.amazonaws.com.invalid:9/fixture",
      OPENAI_API_KEY: "",
      ANTHROPIC_API_KEY: "",
    },
    encoding: "utf8",
    timeout: 20_000,
  });
}

test("production RDS import uses the bundled CA with certificate verification and no connection", () => {
  const result = runProductionImport(`
    const { prisma } = require("./lib/prisma.ts");
    assert.ok(prisma);
    assert.equal(globalThis.pool.options.ssl.rejectUnauthorized, true);
    assert.equal(globalThis.pool.options.ssl.ca.toString(), require("node:fs").readFileSync(${JSON.stringify(bundlePath)}, "utf8"));
    assert.equal(globalThis.pool.totalCount, 0);
  `);
  assert.equal(result.status, 0, result.stderr || String(result.error ?? ""));
});

test("production RDS still fails closed when all CA bundle paths are missing", () => {
  const result = runProductionImport(`
    const fs = require("node:fs");
    const exists = fs.existsSync;
    fs.existsSync = (path) => String(path).endsWith(".pem") ? false : exists(path);
    assert.throws(() => require("./lib/prisma.ts"), /RDS connection requires CA bundle in production/);
  `);
  assert.equal(result.status, 0, result.stderr || String(result.error ?? ""));
});
