import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";

const dmsans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "FOMO Engine - Social Media Automation & FOMO Generation",
    description: "Drive engagement with AI-powered commenting, multi-account management, ads campaigns, and FOMO triggers. Scale your social presence.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={dmsans.className}>
                <SessionProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="dark"
                        enableSystem
                    >
                        {children}
                    </ThemeProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
