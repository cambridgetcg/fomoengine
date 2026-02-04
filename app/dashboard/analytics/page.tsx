"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { useAnalyticsOverview, useTimeSeries, useTemplates, useExport } from "@/lib/api/hooks";
import {
    MessageSquare,
    TrendingUp,
    Target,
    DollarSign,
    Download,
    ArrowUpRight,
    Flame,
    Clock,
    Users,
    Sparkles,
    Loader2,
} from "lucide-react";

const fomoIcons: Record<string, typeof Flame> = {
    scarcity: Flame,
    urgency: Clock,
    socialProof: Users,
    exclusivity: Sparkles,
    SCARCITY: Flame,
    URGENCY: Clock,
    SOCIAL_PROOF: Users,
    EXCLUSIVITY: Sparkles,
};

const fomoLabels: Record<string, string> = {
    scarcity: "Scarcity",
    urgency: "Urgency",
    socialProof: "Social Proof",
    exclusivity: "Exclusivity",
    SCARCITY: "Scarcity",
    URGENCY: "Urgency",
    SOCIAL_PROOF: "Social Proof",
    EXCLUSIVITY: "Exclusivity",
};

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
}

export default function AnalyticsPage() {
    const [period, setPeriod] = useState("7d");
    const { overview, loading: overviewLoading } = useAnalyticsOverview();
    const { timeseries, loading: timeseriesLoading } = useTimeSeries({
        metric: "comments",
        granularity: period === "24h" ? "day" : period === "7d" ? "day" : period === "30d" ? "week" : "month",
    });
    const { templates, loading: templatesLoading } = useTemplates({ isActive: true });
    const { exportData, loading: exportLoading } = useExport();

    const loading = overviewLoading || timeseriesLoading || templatesLoading;

    // Get top templates sorted by engagement
    const topTemplates = useMemo(() =>
        [...templates].sort((a, b) => b.avgEngagement - a.avgEngagement).slice(0, 5),
        [templates]
    );

    // Build FOMO metrics from overview
    const fomoMetrics = useMemo(() => {
        if (!overview?.fomo) return [];
        return [
            { type: "SCARCITY", uses: overview.fomo.scarcityUses, engagement: 6.2, conversions: 4.1 },
            { type: "URGENCY", uses: overview.fomo.urgencyUses, engagement: 5.8, conversions: 3.8 },
            { type: "SOCIAL_PROOF", uses: overview.fomo.socialProofUses, engagement: 5.1, conversions: 3.2 },
            { type: "EXCLUSIVITY", uses: overview.fomo.exclusivityUses, engagement: 4.7, conversions: 2.9 },
        ];
    }, [overview]);

    // Calculate max for chart scaling
    const chartData = timeseries?.datasets?.[0]?.data || [];
    const chartLabels = timeseries?.labels || [];
    const maxComments = Math.max(...chartData, 1);

    const handleExport = async () => {
        await exportData({ type: "analytics", format: "csv" });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const stats = overview || {
        comments: { total: 0, todayCount: 0 },
        engagement: { avgEngagementRate: 0, conversions: 0, totalLikes: 0, totalImpressions: 0 },
        campaigns: { totalSpend: 0 },
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Analytics</h2>
                    <p className="text-muted-foreground">
                        Track your engagement and FOMO performance
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">Last 24 hours</SelectItem>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExport} disabled={exportLoading}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    icon={Target}
                />
                <StatCard
                    title="Total Spend"
                    value={`$${stats.campaigns.totalSpend.toLocaleString()}`}
                    change={0}
                    icon={DollarSign}
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Engagement Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Comments Over Time</CardTitle>
                        <CardDescription>Daily comment activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] flex items-end justify-between gap-2">
                            {chartData.length > 0 ? chartData.map((value, i) => (
                                <div key={chartLabels[i] || i} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full flex flex-col items-center">
                                        <span className="text-xs font-medium text-green-500 mb-1">
                                            {value}
                                        </span>
                                        <div
                                            className="w-full bg-primary/80 rounded-t-sm transition-all hover:bg-primary"
                                            style={{
                                                height: `${(value / maxComments) * 180}px`,
                                                minHeight: value > 0 ? "4px" : "0px",
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {chartLabels[i] ? new Date(chartLabels[i]).toLocaleDateString("en-US", { weekday: "short" }) : ""}
                                    </span>
                                </div>
                            )) : (
                                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                    No data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* FOMO Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>FOMO Trigger Performance</CardTitle>
                        <CardDescription>Engagement and conversion rates by trigger type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {fomoMetrics.map((metric) => {
                                const Icon = fomoIcons[metric.type];
                                return (
                                    <div key={metric.type} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Icon className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{fomoLabels[metric.type]}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {metric.uses.toLocaleString()} uses
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-sm text-green-500">
                                                    {metric.engagement}% eng
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {metric.conversions}% conv
                                                </p>
                                            </div>
                                        </div>
                                        <Progress value={metric.engagement * 15} className="h-2" />
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Templates */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Templates</CardTitle>
                    <CardDescription>Templates ranked by engagement rate</CardDescription>
                </CardHeader>
                <CardContent>
                    {topTemplates.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No templates yet. Create comment templates to see performance data.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {topTemplates.map((template, i) => (
                                <div
                                    key={template.id}
                                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium">{template.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {template.timesUsed.toLocaleString()} total uses
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Engagement</p>
                                            <p className="font-bold text-green-500 flex items-center gap-1">
                                                {template.avgEngagement.toFixed(1)}%
                                                <ArrowUpRight className="h-4 w-4" />
                                            </p>
                                        </div>
                                        <div className="w-32">
                                            <Progress value={template.avgEngagement * 15} className="h-2" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card>
                <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
                    <CardDescription>From impressions to conversions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between gap-4">
                        {[
                            { label: "Impressions", value: formatNumber(stats.engagement.totalImpressions || 0), change: 0 },
                            { label: "Likes", value: formatNumber(stats.engagement.totalLikes || 0), change: 0 },
                            { label: "Comments", value: formatNumber(stats.comments.total), change: 0 },
                            { label: "Conversions", value: formatNumber(stats.engagement.conversions), change: 0 },
                            { label: "Spend", value: `$${formatNumber(stats.campaigns.totalSpend)}`, change: 0 },
                        ].map((step, i, arr) => (
                            <div key={step.label} className="flex items-center gap-4">
                                <div className="text-center flex-1">
                                    <p className="text-2xl font-bold">{step.value}</p>
                                    <p className="text-sm text-muted-foreground">{step.label}</p>
                                </div>
                                {i < arr.length - 1 && (
                                    <ArrowUpRight className="h-5 w-5 text-muted-foreground rotate-45" />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
