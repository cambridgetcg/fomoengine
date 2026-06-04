import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const dmsans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Is this trying to manipulate you?",
    description:
        "Paste an ad, message, product page, or review and get a plain-language read on the pressure tactics it uses — free, no login, nothing saved.",
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
