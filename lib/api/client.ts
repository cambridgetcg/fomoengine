import { ApiResponse } from "@/lib/types/api";

const API_BASE = "/api/v1";

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  params?: Record<string, string | number | boolean | undefined>;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, params } = options;

  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  const data = await response.json();

  return data as ApiResponse<T>;
}

// ============ ACCOUNTS ============

export interface Account {
  id: string;
  platform: string;
  username: string;
  displayName: string | null;
  status: string;
  healthScore: number;
  warmupProgress: number;
  warmupPhase: string;
  commentsToday: number;
  dailyCommentLimit: number;
  proxy: { id: string; location: string; country: string; status: string } | null;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface AccountStats {
  accounts: {
    total: number;
    byStatus: Record<string, number>;
    byPlatform: Record<string, number>;
    byWarmupPhase: Record<string, number>;
  };
  health: {
    totalAccounts: number;
    averageHealth: number;
    needsAttention: number;
    staleChecks: number;
  };
}

export const accountsApi = {
  list: (params?: { platform?: string; status?: string; search?: string; page?: number }) =>
    apiRequest<Account[]>("/accounts", { params }),

  get: (id: string) => apiRequest<Account>(`/accounts/${id}`),

  create: (data: { platform: string; username: string; displayName?: string }) =>
    apiRequest<Account>("/accounts", { method: "POST", body: data }),

  update: (id: string, data: Partial<Account>) =>
    apiRequest<Account>(`/accounts/${id}`, { method: "PATCH", body: data }),

  delete: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/accounts/${id}`, { method: "DELETE" }),

  checkHealth: (id: string) =>
    apiRequest<{ accountId: string; isHealthy: boolean; score: number; issues: string[] }>(
      `/accounts/${id}/health`,
      { method: "POST" }
    ),

  stats: () => apiRequest<AccountStats>("/accounts/stats"),
};

// ============ PROXIES ============

export interface Proxy {
  id: string;
  provider: string;
  host: string;
  port: number;
  location: string;
  country: string;
  status: string;
  lastCheckAt: string | null;
  responseTimeMs: number | null;
  _count?: { accounts: number };
}

export const proxiesApi = {
  list: (params?: { status?: string; country?: string }) =>
    apiRequest<Proxy[]>("/proxies", { params }),

  get: (id: string) => apiRequest<Proxy>(`/proxies/${id}`),

  create: (data: {
    provider: string;
    host: string;
    port: number;
    username?: string;
    password?: string;
    location: string;
    country: string;
  }) => apiRequest<Proxy>("/proxies", { method: "POST", body: data }),

  update: (id: string, data: Partial<Proxy>) =>
    apiRequest<Proxy>(`/proxies/${id}`, { method: "PATCH", body: data }),

  delete: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/proxies/${id}`, { method: "DELETE" }),

  assign: (proxyId: string, accountId: string) =>
    apiRequest<Account>(`/proxies/${proxyId}/assign`, {
      method: "POST",
      body: { accountId },
    }),

  stats: () => apiRequest<{ total: number; byStatus: Record<string, number> }>("/proxies/stats"),
};

// ============ COMMENT TEMPLATES ============

export interface CommentTemplate {
  id: string;
  name: string;
  content: string;
  platform: string | null;
  tone: string;
  fomoType: string | null;
  isActive: boolean;
  timesUsed: number;
  avgEngagement: number;
  lastUsedAt: string | null;
  createdAt: string;
}

export const templatesApi = {
  list: (params?: { platform?: string; tone?: string; isActive?: boolean; search?: string }) =>
    apiRequest<CommentTemplate[]>("/comments/templates", { params }),

  get: (id: string) => apiRequest<CommentTemplate>(`/comments/templates/${id}`),

  create: (data: {
    name: string;
    content: string;
    platform?: string;
    tone: string;
    fomoType?: string;
  }) => apiRequest<CommentTemplate>("/comments/templates", { method: "POST", body: data }),

  update: (id: string, data: Partial<CommentTemplate>) =>
    apiRequest<CommentTemplate>(`/comments/templates/${id}`, { method: "PATCH", body: data }),

  delete: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/comments/templates/${id}`, { method: "DELETE" }),

  generate: (data: {
    platform: string;
    tone: string;
    fomoType?: string;
    postContent?: string;
    variations?: number;
  }) =>
    apiRequest<{ comments: Array<{ content: string; tone: string; confidence: number }> }>(
      "/comments/generate",
      { method: "POST", body: data }
    ),

  stats: () =>
    apiRequest<{
      templates: { total: number; byTone: Record<string, number> };
      jobs: { total: number; byStatus: Record<string, number> };
    }>("/comments/stats"),
};

// ============ COMMENT JOBS ============

export interface CommentJob {
  id: string;
  accountId: string;
  templateId: string | null;
  campaignId: string | null;
  targetPlatform: string;
  targetPostUrl: string;
  content: string;
  status: string;
  scheduledFor: string | null;
  processedAt: string | null;
  commentUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  account?: { id: string; username: string; platform: string };
  template?: { id: string; name: string };
  engagement?: { likes: number; replies: number; impressions: number };
}

export const jobsApi = {
  list: (params?: { accountId?: string; campaignId?: string; status?: string; page?: number }) =>
    apiRequest<CommentJob[]>("/comments/jobs", { params }),

  get: (id: string) => apiRequest<CommentJob>(`/comments/jobs/${id}`),

  create: (data: {
    accountId: string;
    templateId?: string;
    campaignId?: string;
    targetPlatform: string;
    targetPostUrl: string;
    content: string;
    scheduledFor?: string;
  }) => apiRequest<CommentJob>("/comments/jobs", { method: "POST", body: data }),

  cancel: (id: string) =>
    apiRequest<{ cancelled: boolean }>(`/comments/jobs/${id}`, { method: "DELETE" }),

  retry: (id: string) =>
    apiRequest<CommentJob>(`/comments/jobs/${id}/retry`, { method: "POST" }),
};

// ============ CAMPAIGNS ============

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  budgetDaily: number;
  budgetTotal: number;
  budgetSpent: number;
  targetPlatforms: string[];
  targetHashtags: string[];
  targetAccounts: string[];
  impressions: number;
  engagements: number;
  conversions: number;
  cpc: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  _count?: { commentJobs: number };
}

export const campaignsApi = {
  list: (params?: { status?: string; search?: string; page?: number }) =>
    apiRequest<Campaign[]>("/campaigns", { params }),

  get: (id: string) => apiRequest<Campaign>(`/campaigns/${id}`),

  create: (data: {
    name: string;
    description?: string;
    budgetDaily: number;
    budgetTotal: number;
    targetPlatforms: string[];
    targetHashtags?: string[];
    startDate?: string;
    endDate?: string;
  }) => apiRequest<Campaign>("/campaigns", { method: "POST", body: data }),

  update: (id: string, data: Partial<Campaign>) =>
    apiRequest<Campaign>(`/campaigns/${id}`, { method: "PATCH", body: data }),

  delete: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/campaigns/${id}`, { method: "DELETE" }),

  activate: (id: string) =>
    apiRequest<Campaign>(`/campaigns/${id}/activate`, { method: "POST" }),

  pause: (id: string) =>
    apiRequest<Campaign>(`/campaigns/${id}/activate`, { method: "DELETE" }),

  stats: () =>
    apiRequest<{
      total: number;
      byStatus: Record<string, number>;
      budget: { total: number; spent: number };
      engagement: { impressions: number; engagements: number; conversions: number };
    }>("/campaigns/stats"),
};

// ============ ANALYTICS ============

export interface AnalyticsOverview {
  accounts: {
    total: number;
    healthy: number;
    warming: number;
    flagged: number;
    avgHealth: number;
  };
  comments: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    todayCount: number;
  };
  campaigns: {
    total: number;
    active: number;
    totalSpend: number;
    budgetRemaining: number;
  };
  engagement: {
    totalLikes: number;
    totalReplies: number;
    totalImpressions: number;
    avgEngagementRate: number;
    conversions: number;
  };
  fomo: {
    scarcityUses: number;
    urgencyUses: number;
    socialProofUses: number;
    exclusivityUses: number;
    topPerformer: string;
  };
  metrics?: {
    successRate: number;
    activeAccountRate: number;
    budgetUtilization: number;
  };
}

export interface TimeSeriesData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
}

export const analyticsApi = {
  overview: (dashboard?: boolean) =>
    apiRequest<AnalyticsOverview>("/analytics/overview", { params: { dashboard } }),

  timeseries: (params: {
    metric: "comments" | "engagement" | "health" | "fomo" | "conversions";
    granularity?: "day" | "week" | "month";
    startDate?: string;
    endDate?: string;
  }) => apiRequest<TimeSeriesData & { metric: string; range: { start: string; end: string } }>(
    "/analytics/timeseries",
    { params }
  ),

  export: (params: {
    type: "comments" | "accounts" | "campaigns" | "analytics";
    format?: "json" | "csv";
    startDate?: string;
    endDate?: string;
  }) => apiRequest<{ type: string; count: number; records: unknown[] }>("/analytics/export", { params }),
};
