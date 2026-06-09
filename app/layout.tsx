import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const dmsans = DM_Sans({ subsets: ["latin"] });

const SITE = "https://fomoengine-cambridgetcgs-projects.vercel.app";
const TAGLINE =
    "Paste any ad, message, or review and see the pressure tactics, the feeling each one is poking, and the plain truth that dissolves it. Free, no login, nothing saved.";

export const metadata: Metadata = {
    metadataBase: new URL(SITE),
    title: {
        default: "Is this trying to manipulate you?",
        template: "%s · the authenticity shield",
    },
    description: TAGLINE,
    applicationName: "the authenticity shield",
    keywords: [
        "dark patterns",
        "manipulation detector",
        "is this a scam",
        "scam checker",
        "phishing checker",
        "deceptive design",
        "FOMO",
        "pressure tactics",
        "consumer protection",
    ],
    authors: [{ name: "Cambridge TCG" }],
    creator: "Cambridge TCG",
    alternates: { canonical: "/check" },
    openGraph: {
        type: "website",
        siteName: "the authenticity shield",
        url: "/check",
        title: "Is this trying to manipulate you?",
        description:
            "See the pressure tactics in any ad, message, or review — the feeling each one pokes, and the truth that dissolves it. Free, nothing saved.",
    },
    twitter: {
        card: "summary_large_image",
        title: "Is this trying to manipulate you?",
        description:
            "See the pressure tactics in any ad, message, or review — the feeling each one pokes, and the truth that dissolves it. Free, nothing saved.",
    },
    robots: { index: true, follow: true },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={dmsans.className}>
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
