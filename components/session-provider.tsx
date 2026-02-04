"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function SessionProvider({ children }: { children: React.ReactNode }) {
    return <ClerkProvider>{children}</ClerkProvider>;
}
