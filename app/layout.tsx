import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteShell } from "@/components/attention/site-shell";
import { WorkspaceProvider } from "@/components/attention/workspace-provider";
import { SITE_URL } from "@/lib/site";

const dmsans = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-editorial", display: "swap" });

const DESCRIPTION = "Understand how emotion, platform signals and creative choices shape attention. Explore the research, decode pressure tactics and design your own honest experiments.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "FOMOengine — The Attention Lab", template: "%s · FOMOengine" },
  description: DESCRIPTION,
  applicationName: "FOMOengine",
  authors: [{ name: "Cambridge TCG" }],
  creator: "Cambridge TCG",
  openGraph: {
    type: "website",
    siteName: "FOMOengine",
    title: "FOMOengine — The Attention Lab",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: "FOMOengine — The Attention Lab", description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmsans.className} ${dmsans.variable} ${fraunces.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <WorkspaceProvider>
            <SiteShell>{children}</SiteShell>
          </WorkspaceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
