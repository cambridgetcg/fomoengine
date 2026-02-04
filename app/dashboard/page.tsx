"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { useAnalyticsOverview, useAccounts, useCampaigns, useTemplates } from "@/lib/api/hooks";

type StatusType = "healthy" | "warming" | "flagged" | "inactive" | "active" | "paused" | "draft" | "completed";
import {
    MessageSquare,
    Users,
    Megaphone,
    TrendingUp,
    Activity,
    Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function DashboardOverview() {
    const { overview, loading: overviewLoading } = useAnalyticsOverview(true);
    const { accounts, loading: accountsLoading } = useAccounts();
    const { campaigns, loading: campaignsLoading } = useCampaigns();
    const { templates, loading: templatesLoading } = useTemplates({ isActive: true });

    const loading = overviewLoading || accountsLoading || campaignsLoading || templatesLoading;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const activeAccounts = accounts.filter((a) => a.status === "HEALTHY").length;
    const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;
    const activeTemplates = templates.length;

    // Provide default values if overview is null
    const stats = overview || {
        comments: { total: 0, todayCount: 0 },
        engagement: { avgEngagementRate: 0, conversions: 0, totalLikes: 0 },
        campaigns: { totalSpend: 0 },
        accounts: { total: 0, healthy: 0, avgHealth: 0 },
        metrics: { successRate: 0 },
    };

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Comments"
                    value={stats.comments.total.toLocaleString()}
                    change={stats.comments.todayCount}
                    icon={MessageSquare}
                />
                <StatCard
                    title="Avg Engagement"
                    value={`${stats.engagement.avgEngagementRate.toFixed(1)}%`}
                    change={0}
                    icon={TrendingUp}
                />
                <StatCard
                    title="Conversions"
                    value={stats.engagement.conversions.toLocaleString()}
                    change={0}
                    icon={Activity}
                />
                <StatCard
                    title="Total Spend"
                    value={`$${stats.campaigns.totalSpend.toLocaleString()}`}
                    change={0}
                    icon={Megaphone}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Active Campaigns */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Megaphone className="h-5 w-5" />
                            Active Campaigns
                        </CardTitle>
                        <CardDescription>
                            {activeCampaigns} of {campaigns.length} campaigns running
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {campaigns.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No campaigns yet. Create your first campaign to get started.
                                </p>
                            ) : (
                                campaigns.slice(0, 4).map((campaign) => (
                                    <div key={campaign.id} className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="font-medium">{campaign.name}</p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>
                                                    ${Number(campaign.budgetSpent).toFixed(0)} / ${Number(campaign.budgetTotal)}
                                                </span>
                                            </div>
                                        </div>
                                        <StatusBadge status={campaign.status.toLowerCase() as StatusType} />
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Account Health */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Account Health
                        </CardTitle>
                        <CardDescription>
                            {activeAccounts} of {accounts.length} accounts healthy
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {accounts.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No accounts connected. Add your first social account to get started.
                                </p>
                            ) : (
                                accounts.slice(0, 5).map((account) => (
                                    <div key={account.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                                {account.platform.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">@{account.username}</p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {account.platform.toLowerCase()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24">
                                                <Progress value={account.healthScore} className="h-2" />
                                            </div>
                                            <span className="text-sm font-medium w-8">{account.healthScore}%</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Templates */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Active Templates
                    </CardTitle>
                    <CardDescription>
                        {activeTemplates} active templates ready for use
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {templates.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No templates yet. Create comment templates to start automating.
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {templates.slice(0, 4).map((template, i) => (
                                <div
                                    key={template.id}
                                    className="p-4 rounded-lg border bg-card"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            #{i + 1}
                                        </span>
                                        <span className="text-xs font-semibold text-green-500">
                                            {template.avgEngagement.toFixed(1)}% eng
                                        </span>
                                    </div>
                                    <p className="font-medium text-sm truncate">{template.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {template.timesUsed.toLocaleString()} uses
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
