import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { MECHANISMS } from "@/lib/attention/mechanisms";

export default function sitemap(): MetadataRoute.Sitemap {
  // 冇可信嘅逐頁修改日期，所以唔用 build 時間扮 lastModified。
  const paths = ["", "/atlas", "/platforms", "/lab", "/trends", "/check", "/audit", "/sources", "/methodology", "/privacy"];
  return [
    ...paths.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...MECHANISMS.map((mechanism) => ({ url: `${SITE_URL}/atlas/${mechanism.id}` })),
  ];
}
