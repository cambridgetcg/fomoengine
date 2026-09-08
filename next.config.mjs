/** @type {import('next').NextConfig} */
const nextConfig = {
  // 保留 RSC headers 同內部 query，畀 proxy 分辨文件同 client navigation。
  skipProxyUrlNormalize: true,
  // 檔案係公開 CA，唔係秘密；API serverless bundle 亦要包含佢。
  outputFileTracingIncludes: {
    "/api/v1/**": ["./lib/certs/aws-rds-global-bundle.pem"],
  },
};

export default nextConfig;
