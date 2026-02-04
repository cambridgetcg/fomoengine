import { z } from "zod";

// ============ COMMON ============

export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============ ACCOUNTS ============

export const platformSchema = z.enum([
    "INSTAGRAM",
    "TIKTOK",
    "TWITTER",
    "FACEBOOK",
    "LINKEDIN",
    "YOUTUBE",
]);

export const accountStatusSchema = z.enum([
    "HEALTHY",
    "WARMING",
    "FLAGGED",
    "INACTIVE",
    "SUSPENDED",
]);

export const createAccountSchema = z.object({
    platform: platformSchema,
    username: z.string().min(1).max(100),
    displayName: z.string().max(200).optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    proxyId: z.string().cuid().optional(),
});

export const updateAccountSchema = z.object({
    displayName: z.string().max(200).optional(),
    dailyCommentLimit: z.number().int().min(1).max(1000).optional(),
    proxyId: z.string().cuid().nullable().optional(),
    status: accountStatusSchema.optional(),
});

// ============ PROXIES ============

export const proxyStatusSchema = z.enum(["ACTIVE", "INACTIVE", "BANNED"]);

export const createProxySchema = z.object({
    provider: z.string().min(1).max(100),
    host: z.string().min(1).max(255),
    port: z.number().int().min(1).max(65535),
    username: z.string().max(100).optional(),
    password: z.string().max(255).optional(),
    location: z.string().min(1).max(100),
    country: z.string().length(2),
});

export const updateProxySchema = z.object({
    host: z.string().min(1).max(255).optional(),
    port: z.number().int().min(1).max(65535).optional(),
    username: z.string().max(100).optional(),
    password: z.string().max(255).optional(),
    location: z.string().min(1).max(100).optional(),
    status: proxyStatusSchema.optional(),
});

// ============ COMMENTS ============

export const commentToneSchema = z.enum([
    "FRIENDLY",
    "PROFESSIONAL",
    "CASUAL",
    "URGENT",
    "FOMO",
]);

export const fomoTypeSchema = z.enum([
    "SCARCITY",
    "URGENCY",
    "SOCIAL_PROOF",
    "EXCLUSIVITY",
]);

export const createTemplateSchema = z.object({
    name: z.string().min(1).max(200),
    content: z.string().min(1).max(2000),
    platform: platformSchema.optional(),
    tone: commentToneSchema,
    fomoType: fomoTypeSchema.optional(),
});

export const updateTemplateSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    content: z.string().min(1).max(2000).optional(),
    platform: platformSchema.nullable().optional(),
    tone: commentToneSchema.optional(),
    fomoType: fomoTypeSchema.nullable().optional(),
    isActive: z.boolean().optional(),
});

export const generateCommentSchema = z.object({
    prompt: z.string().min(1).max(1000),
    platform: platformSchema,
    tone: commentToneSchema,
    fomoType: fomoTypeSchema.optional(),
    targetContext: z.string().max(2000).optional(),
    count: z.number().int().min(1).max(10).default(3),
});

export const scheduleCommentSchema = z.object({
    accountId: z.string().cuid(),
    templateId: z.string().cuid().optional(),
    content: z.string().min(1).max(2000).optional(),
    targetPostUrl: z.string().url(),
    scheduledFor: z.string().datetime().optional(),
    campaignId: z.string().cuid().optional(),
});

export const bulkScheduleSchema = z.object({
    jobs: z.array(scheduleCommentSchema).min(1).max(100),
});

// ============ CAMPAIGNS ============

export const campaignStatusSchema = z.enum([
    "DRAFT",
    "ACTIVE",
    "PAUSED",
    "COMPLETED",
    "ARCHIVED",
]);

export const createCampaignSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    budgetDaily: z.number().positive(),
    budgetTotal: z.number().positive(),
    targetPlatforms: z.array(platformSchema).min(1),
    targetHashtags: z.array(z.string()).optional(),
    targetAccounts: z.array(z.string()).optional(),
    targetKeywords: z.array(z.string()).optional(),
    demographics: z
        .object({
            ageRange: z.string().optional(),
            locations: z.array(z.string()).optional(),
            interests: z.array(z.string()).optional(),
        })
        .optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    scheduleConfig: z
        .object({
            daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
            hoursActive: z.tuple([z.number(), z.number()]).optional(),
            commentsPerDay: z.number().int().positive().optional(),
        })
        .optional(),
});

export const updateCampaignSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    budgetDaily: z.number().positive().optional(),
    budgetTotal: z.number().positive().optional(),
    targetPlatforms: z.array(platformSchema).min(1).optional(),
    targetHashtags: z.array(z.string()).optional(),
    targetAccounts: z.array(z.string()).optional(),
    targetKeywords: z.array(z.string()).optional(),
    demographics: z.record(z.string(), z.unknown()).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    scheduleConfig: z.record(z.string(), z.unknown()).optional(),
});

// ============ FILTERS ============

export const accountFiltersSchema = z.object({
    platform: platformSchema.optional(),
    status: accountStatusSchema.optional(),
    warmupPhase: z.enum(["PENDING", "ACTIVE", "COMPLETE"]).optional(),
    search: z.string().optional(),
});

export const proxyFiltersSchema = z.object({
    status: proxyStatusSchema.optional(),
    country: z.string().optional(),
    location: z.string().optional(),
    provider: z.string().optional(),
});

export const templateFiltersSchema = z.object({
    platform: platformSchema.optional(),
    tone: commentToneSchema.optional(),
    fomoType: fomoTypeSchema.optional(),
    isActive: z.boolean().optional(),
    search: z.string().optional(),
});

export const jobFiltersSchema = z.object({
    accountId: z.string().optional(),
    campaignId: z.string().optional(),
    status: z.enum([
        "PENDING",
        "SCHEDULED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
    ]).optional(),
    targetPlatform: platformSchema.optional(),
    scheduledAfter: z.date().optional(),
    scheduledBefore: z.date().optional(),
});

export const campaignFiltersSchema = z.object({
    status: campaignStatusSchema.optional(),
    targetPlatform: platformSchema.optional(),
    search: z.string().optional(),
});

// ============ JOBS ============

export const createJobSchema = z.object({
    accountId: z.string().cuid(),
    templateId: z.string().cuid().optional(),
    campaignId: z.string().cuid().optional(),
    targetPlatform: platformSchema,
    targetPostUrl: z.string().url(),
    targetPostId: z.string().optional(),
    content: z.string().min(1).max(2000),
    scheduledFor: z.string().datetime().optional(),
});

// ============ ANALYTICS ============

export const analyticsQuerySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    granularity: z.enum(["hour", "day", "week", "month"]).default("day"),
});

// ============ HELPER ============

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
}

export function safeValidateBody<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}
