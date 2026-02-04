import { Platform, AccountStatus, CampaignStatus, CommentTone, FomoTriggerType } from "@prisma/client";

// ============ COMMON TYPES ============

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: PaginationMeta;
}

export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore?: boolean;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

// ============ AUTH CONTEXT ============

export interface AuthContext {
    userId: string;
    organizationId: string;
    role: string;
}

// ============ ACCOUNTS API ============

export interface CreateAccountRequest {
    platform: Platform;
    username: string;
    displayName?: string;
    accessToken?: string;
    refreshToken?: string;
    proxyId?: string;
}

export interface UpdateAccountRequest {
    displayName?: string;
    dailyCommentLimit?: number;
    proxyId?: string | null;
    status?: AccountStatus;
}

export interface AccountResponse {
    id: string;
    platform: Platform;
    username: string;
    displayName: string | null;
    status: AccountStatus;
    healthScore: number;
    warmupProgress: number;
    warmupPhase: string;
    commentsToday: number;
    dailyCommentLimit: number;
    proxy: {
        id: string;
        location: string;
    } | null;
    lastActivityAt: string | null;
    createdAt: string;
}

// ============ PROXIES API ============

export interface CreateProxyRequest {
    provider: string;
    host: string;
    port: number;
    username?: string;
    password?: string;
    location: string;
    country: string;
}

export interface UpdateProxyRequest {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    location?: string;
    status?: "ACTIVE" | "INACTIVE" | "BANNED";
}

export interface ProxyResponse {
    id: string;
    provider: string;
    host: string;
    port: number;
    location: string;
    country: string;
    status: string;
    accountCount: number;
    lastCheckAt: string | null;
    responseTimeMs: number | null;
}

// ============ COMMENTS API ============

export interface CreateTemplateRequest {
    name: string;
    content: string;
    platform?: Platform;
    tone: CommentTone;
    fomoType?: FomoTriggerType;
}

export interface UpdateTemplateRequest {
    name?: string;
    content?: string;
    platform?: Platform | null;
    tone?: CommentTone;
    fomoType?: FomoTriggerType | null;
    isActive?: boolean;
}

export interface TemplateResponse {
    id: string;
    name: string;
    content: string;
    platform: Platform | null;
    tone: CommentTone;
    fomoType: FomoTriggerType | null;
    isActive: boolean;
    timesUsed: number;
    avgEngagement: number;
    lastUsedAt: string | null;
    createdAt: string;
}

export interface GenerateCommentRequest {
    prompt: string;
    platform: Platform;
    tone: CommentTone;
    fomoType?: FomoTriggerType;
    targetContext?: string;
    count?: number;
}

export interface GenerateCommentResponse {
    variations: string[];
    model: string;
}

export interface ScheduleCommentRequest {
    accountId: string;
    templateId?: string;
    content?: string;
    targetPostUrl: string;
    scheduledFor?: string;
    campaignId?: string;
}

export interface BulkScheduleRequest {
    jobs: ScheduleCommentRequest[];
}

export interface CommentJobResponse {
    id: string;
    accountId: string;
    templateId: string | null;
    campaignId: string | null;
    targetPlatform: Platform;
    targetPostUrl: string;
    content: string;
    status: string;
    scheduledFor: string | null;
    processedAt: string | null;
    commentUrl: string | null;
    errorMessage: string | null;
    createdAt: string;
}

// ============ CAMPAIGNS API ============

export interface CreateCampaignRequest {
    name: string;
    description?: string;
    budgetDaily: number;
    budgetTotal: number;
    targetPlatforms: Platform[];
    targetHashtags?: string[];
    targetAccounts?: string[];
    targetKeywords?: string[];
    demographics?: {
        ageRange?: string;
        locations?: string[];
        interests?: string[];
    };
    startDate?: string;
    endDate?: string;
    scheduleConfig?: {
        daysOfWeek?: number[];
        hoursActive?: [number, number];
        commentsPerDay?: number;
    };
}

export interface UpdateCampaignRequest {
    name?: string;
    description?: string;
    budgetDaily?: number;
    budgetTotal?: number;
    targetPlatforms?: Platform[];
    targetHashtags?: string[];
    targetAccounts?: string[];
    targetKeywords?: string[];
    demographics?: Record<string, unknown>;
    startDate?: string;
    endDate?: string;
    scheduleConfig?: Record<string, unknown>;
}

export interface CampaignResponse {
    id: string;
    name: string;
    description: string | null;
    status: CampaignStatus;
    budgetDaily: number;
    budgetTotal: number;
    budgetSpent: number;
    targetPlatforms: Platform[];
    impressions: number;
    engagements: number;
    conversions: number;
    cpc: number;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
}

// ============ ANALYTICS API ============

export interface AnalyticsOverviewResponse {
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
    period: {
        start: string;
        end: string;
    };
}

export interface TimeSeriesParams {
    startDate: string;
    endDate: string;
    granularity?: "hour" | "day" | "week" | "month";
}

export interface TimeSeriesDataPoint {
    date: string;
    comments: number;
    engagement: number;
    conversions: number;
    revenue: number;
}

export interface FomoMetricsResponse {
    scarcity: { engagement: number; conversions: number; uses: number };
    urgency: { engagement: number; conversions: number; uses: number };
    socialProof: { engagement: number; conversions: number; uses: number };
    exclusivity: { engagement: number; conversions: number; uses: number };
}

export interface TopTemplateResponse {
    id: string;
    name: string;
    engagement: number;
    uses: number;
    conversions: number;
}
