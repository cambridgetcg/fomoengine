"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent flash by not rendering children until mounted
    // The suppressHydrationWarning on html handles the initial render
    if (!mounted) {
        return <div style={{ visibility: "hidden" }}>{children}</div>;
    }

    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
