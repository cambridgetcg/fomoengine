# Attention Layer v1

FOMOengine 擁有研究同計算核心；agenttool／KINGDOM 工程透過明確 HTTP 呼叫重用，唔複製演算法。Production origin 係 `https://fomoengine.io`；**API 部署、agenttool SDK 0.23.0 發布同 discovery 各有獨立驗收**。以 endpoint readback 同 package release receipts 核實實際狀態，唔以網站或 source 存在代替。

## 三個 operation

前綴 `/api/v1/attention-lab`，毋須登入、key、DB 或 model。

| Method／path | Input／result |
|---|---|
| `GET /catalogue` | 完整 `mechanisms`（含 claims）、`platforms`（含 signals）、`sources` 及版本。Compatibility 係 template 適用範圍，唔係效果保證。 |
| `POST /briefs` | `BriefInput` → `{brief,mechanism,platform,sources,claims,markdown,...versions}`。`brief` 含 control／treatment、blocked、metric、guardrails、confounders。 |
| `POST /comparisons` | `{counts,plan,metric}` → 原記錄、`comparison`、`designDescription`、`missingRequirements`、`interpretation` 及版本。 |
| `GET /openapi.json` | Raw OpenAPI 3.1 document；只係上述契約描述，唔係額外分析能力。 |

三個 operation 回 `{success:true,data}` 或 `{success:false,error:{code,message}}`。OpenAPI structural schemas 同 runtime Zod 定義一齊生成；`x-semantic-refinements` 明列 schema 以外嘅要求，唔聲稱兩者完全等價。

### Input

- Brief 欄位：`topic`、`audience`、`platformId`、`mechanismId`、`objective`、`takeaway`、`action`、`evidenceStatus`、`evidence`、`constraints`、`verifiedProof`、`realLimit`、`limitReason`、`terms`、`nonpoliticalConfirmed`。
- `evidenceStatus` 係 `missing` 或 `provided`；聲稱 provided 就要提供文字及來源。Caller attestation 唔係第三方核實；唔用 true 當繞過確認嘅快捷方式。
- 缺真 proof／scarcity 條件仍返回 `blocked:true`，唔自動捏造名額、期限、見證或成效。
- Counts：`{aOutcomes:"10",aEligible:"100",bOutcomes:"18",bEligible:"120"}`；十進位非負 safe integer 字串，未知係 `""`。Outcomes 唔可以大過 eligible，唔接受 fractional／negative／unsafe values。
- Plan 欄位：`design`（`observational`／`randomized`）、`allocation`、`eligibility`、`startDate`、`endDate`、`stoppingRule`、`guardrailPlan`、`guardrailResults`。空白保留為缺項；日期有效兼 end ≥ start。
- Metric `{name,numerator,denominator,caveat}` 由 caller 明確傳入，通常直接用 `artifact.brief.metric`。API 唔重新用最新 inputs 猜 metric，亦唔驗證 caller 實際量度。
- 完整可執行 synthetic request／result：[v1.json](../fixtures/attention-lab/v1.json)；machine schema：[v1.schema.json](../fixtures/attention-lab/v1.schema.json)。新 API 只收完整 Unicode scalar 字串：合法 astral 字元原樣保留，lone surrogate 明確拒絕，唔靜默換字。字串長度以 runtime UTF-16 code units 為準；JSON Schema 使用 codepoints，SDK 另外保留 runtime 邊界；舊 workspace v1 驗證唔受呢個新 API 規則影響。

### 結果係描述，唔係判勝

Rates 係 0–1；`percentagePointDifference` 已係 pp；`relativeLift` 係 ratio（0.5 表示 50%）。10/100 對 18/120 → 約 +5 pp、relative lift 約 0.5。未知 counts → `comparison:null`；零分母 → 對應 rate 同 difference 為 null；零 baseline → relative lift null。冇 winner、significance 或 causal conclusion，亦唔因 plan 聲稱 randomized 就認證 randomization。

## 自身完整嘅快照

每份結果帶 `schemaVersion`、`engineVersion`、`catalogueVersion`、`catalogueDigest`，唔借用 browser workspace version。

Brief 保存完整相關 Source metadata、Claim 全文／kind／context／limitations；`mechanism.claimIds`、`platform.claimIds` 指向自己嘅 claims，所有 source references 閉合。歷史 artifact 按自己版本／快照內 IDs 驗證，唔再問目前 registry 有冇該 ID。`renderBriefArtifactMarkdown()` 只讀快照；舊文件唔會隨 source review date 或 catalogue 更新而變字。

Digest 係 `sha256:` 加 lowercase hex，對 `serializeCatalogueContent()` 嘅 UTF-8 JSON bytes 計算（唔包含 digest 自身）。佢辨認所宣告嘅內容，**唔係簽名、真確性保證或歷史 engine 可重跑承諾**。

Artifact 同 `fomoengine-attention-workspace` v1 係兩種格式；唔互相冒充 import。舊 browser workspace Save／Load／Delete／Markdown／JSON 行為保留。

## HTTP 與資料邊界

- Request ≤64 KiB、response ≤512 KiB，按實際 UTF-8／stream bytes 計，唔只信 Content-Length；超限唔截斷成成功結果。
- Request body deadline 10 秒；JSON／UTF-8，唔接受 gzip request。SDK 一樣有 whole-operation deadline、no redirect、no automatic retry、no constructor network。
- 新 Attention limiter 每實例每 coarse-IP 30/min，最多 20,000 個短期 buckets；容量／故障回 503，超額回 429＋Retry-After。Proxy header 唔係已驗身份，呢個唔係 globally distributed quota，亦唔改 checker fail-open 策略。
- CORS 只准該 operation 嘅公開 method、OPTIONS、Content-Type；冇 allow-credentials，亦唔容 Authorization preflight。API 唔用 token／cookie 決定身份，唔將 headers 傳入核心。
- 所有回應 no-store；application 唔持久保存／記錄 request content，唔接 DB／model／URL fetch／social publisher。Hosting access metadata 同 retention 未獨立核實，唔保證零平台 logs。
- `/lab`／`/trends` 仍本地；**只有明確 API／SDK 調用先把選取欄位送到配置 origin**。唔自動收 repo、env、credentials、客戶記錄或 browser drafts。

| HTTP | Error code |
|---|---|
| 400 | `INVALID_JSON`（包括 malformed UTF-8／length mismatch） |
| 403 | `CORS_NOT_ALLOWED` |
| 405 | `METHOD_NOT_ALLOWED` |
| 408 | `REQUEST_TIMEOUT` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |
| 422 | `INVALID_INPUT` |
| 429 | `RATE_LIMITED` |
| 503 | `SERVICE_UNAVAILABLE` |

錯誤只回 stable code／sanitized message，唔回原 input／stack／provider error。

## 普通工程唔需要 agenttool

先啟動自己嘅本地 server，唔用 production secrets：

```sh
# Node 22；另外一個 terminal，確認 port 冇其他服務
OPENAI_API_KEY='' ANTHROPIC_API_KEY='' DATABASE_URL='' \
CLERK_SECRET_KEY='' NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY='' \
npm run dev -- --hostname 127.0.0.1 --port 3189

# 呢個動作會提交隨工程附送嘅 synthetic 攝影例子
node examples/attention-lab.mjs http://127.0.0.1:3189 --allow-loopback-http
```

[獨立 HTTP example](../examples/attention-lab.mjs) 只用 Node built-ins，依次查 catalogue、生成附引用 brief、比較 counts；JSON 結果只去 stdout，是否保存由 caller 決定。佢係有界接駁示例，唔係另一份全 schema validator；正式整合可以用雙 SDK 嘅完整驗證，或者自己按公開契約驗。

## agenttool／KINGDOM

- agenttool `0.23.0` source 提供：TS `at.attentionLab.catalogue/buildBrief/compare`；Python `at.attention_lab.catalogue/build_brief/compare`，另有無 token standalone `AttentionLabClient`。Package 發布以 registry／LOVE readback 核實。
- SDK 有自己嘅 `baseUrl`／`base_url`（origin-only）、timeout 同 byte ceilings；唔繼承 authenticated AgentTool transport、token、cookies 或環境認證。Loopback HTTP 必須明確測試 opt-in。
- Wake 只增加外部 catalogue／schema 座標，唔發 network request；冇 FOMO MCP endpoint、hosted paid proxy 或 marketplace listing。
- Root [kingdom.yaml](../kingdom.yaml) 係 producer metadata，唔係 health／authority／registry 寫入。可攜 [Skill](../skills/attention-lab/SKILL.md) 只係 source，唔自動安裝或改全域 routing。
- Canonical KINGDOM core checkout 缺席時，全域 inventory 驗收保持 blocked；唔改 Desktop 替代 registry 或 cache。

## 驗證／發布

`npm test` 包核心、快照、fixtures、HTTP／limit 及 route regressions；正常測試會比對 fixtures，唔重生。真有契約改動先用 `UPDATE_ATTENTION_FIXTURES=1 ./node_modules/.bin/tsx --test lib/attention/fixtures.test.ts` 明確更新，再讓雙 SDK 同步 authoritative copies。

本地 source／tests 通過唔等於 live。獲發布授權後，次序係 FOMO API deploy＋live smoke，再 agenttool discovery／SDK release＋live consumer smoke；LOVE artifact sealing 同 npm／PyPI protected manual workflows 係獨立 gates，唔另開本地 registry publish 路徑。發布 source、服務或 package 都唔會自動安裝全域 Skill 或改 KINGDOM registry。
