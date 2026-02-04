"use client";

import { useState, useEffect, useCallback } from "react";
import { ApiResponse } from "@/lib/types/api";
import {
  accountsApi,
  proxiesApi,
  templatesApi,
  jobsApi,
  campaignsApi,
  analyticsApi,
  Account,
  AccountStats,
  Proxy,
  CommentTemplate,
  CommentJob,
  Campaign,
  AnalyticsOverview,
  TimeSeriesData,
} from "./client";

// Generic hook for API requests with loading and error states
function useApiRequest<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (request: Promise<ApiResponse<T>>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await request;
      if (response.success && response.data) {
        setData(response.data);
        return response.data;
      } else {
        const errorMsg = response.error?.message || "Request failed";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute, setData };
}

// ============ ACCOUNTS HOOKS ============

export function useAccounts(params?: { platform?: string; status?: string; search?: string }) {
  const { data, loading, error, execute } = useApiRequest<Account[]>();

  const fetch = useCallback(() => {
    return execute(accountsApi.list(params));
  }, [execute, params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { accounts: data || [], loading, error, refetch: fetch };
}

export function useAccount(id: string) {
  const { data, loading, error, execute } = useApiRequest<Account>();

  useEffect(() => {
    if (id) {
      execute(accountsApi.get(id));
    }
  }, [execute, id]);

  return { account: data, loading, error };
}

export function useAccountStats() {
  const { data, loading, error, execute } = useApiRequest<AccountStats>();

  useEffect(() => {
    execute(accountsApi.stats());
  }, [execute]);

  return { stats: data, loading, error };
}

export function useAccountMutations() {
  const [loading, setLoading] = useState(false);

  const createAccount = async (data: { platform: string; username: string; displayName?: string }) => {
    setLoading(true);
    try {
      const response = await accountsApi.create(data);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (id: string, data: Partial<Account>) => {
    setLoading(true);
    try {
      const response = await accountsApi.update(id, data);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (id: string) => {
    setLoading(true);
    try {
      const response = await accountsApi.delete(id);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async (id: string) => {
    setLoading(true);
    try {
      const response = await accountsApi.checkHealth(id);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  return { createAccount, updateAccount, deleteAccount, checkHealth, loading };
}

// ============ PROXIES HOOKS ============

export function useProxies(params?: { status?: string; country?: string }) {
  const { data, loading, error, execute } = useApiRequest<Proxy[]>();

  const fetch = useCallback(() => {
    return execute(proxiesApi.list(params));
  }, [execute, params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { proxies: data || [], loading, error, refetch: fetch };
}

// ============ TEMPLATES HOOKS ============

export function useTemplates(params?: { platform?: string; tone?: string; isActive?: boolean; search?: string }) {
  const { data, loading, error, execute } = useApiRequest<CommentTemplate[]>();

  const fetch = useCallback(() => {
    return execute(templatesApi.list(params));
  }, [execute, params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { templates: data || [], loading, error, refetch: fetch };
}

export function useTemplateMutations() {
  const [loading, setLoading] = useState(false);

  const createTemplate = async (data: {
    name: string;
    content: string;
    platform?: string;
    tone: string;
    fomoType?: string;
  }) => {
    setLoading(true);
    try {
      const response = await templatesApi.create(data);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (id: string, data: Partial<CommentTemplate>) => {
    setLoading(true);
    try {
      const response = await templatesApi.update(id, data);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    setLoading(true);
    try {
      const response = await templatesApi.delete(id);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const generateComments = async (data: {
    platform: string;
    tone: string;
    fomoType?: string;
    postContent?: string;
    variations?: number;
  }) => {
    setLoading(true);
    try {
      const response = await templatesApi.generate(data);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  return { createTemplate, updateTemplate, deleteTemplate, generateComments, loading };
}

// ============ JOBS HOOKS ============

export function useJobs(params?: { accountId?: string; campaignId?: string; status?: string }) {
  const { data, loading, error, execute } = useApiRequest<CommentJob[]>();

  const fetch = useCallback(() => {
    return execute(jobsApi.list(params));
  }, [execute, params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { jobs: data || [], loading, error, refetch: fetch };
}

export function useJobMutations() {
  const [loading, setLoading] = useState(false);

  const createJob = async (data: {
    accountId: string;
    templateId?: string;
    campaignId?: string;
    targetPlatform: string;
    targetPostUrl: string;
    content: string;
    scheduledFor?: string;
  }) => {
    setLoading(true);
    try {
      const response = await jobsApi.create(data);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const cancelJob = async (id: string) => {
    setLoading(true);
    try {
      const response = await jobsApi.cancel(id);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const retryJob = async (id: string) => {
    setLoading(true);
    try {
      const response = await jobsApi.retry(id);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  return { createJob, cancelJob, retryJob, loading };
}

// ============ CAMPAIGNS HOOKS ============

export function useCampaigns(params?: { status?: string; search?: string }) {
  const { data, loading, error, execute } = useApiRequest<Campaign[]>();

  const fetch = useCallback(() => {
    return execute(campaignsApi.list(params));
  }, [execute, params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { campaigns: data || [], loading, error, refetch: fetch };
}

export function useCampaign(id: string) {
  const { data, loading, error, execute } = useApiRequest<Campaign>();

  useEffect(() => {
    if (id) {
      execute(campaignsApi.get(id));
    }
  }, [execute, id]);

  return { campaign: data, loading, error };
}

export function useCampaignStats() {
  const { data, loading, error, execute } = useApiRequest<{
    total: number;
    byStatus: Record<string, number>;
    budget: { total: number; spent: number };
    engagement: { impressions: number; engagements: number; conversions: number };
  }>();

  useEffect(() => {
    execute(campaignsApi.stats());
  }, [execute]);

  return { stats: data, loading, error };
}

export function useCampaignMutations() {
  const [loading, setLoading] = useState(false);

  const createCampaign = async (data: {
    name: string;
    description?: string;
    budgetDaily: number;
    budgetTotal: number;
    targetPlatforms: string[];
    targetHashtags?: string[];
    startDate?: string;
    endDate?: string;
  }) => {
    setLoading(true);
    try {
      const response = await campaignsApi.create(data);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const updateCampaign = async (id: string, data: Partial<Campaign>) => {
    setLoading(true);
    try {
      const response = await campaignsApi.update(id, data);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    setLoading(true);
    try {
      const response = await campaignsApi.delete(id);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const activateCampaign = async (id: string) => {
    setLoading(true);
    try {
      const response = await campaignsApi.activate(id);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const pauseCampaign = async (id: string) => {
    setLoading(true);
    try {
      const response = await campaignsApi.pause(id);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  return { createCampaign, updateCampaign, deleteCampaign, activateCampaign, pauseCampaign, loading };
}

// ============ ANALYTICS HOOKS ============

export function useAnalyticsOverview(dashboard = true) {
  const { data, loading, error, execute } = useApiRequest<AnalyticsOverview>();

  useEffect(() => {
    execute(analyticsApi.overview(dashboard));
  }, [execute, dashboard]);

  return { overview: data, loading, error };
}

export function useTimeSeries(params: {
  metric: "comments" | "engagement" | "health" | "fomo" | "conversions";
  granularity?: "day" | "week" | "month";
  startDate?: string;
  endDate?: string;
}) {
  const { data, loading, error, execute } = useApiRequest<TimeSeriesData & { metric: string }>();

  const fetch = useCallback(() => {
    return execute(analyticsApi.timeseries(params));
  }, [execute, params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { timeseries: data, loading, error, refetch: fetch };
}

export function useExport() {
  const [loading, setLoading] = useState(false);

  const exportData = async (params: {
    type: "comments" | "accounts" | "campaigns" | "analytics";
    format?: "json" | "csv";
    startDate?: string;
    endDate?: string;
  }) => {
    setLoading(true);
    try {
      const response = await analyticsApi.export(params);
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  return { exportData, loading };
}
