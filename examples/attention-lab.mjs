import { readFile } from "node:fs/promises";

// 呢個獨立 consumer 只讀隨工程附送嘅 synthetic fixture，唔掃 repo 或讀環境認證。
const args = process.argv.slice(2);
const allowLoopback = args.includes("--allow-loopback-http");
if (!args[0] || args.some((arg, index) => index > 0 && arg !== "--allow-loopback-http")) {
  throw new Error("用法：node examples/attention-lab.mjs ORIGIN [--allow-loopback-http]；執行會提交 synthetic 攝影例子。");
}
const origin = new URL(args[0]);
const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname);
if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash ||
  !(origin.protocol === "https:" || (allowLoopback && loopback && origin.protocol === "http:"))) {
  throw new Error("只接受獨立 HTTPS origin；loopback HTTP 要明確 opt in。");
}
const fixture = JSON.parse(await readFile(new URL("../fixtures/attention-lab/v1.json", import.meta.url), "utf8"));
const encoder = new TextEncoder();

async function call(operation, input) {
  const body = input === undefined ? undefined : JSON.stringify(input);
  if (body && encoder.encode(body).byteLength > 65536) throw new Error("Request 超過 64 KiB。");
  const response = await fetch(`${origin.origin}/api/v1/attention-lab/${operation}`, {
    method: input === undefined ? "GET" : "POST",
    headers: { Accept: "application/json", "Accept-Encoding": "identity", ...(body ? { "Content-Type": "application/json" } : {}) },
    body, credentials: "omit", redirect: "manual", referrerPolicy: "no-referrer", cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status !== 200 || response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    void response.body?.cancel().catch(() => undefined);
    throw new Error(`Attention API 未能完成 operation（HTTP ${response.status}）；冇跟 redirect 或重試。`);
  }
  const declared = response.headers.get("content-length");
  const encoding = response.headers.get("content-encoding");
  if ((declared !== null && (!/^\d+$/.test(declared) || Number(declared) > 524288)) || (encoding && encoding !== "identity")) {
    void response.body?.cancel().catch(() => undefined);
    throw new Error("Response length／encoding 唔符合有界契約。");
  }
  if (!response.body) throw new Error("Response 冇 body。");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  let text = "";
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 524288) throw new Error("Response 超過 512 KiB。");
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    if (declared !== null && Number(declared) !== bytes) throw new Error("Response length 唔匹配。");
    const envelope = JSON.parse(text);
    if (envelope.success !== true || envelope.data?.schemaVersion !== 1) throw new Error("Response envelope／schema version 唔支援。");
    return envelope.data;
  } finally {
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

const catalogue = await call("catalogue");
const brief = await call("briefs", fixture.briefInput);
if (!brief.sources?.length || !brief.claims?.length || typeof brief.markdown !== "string") throw new Error("Brief 缺少來源快照。");
const comparison = await call("comparisons", { ...fixture.comparisonInput, metric: brief.brief.metric });
if (Math.abs(comparison.comparison.percentagePointDifference - 5) > 1e-9) throw new Error("Synthetic comparison 唔符合預期。");
// JSON escaping 保持遠端文字係資料；stdout 是否保存由 caller 明確選擇。
console.log(JSON.stringify({ catalogueVersion: catalogue.catalogueVersion, brief, comparison }, null, 2));
