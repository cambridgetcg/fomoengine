"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  ["/atlas", "Atlas"],
  ["/platforms", "Platforms"],
  ["/lab", "Lab"],
  ["/trends", "Trends"],
  ["/check", "Checker"],
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="attention-shell">
      <a className="attention-skip attention-chrome" href="#main-content">Skip to content</a>
      <header className="attention-header attention-chrome">
        <div className="attention-container attention-header-inner">
          <Link className="attention-brand" href="/" aria-label="FOMOengine home">
            <svg className="attention-brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <circle cx="16" cy="16" r="13.5" stroke="currentColor" />
              <path d="M16 3v26M3 16h26M7 7l18 18M7 25 25 7" stroke="currentColor" />
              <circle cx="16" cy="16" r="4" fill="currentColor" />
            </svg>
            <span>FOMO<span className="attention-brand-light">engine</span></span>
          </Link>
          <span className="attention-header-note">The attention field guide</span>
          <nav className="attention-navigation" aria-label="Main navigation">
            {navigation.map(([href, label]) => (
              <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined}>
                {label}<span className="attention-nav-dot" aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {/* 各頁保留自己嘅 main landmark，checker 唔會被包成巢狀 main。 */}
      <div id="main-content" tabIndex={-1} className="attention-content">{children}</div>
      <footer className="attention-footer attention-chrome">
        <div className="attention-container">
          <div className="attention-footer-top">
            <div>
              <Link href="/" className="attention-footer-brand">FOMOengine</Link>
              <p>Understand the mechanism.<br />Keep the freedom to choose.</p>
            </div>
            <p className="attention-footer-pledge">Research, not secret algorithms.<br />Useful experiments, not guaranteed growth.<br />A free checker. No account needed.</p>
            <nav aria-label="Research and policies" className="attention-footer-links">
              <Link href="/methodology">Methodology</Link>
              <Link href="/sources">Sources</Link>
              <Link href="/privacy">Privacy & storage</Link>
              <Link href="/audit">Request an audit <span aria-hidden="true">↗</span></Link>
            </nav>
          </div>
          <div className="attention-footer-bottom attention-kicker">
            <span>An open notebook, not a growth promise.</span>
            <a href="https://github.com/cambridgetcg/fomoengine/blob/main/PLEDGE.md" target="_blank" rel="noopener noreferrer">Read the project pledge <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
