import { NextResponse, type NextRequest } from "next/server";
import { canonicalRedirect } from "@/lib/site";

/** 免費 checker 同研究工作台維持公開，唔引入 auth、DB 或首頁轉址。 */
export function proxy(request: NextRequest) {
  const headers = request.headers;
  if (
    headers.get("rsc") === "1" ||
    headers.has("next-router-prefetch") ||
    headers.has("next-router-segment-prefetch") ||
    headers.has("next-router-state-tree") ||
    headers.get("purpose") === "prefetch"
  ) return NextResponse.next();

  // Next standalone 可以將 request.url 指向 loopback；實際 Host 先係訪客入口。
  const url = new URL(request.url);
  const host = headers.get("host");
  if (host !== null) {
    if (!/^www\.fomoengine\.io(?::443)?$/i.test(host)) return NextResponse.next();
    url.host = "www.fomoengine.io";
  }
  const canonical = canonicalRedirect(url, request.method, headers.get("accept"));
  if (canonical) return NextResponse.redirect(canonical, 308);
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
