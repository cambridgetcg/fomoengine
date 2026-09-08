/** @type {import('next').NextConfig} */
const nextConfig = {
  // 保留 RSC headers 同內部 query，畀 proxy 分辨文件同 client navigation。
  skipProxyUrlNormalize: true,
};

export default nextConfig;
