import { prisma } from "@/lib/prisma";
import { AccountStatus, Platform } from "@prisma/client";

export interface HealthCheckResult {
  accountId: string;
  isHealthy: boolean;
  score: number;
  issues: string[];
  checkedAt: Date;
}

export interface HealthMetrics {
  loginSuccess: boolean;
  rateLimited: boolean;
  shadowBanned: boolean;
  actionBlocked: boolean;
  profileAccessible: boolean;
  responseTime: number;
}

export class HealthService {
  private readonly SCORE_WEIGHTS = {
    loginSuccess: 30,
    rateLimited: -20,
    shadowBanned: -40,
    actionBlocked: -30,
    profileAccessible: 20,
    slowResponse: -10,
  };

  async checkAccountHealth(accountId: string): Promise<HealthCheckResult> {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
      include: { proxy: true },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Simulate health check - in production this would call platform APIs
    const metrics = await this.performHealthCheck(account.platform, {
      accessToken: account.accessToken,
      proxyHost: account.proxy?.host,
      proxyPort: account.proxy?.port,
    });

    const { score, issues } = this.calculateHealthScore(metrics);
    const isHealthy = score >= 70;

    // Update account health in database
    await this.updateAccountHealth(accountId, score, isHealthy, issues);

    return {
      accountId,
      isHealthy,
      score,
      issues,
      checkedAt: new Date(),
    };
  }

  private async performHealthCheck(
    platform: Platform,
    _credentials: {
      accessToken: string | null;
      proxyHost?: string;
      proxyPort?: number;
    }
  ): Promise<HealthMetrics> {
    // In production, this would make actual API calls to check account status
    // For now, return simulated metrics

    // Simulate platform-specific health check logic
    const baseMetrics: HealthMetrics = {
      loginSuccess: true,
      rateLimited: false,
      shadowBanned: false,
      actionBlocked: false,
      profileAccessible: true,
      responseTime: Math.random() * 2000 + 500,
    };

    // Platform-specific adjustments would go here
    switch (platform) {
      case Platform.INSTAGRAM:
        // Instagram-specific checks
        break;
      case Platform.TIKTOK:
        // TikTok-specific checks
        break;
      case Platform.TWITTER:
        // Twitter-specific checks
        break;
      default:
        break;
    }

    return baseMetrics;
  }

  private calculateHealthScore(metrics: HealthMetrics): { score: number; issues: string[] } {
    let score = 50; // Base score
    const issues: string[] = [];

    if (metrics.loginSuccess) {
      score += this.SCORE_WEIGHTS.loginSuccess;
    } else {
      issues.push("Login failed - credentials may be invalid");
    }

    if (metrics.rateLimited) {
      score += this.SCORE_WEIGHTS.rateLimited;
      issues.push("Account is rate limited");
    }

    if (metrics.shadowBanned) {
      score += this.SCORE_WEIGHTS.shadowBanned;
      issues.push("Account appears to be shadow banned");
    }

    if (metrics.actionBlocked) {
      score += this.SCORE_WEIGHTS.actionBlocked;
      issues.push("Actions are being blocked");
    }

    if (metrics.profileAccessible) {
      score += this.SCORE_WEIGHTS.profileAccessible;
    } else {
      issues.push("Profile is not accessible");
    }

    if (metrics.responseTime > 3000) {
      score += this.SCORE_WEIGHTS.slowResponse;
      issues.push("Slow response times detected");
    }

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return { score, issues };
  }

  private async updateAccountHealth(
    accountId: string,
    score: number,
    isHealthy: boolean,
    issues: string[]
  ) {
    const status = this.determineStatus(score, isHealthy);

    // Get current health history
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
      select: { healthHistory: true },
    });

    const healthHistory = (account?.healthHistory as { date: string; score: number }[]) || [];

    // Add new entry and keep last 30 days
    healthHistory.push({
      date: new Date().toISOString(),
      score,
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filteredHistory = healthHistory.filter(
      (h) => new Date(h.date) > thirtyDaysAgo
    );

    await prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        healthScore: score,
        status,
        lastHealthCheck: new Date(),
        healthHistory: filteredHistory,
        updatedAt: new Date(),
      },
    });

    // Record daily analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.accountAnalytics.upsert({
      where: {
        accountId_date: {
          accountId,
          date: today,
        },
      },
      create: {
        accountId,
        date: today,
        healthScore: score,
      },
      update: {
        healthScore: score,
      },
    });

    return { status, issues };
  }

  private determineStatus(score: number, isHealthy: boolean): AccountStatus {
    if (score >= 80) return AccountStatus.HEALTHY;
    if (score >= 60) return AccountStatus.WARMING;
    if (score >= 40) return AccountStatus.FLAGGED;
    if (!isHealthy || score < 20) return AccountStatus.SUSPENDED;
    return AccountStatus.INACTIVE;
  }

  async checkAllAccountsHealth(organizationId: string) {
    const accounts = await prisma.socialAccount.findMany({
      where: {
        organizationId,
        status: { not: AccountStatus.SUSPENDED },
      },
      select: { id: true },
    });

    const results: HealthCheckResult[] = [];

    // Process in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((account) => this.checkAccountHealth(account.id))
      );
      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < accounts.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return {
      checked: results.length,
      healthy: results.filter((r) => r.isHealthy).length,
      unhealthy: results.filter((r) => !r.isHealthy).length,
      results,
    };
  }

  async getHealthSummary(organizationId: string) {
    const accounts = await prisma.socialAccount.findMany({
      where: { organizationId },
      select: {
        id: true,
        username: true,
        platform: true,
        status: true,
        healthScore: true,
        lastHealthCheck: true,
      },
    });

    const avgHealth =
      accounts.reduce((sum, a) => sum + a.healthScore, 0) / accounts.length || 0;

    const needsAttention = accounts.filter(
      (a) => a.healthScore < 60 || a.status === AccountStatus.FLAGGED
    );

    const staleChecks = accounts.filter((a) => {
      if (!a.lastHealthCheck) return true;
      const hoursSinceCheck =
        (Date.now() - a.lastHealthCheck.getTime()) / (1000 * 60 * 60);
      return hoursSinceCheck > 24;
    });

    return {
      totalAccounts: accounts.length,
      averageHealth: Math.round(avgHealth),
      needsAttention: needsAttention.length,
      staleChecks: staleChecks.length,
      accountsNeedingAttention: needsAttention,
      accountsWithStaleChecks: staleChecks,
    };
  }
}

export const healthService = new HealthService();
