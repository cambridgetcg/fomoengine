// Platform types
export type Platform = "instagram" | "tiktok" | "twitter" | "facebook" | "linkedin" | "youtube";

// Comment Template Types
export interface CommentTemplate {
    id: string;
    name: string;
    content: string;
    platform: Platform;
    tone: "friendly" | "professional" | "casual" | "urgent" | "fomo";
    isActive: boolean;
    stats: {
        timesUsed: number;
        avgEngagement: number;
        lastUsed: string | null;
    };
    createdAt: string;
}

// Account Types
export type AccountStatus = "healthy" | "warming" | "flagged" | "inactive";

export interface Account {
    id: string;
    username: string;
    platform: Platform;
    status: AccountStatus;
    proxy: {
        location: string;
        ip: string;
    };
    warmup: {
        progress: number;
        phase: "pending" | "active" | "complete";
    };
    health: {
        score: number;
        lastCheck: string;
    };
    stats: {
        commentsToday: number;
        commentsTotal: number;
        lastActivity: string;
    };
}

// Campaign Types
export type CampaignStatus = "active" | "paused" | "draft" | "completed";

export interface Campaign {
    id: string;
    name: string;
    status: CampaignStatus;
    budget: {
        daily: number;
        spent: number;
        total: number;
    };
    targeting: {
        platforms: Platform[];
        demographics: string[];
    };
    metrics: {
        impressions: number;
        engagement: number;
        conversions: number;
        cpc: number;
    };
    startDate: string;
    endDate: string;
}

// Analytics Types
export interface AnalyticsOverview {
    totalComments: number;
    avgEngagement: number;
    conversions: number;
    revenue: number;
    changes: {
        comments: number;
        engagement: number;
        conversions: number;
        revenue: number;
    };
}

export interface TimeSeriesData {
    date: string;
    comments: number;
    engagement: number;
    conversions: number;
}

export interface FomoMetric {
    type: "scarcity" | "urgency" | "socialProof" | "exclusivity";
    engagement: number;
    conversions: number;
    uses: number;
}

export interface AnalyticsData {
    overview: AnalyticsOverview;
    timeSeries: TimeSeriesData[];
    topTemplates: {
        id: string;
        name: string;
        engagement: number;
        uses: number;
    }[];
    fomoMetrics: FomoMetric[];
}

// Navigation
export interface NavItem {
    title: string;
    href: string;
    icon: string;
    badge?: number;
}
