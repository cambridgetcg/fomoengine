"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { useAccounts } from "@/lib/api/hooks";

type StatusType = "healthy" | "warming" | "flagged" | "inactive" | "active" | "paused" | "draft" | "completed";
import {
    Plus,
    Search,
    MoreVertical,
    Users,
    Shield,
    AlertTriangle,
    Activity,
    LayoutGrid,
    List,
    Loader2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const platformIcons: Record<string, string> = {
    instagram: "IG",
    tiktok: "TT",
    twitter: "X",
    facebook: "FB",
    linkedin: "LI",
    youtube: "YT",
    INSTAGRAM: "IG",
    TIKTOK: "TT",
    TWITTER: "X",
    FACEBOOK: "FB",
    LINKEDIN: "LI",
    YOUTUBE: "YT",
};

export default function AccountsPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [platformFilter, setPlatformFilter] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const { accounts, loading } = useAccounts({
        platform: platformFilter === "all" ? undefined : platformFilter,
        status: statusFilter === "all" ? undefined : statusFilter.toUpperCase(),
        search: search || undefined,
    });

    const filteredAccounts = useMemo(() => accounts.filter((a) => {
        const matchesSearch = !search || a.username.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || a.status.toLowerCase() === statusFilter;
        const matchesPlatform = platformFilter === "all" || a.platform.toLowerCase() === platformFilter;
        return matchesSearch && matchesStatus && matchesPlatform;
    }), [accounts, search, statusFilter, platformFilter]);

    const statusCounts = useMemo(() => ({
        healthy: accounts.filter((a) => a.status === "HEALTHY").length,
        warming: accounts.filter((a) => a.status === "WARMING").length,
        flagged: accounts.filter((a) => a.status === "FLAGGED").length,
        inactive: accounts.filter((a) => a.status === "INACTIVE").length,
    }), [accounts]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Account Management</h2>
                    <p className="text-muted-foreground">
                        Manage your social media accounts and proxies
                    </p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                </Button>
            </div>

            {/* Status Overview */}
            <div className="grid gap-4 sm:grid-cols-4">
                <Card className="cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => setStatusFilter("healthy")}>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{statusCounts.healthy}</p>
                            <p className="text-xs text-muted-foreground">Healthy</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setStatusFilter("warming")}>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{statusCounts.warming}</p>
                            <p className="text-xs text-muted-foreground">Warming Up</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-red-500/50 transition-colors" onClick={() => setStatusFilter("flagged")}>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{statusCounts.flagged}</p>
                            <p className="text-xs text-muted-foreground">Flagged</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-gray-500/50 transition-colors" onClick={() => setStatusFilter("inactive")}>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{statusCounts.inactive}</p>
                            <p className="text-xs text-muted-foreground">Inactive</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search accounts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="healthy">Healthy</SelectItem>
                        <SelectItem value="warming">Warming Up</SelectItem>
                        <SelectItem value="flagged">Flagged</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="All Platforms" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                </Select>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
                    <TabsList>
                        <TabsTrigger value="grid">
                            <LayoutGrid className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="list">
                            <List className="h-4 w-4" />
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Accounts Grid */}
            <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
                {filteredAccounts.map((account) => (
                    <Card key={account.id} className="overflow-hidden">
                        <CardContent className={viewMode === "grid" ? "p-4" : "p-4 flex items-center gap-4"}>
                            <div className={viewMode === "grid" ? "space-y-4" : "flex items-center gap-4 flex-1"}>
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                                            {platformIcons[account.platform] || account.platform.slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="font-medium">@{account.username}</p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {account.platform.toLowerCase()}
                                            </p>
                                        </div>
                                    </div>
                                    {viewMode === "grid" && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Edit Proxy</DropdownMenuItem>
                                                <DropdownMenuItem>Reset Warmup</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    Remove
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>

                                {viewMode === "grid" && (
                                    <>
                                        {/* Status & Health */}
                                        <div className="flex items-center justify-between">
                                            <StatusBadge status={account.status.toLowerCase() as StatusType} />
                                            <span className="text-sm text-muted-foreground">
                                                Health: <span className="font-medium text-foreground">{account.healthScore}%</span>
                                            </span>
                                        </div>

                                        {/* Warmup Progress */}
                                        {account.warmupPhase !== "COMPLETE" && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-muted-foreground">Warmup Progress</span>
                                                    <span>{account.warmupProgress}%</span>
                                                </div>
                                                <Progress value={account.warmupProgress} className="h-2" />
                                            </div>
                                        )}

                                        {/* Stats */}
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="text-muted-foreground">
                                                Today: <span className="font-medium text-foreground">{account.commentsToday}</span>
                                            </div>
                                            <div className="text-muted-foreground">
                                                Proxy: <span className="font-medium text-foreground">{account.proxy?.location || "None"}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {viewMode === "list" && (
                                <>
                                    <StatusBadge status={account.status.toLowerCase() as StatusType} />
                                    <div className="w-24">
                                        <Progress value={account.healthScore} className="h-2" />
                                    </div>
                                    <span className="text-sm w-12">{account.healthScore}%</span>
                                    <span className="text-sm text-muted-foreground w-20">{account.proxy?.location || "None"}</span>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                            <DropdownMenuItem>Edit Proxy</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredAccounts.length === 0 && (
                <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No accounts found</h3>
                    <p className="text-muted-foreground">
                        Try adjusting your search or filters
                    </p>
                </div>
            )}
        </div>
    );
}
