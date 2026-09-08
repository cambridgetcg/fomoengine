import type { Metadata } from "next";

export const SITE_URL = "https://fomoengine.io";
export const SITE_NAME = "FOMOengine";

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** 只統一公開文件嘅品牌 host；API、RSC、靜態資源同 preview 唔改路。 */
export function canonicalRedirect(
  url: URL,
  method: string,
  accept: string | null = null,
): URL | null {
  if (url.hostname !== "www.fomoengine.io" || !["GET", "HEAD"].includes(method)) return null;
  if (/^\/(?:api|_next)(?:\/|$)/.test(url.pathname) || /\.[^/]+$/.test(url.pathname)) return null;
  if (accept && !/(?:text\/html|application\/xhtml\+xml|\*\/\*)/i.test(accept)) return null;

  const canonical = new URL(url);
  canonical.protocol = "https:";
  canonical.host = new URL(SITE_URL).host;
  canonical.port = "";
  return canonical;
}
