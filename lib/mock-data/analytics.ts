import { AnalyticsData } from "@/lib/types/dashboard";

export const mockAnalyticsData: AnalyticsData = {
    overview: {
        totalComments: 24500,
        avgEngagement: 3.2,
        conversions: 892,
        revenue: 12400,
        changes: {
            comments: 12,
            engagement: 0.4,
            conversions: 34,
            revenue: 28,
        },
    },
    timeSeries: [
        { date: "2024-01-28", comments: 3100, engagement: 2.9, conversions: 98 },
        { date: "2024-01-29", comments: 3250, engagement: 3.0, conversions: 105 },
        { date: "2024-01-30", comments: 3400, engagement: 3.1, conversions: 112 },
        { date: "2024-01-31", comments: 3200, engagement: 2.8, conversions: 108 },
        { date: "2024-02-01", comments: 3650, engagement: 3.3, conversions: 125 },
        { date: "2024-02-02", comments: 3800, engagement: 3.5, conversions: 142 },
        { date: "2024-02-03", comments: 4100, engagement: 3.8, conversions: 158 },
    ],
    topTemplates: [
        { id: "ct_003", name: "FOMO Trigger", engagement: 5.1, uses: 1567 },
        { id: "ct_008", name: "Scarcity Alert", engagement: 5.4, uses: 789 },
        { id: "ct_001", name: "Engagement Booster", engagement: 4.2, uses: 2340 },
        { id: "ct_005", name: "Urgency Push", engagement: 4.8, uses: 456 },
        { id: "ct_002", name: "Question Hook", engagement: 3.8, uses: 1890 },
    ],
    fomoMetrics: [
        { type: "scarcity", engagement: 5.4, conversions: 3.8, uses: 2356 },
        { type: "urgency", engagement: 4.8, conversions: 3.2, uses: 1890 },
        { type: "socialProof", engagement: 4.2, conversions: 2.9, uses: 3120 },
        { type: "exclusivity", engagement: 3.9, conversions: 2.5, uses: 1234 },
    ],
};
