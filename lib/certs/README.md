# Amazon RDS 公開 CA bundle

`aws-rds-global-bundle.pem` 係 AWS 發布嘅公開 CA certificates，唔包含 private keys，唔係 production credentials。

- 官方來源：https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
- 官方文件：https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html
- 下載日期：2026-09-08
- SHA-256：`e5bb2084ccf45087bda1c9bffdea0eb15ee67f0b91646106e466714f9de3c7e3`
- 108 個 certificate blocks；原檔保存，冇改證書內容。

`lib/prisma.ts` 對 RDS 保持 `rejectUnauthorized: true`；`next.config.mjs` 明確將呢個檔案加入 API serverless output tracing。Build 同 runtime 唔需要即時下載 CA，亦唔依賴不存在嘅 `aws-rds-ca-bundle` npm package。

更新時只從上面 AWS HTTPS 來源取得，核對 PEM 全部係公開 CA、更新日期同 hash，再跑 `lib/prisma-rds.test.ts`、帶 synthetic RDS URL 嘅 production build，同核對兩個 API route 嘅 `.nft.json` 包含呢個資產。唔以停用 TLS 驗證作替代，唔搬入 DB secrets。呢份 bundle 涵蓋 commercial AWS Regions；GovCloud 有另外嘅官方來源。
