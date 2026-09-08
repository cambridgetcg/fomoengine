# FOMOengine — Attention Lab

理解注意力點樣被捕捉，再將理解變成自己可驗證嘅策略：**Understand → Decode → Apply → Test**。

- `/atlas`：六個機制嘅研究、反證、例子同適用限制，唔係六條保證增長公式。
- `/platforms`：按 platform × surface 拆解公開訊號；marketing/email 明確係策略渠道，唔扮 ranking algorithm。
- `/lab`：為 social、SEO、email 同 offer 建可編輯 brief，設計單變數 A/B，比較手動記錄嘅結果。
- `/trends`：手動來源與需求背景筆記，接到同一份 brief；唔係即時 trend feed。
- `/check`：原有免費 authenticity shield，接上機制解說，唔削弱 safety result。
- `/sources`、`/methodology`、`/privacy`：逐項來源、證據界線同資料處理。

新工作台用 deterministic templates，唔需要登入、AI key 或 DB。狀態默認只喺記憶體，跨 client navigation 保留、reload 清空；明確 Save/Load/Delete 先讀寫本機 browser draft。JSON 匯入會驗 schema/version，Markdown/JSON 匯出由用戶自己保管。新 Lab/Trends 唔發內容到 server；checker 仍會把 pasted text 交現有 API，optional AI provider 另見私隱頁。唔做自動發文、暗中爬站或帳號接駁。

研究係背景，唔係 proprietary weights：官方披露、實驗、觀察同假設分開；arousal null replication、舊平台文件同存取受限來源照樣明示。Trend 0–100 唔係絕對量，非隨機比較唔宣告因果、significance 或 winner。

## 共用 Attention Layer

同一套核心提供 versioned HTTP 接口，畀 agenttool 同其他 KINGDOM／普通工程明確選用。Production origin 係 `https://fomoengine.io`；API 部署、SDK package 發布同全域採用係獨立狀態，應以各自嘅 live readback／release receipts 核實，唔單憑網站或 source 存在判定。

- `GET /api/v1/attention-lab/catalogue`：機制、surface、claims、sources 同版本。
- `POST /api/v1/attention-lab/briefs`：完整策略＋control/treatment＋可攜引用快照＋Markdown。
- `POST /api/v1/attention-lab/comparisons`：明確 metric／plan／counts 嘅描述性比較，未知唔補零。
- `GET /api/v1/attention-lab/openapi.json`：raw OpenAPI document。

API／SDK 呼叫會將 caller 選取欄位送去配置 origin；**現有 browser Lab／Trends 冇改成遠端運算**。新 API 唔接 DB／model／URL fetch，唔保存 app content records、唔記 request body；hosting metadata retention 另有界線。SDK 唔轉送 agenttool bearer／cookies，亦唔自動掃 repo、發文或上傳草稿。

[契約與本地採用例子](./docs/ATTENTION-LAYER.md) · [無 agenttool 依賴嘅 HTTP consumer](./examples/attention-lab.mjs) · [portable Skill source](./skills/attention-lab/SKILL.md) · [producer card](./kingdom.yaml)。Skill／card 存在唔代表已安裝、已註冊、健康或有操作權。

## 原有 authenticity shield

**Paste any text — an ad, a message, a review, a scammy "your account is suspended" SMS — and see the manipulation tactics in it, in plain words.** Free, no login, nothing saved.

→ **[Try it](https://fomoengine.io/check)**

For each pressure tactic it finds, the shield names:

- **the tactic** (a fake countdown, "only 2 left", a guilt-trip "no" button),
- **the proven psychological lever** it pulls (Cialdini scarcity/social-proof/authority; Kahneman–Tversky loss aversion; Thaler default effect),
- **the exact words** in your text that triggered it,
- **the feeling it pokes** — named kindly; you're never the problem,
- and **the truth that dissolves it** — the honest line that quietly switches the trick off.

It also catches a catastrophic **scam-composite** tier (impersonation + a threat/deadline + a push to act alone).

## The pledge

> **Free, forever, for people. No dark patterns of our own.**

We read only the words you paste — never a website, no tracking, **nothing stored**. We name patterns *consistent with* manipulation; we never call a specific person or product fraudulent. **You decide.** It's enforced in code, not just promised — see [`PLEDGE.md`](./PLEDGE.md) and the guardrail test that fails CI if the free tier is ever degraded.

## Honest origin

This repo was **inverted from a FOMO-comment generator** — a tool that *deployed* scarcity, urgency, social proof, and exclusivity. Same psychological levers; weapon turned to armor. The detection taxonomy is the literal inversion of the tactics the old engine pushed. (`git log` tells the whole story.)

## How it works

1. **Paste what you got.** Any text — it only reads the words, never opens a link or visits a site.
2. **See the tactic, the feeling, and the truth.** Each pressure move in plain language, grounded in a vetted taxonomy (so the user-facing text comes from citations, never free-form model output that could be alarmist or wrong).
3. **You decide, unhurried.** It never calls something a scam *for certain* — it shows the patterns so you spot them yourself.

Detection runs a deterministic regex pass (works with zero config, no key) **plus** an optional AI pass for nuance. Grounded in published research: Cialdini's *Influence*, Kahneman & Tversky on loss aversion, Brignull's deceptive.design, the FTC, and the EU Digital Services Act (Art. 25).

## API — for developers & AI agents

Same engine, as JSON. No key needed to start.

```bash
curl -s https://YOUR_HOST/api/v1/check \
  -H "Content-Type: application/json" \
  -d '{"text":"Only 2 left! Offer ends in 04:59."}'
```

Returns `{ success, data: { flags: [{ label, principle, lever, why, emotion, truth, whatToDo, evidence, confidence, citation }], summary, scamWarning, … } }`. A paid tier adds quota + a stronger model — strictly *additive*, the free result is never degraded. Full docs: [`docs/API.md`](./docs/API.md).

## For businesses checking their own copy

The separate [`/audit`](./app/audit/page.tsx) route describes a bounded **$99 USD
design-partner Copy Pressure Audit**. It produces a metadata-only request draft in
the browser; the site does not submit or store the form. Set the deliberately public
`NEXT_PUBLIC_AUDIT_CONTACT_EMAIL` to enable its “Open email draft” action. There is
no checkout on the page: scope, handling, delivery timing, and a verified payment
route are confirmed before payment.

The audit is a versioned review artifact, not legal advice, regulatory
certification, a fraud verdict, or a promise of improved conversion. The consumer
checker remains complete, free, and unmetered.

## Tech

Next.js 16 (App Router) · TypeScript · Tailwind + shadcn/ui · optional Postgres/Prisma (for API keys only — the public checker needs neither a DB nor auth) · deployed on Vercel with Node.js 22.x.

## Run it locally

```bash
# Node.js 22.x
npm ci
npm run dev
npm test
npx tsc --noEmit
npm run lint
npm run build
```

新工作台同匿名 checker 唔需要環境秘密。請勿為本地 smoke test 搬入 production keys。`fly-api/` 保留原有 Bun 1.3.14 測試流程，唔需要改 x402 或外部服務設定。

Browser smoke 使用 Playwright，會自行啟動一個無 AI key／DB 嘅 production server 喺 `127.0.0.1:3187`，唔重用其他人嘅服務。先 `npm run build`，再 `npm run test:e2e`；需要 Playwright Chromium，或以 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定已安裝 Chrome。Mac 例子：

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run test:e2e
```

Smoke 只用 synthetic 內容；screenshots/traces 喺已忽略嘅 `test-results/`，唔入 Git。

Optional env (`.env`): `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to enable the AI pass; `DATABASE_URL` only if you're issuing metered API keys.

## License

The detection taxonomy is intended as **CC0** — how manipulation works should never sit behind a paywall. See [`lib/services/detection/taxonomy.ts`](./lib/services/detection/taxonomy.ts).

---

Free, forever, for people. 🛡️
