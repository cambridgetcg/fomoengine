import { Campaign } from "@/lib/types/dashboard";

export const mockCampaigns: Campaign[] = [
    {
        id: "camp_001",
        name: "Summer Sale Push",
        status: "active",
        budget: { daily: 500, spent: 342.50, total: 5000 },
        targeting: {
            platforms: ["instagram", "tiktok"],
            demographics: ["18-35", "US", "Fitness"],
        },
        metrics: {
            impressions: 45000,
            engagement: 1890,
            conversions: 89,
            cpc: 3.85,
        },
        startDate: "2024-02-01",
        endDate: "2024-02-28",
    },
    {
        id: "camp_002",
        name: "Product Launch",
        status: "active",
        budget: { daily: 750, spent: 1250.00, total: 10000 },
        targeting: {
            platforms: ["instagram", "facebook", "twitter"],
            demographics: ["25-45", "US/CA/UK", "Tech"],
        },
        metrics: {
            impressions: 78000,
            engagement: 3200,
            conversions: 156,
            cpc: 2.95,
        },
        startDate: "2024-01-25",
        endDate: "2024-03-15",
    },
    {
        id: "camp_003",
        name: "Brand Awareness Q1",
        status: "paused",
        budget: { daily: 200, spent: 890.00, total: 3000 },
        targeting: {
            platforms: ["linkedin", "twitter"],
            demographics: ["30-55", "Global", "Business"],
        },
        metrics: {
            impressions: 32000,
            engagement: 890,
            conversions: 34,
            cpc: 4.50,
        },
        startDate: "2024-01-01",
        endDate: "2024-03-31",
    },
    {
        id: "camp_004",
        name: "Viral TikTok Push",
        status: "active",
        budget: { daily: 300, spent: 156.00, total: 2000 },
        targeting: {
            platforms: ["tiktok"],
            demographics: ["16-28", "US", "Entertainment"],
        },
        metrics: {
            impressions: 125000,
            engagement: 8900,
            conversions: 234,
            cpc: 0.67,
        },
        startDate: "2024-02-01",
        endDate: "2024-02-14",
    },
    {
        id: "camp_005",
        name: "Holiday Promo",
        status: "completed",
        budget: { daily: 1000, spent: 4500.00, total: 5000 },
        targeting: {
            platforms: ["instagram", "facebook"],
            demographics: ["25-50", "US", "Shopping"],
        },
        metrics: {
            impressions: 250000,
            engagement: 12000,
            conversions: 890,
            cpc: 1.85,
        },
        startDate: "2023-12-15",
        endDate: "2024-01-05",
    },
    {
        id: "camp_006",
        name: "Spring Collection",
        status: "draft",
        budget: { daily: 400, spent: 0, total: 4000 },
        targeting: {
            platforms: ["instagram", "tiktok", "facebook"],
            demographics: ["18-40", "US/EU", "Fashion"],
        },
        metrics: {
            impressions: 0,
            engagement: 0,
            conversions: 0,
            cpc: 0,
        },
        startDate: "2024-03-01",
        endDate: "2024-04-30",
    },
];
