"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    Megaphone,
    BarChart3,
    Settings,
    Zap,
} from "lucide-react";

const navItems = [
    { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { title: "Comments", href: "/dashboard/comments", icon: MessageSquare },
    { title: "Accounts", href: "/dashboard/accounts", icon: Users },
    { title: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
    { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

interface QuickStat {
    label: string;
    value: string;
}

const quickStats: QuickStat[] = [
    { label: "Active Accounts", value: "45" },
    { label: "Today's Comments", value: "2.4K" },
    { label: "Campaign Spend", value: "$340" },
];

export function DashboardSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:flex flex-col w-64 border-r bg-card h-screen sticky top-0">
            {/* Logo */}
            <div className="p-6 border-b">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg">FOMO Engine</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                        Main
                    </p>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.title}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Quick Stats */}
            <div className="p-4 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
                    Quick Stats
                </p>
                <div className="space-y-2">
                    {quickStats.map((stat) => (
                        <div
                            key={stat.label}
                            className="flex items-center justify-between px-3 py-1.5 text-sm"
                        >
                            <span className="text-muted-foreground">{stat.label}</span>
                            <span className="font-semibold">{stat.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Settings */}
            <div className="p-4 border-t">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <Settings className="w-5 h-5" />
                    Settings
                </Link>
            </div>
        </aside>
    );
}
