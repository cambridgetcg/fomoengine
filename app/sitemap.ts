import type { MetadataRoute } from "next";

const SITE = "https://fomoengine-cambridgetcgs-projects.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/check`, changeFrequency: "weekly", priority: 1 },
    { url: SITE, changeFrequency: "monthly", priority: 0.8 },
  ];
}
