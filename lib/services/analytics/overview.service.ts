import { prisma } from "@/lib/prisma";
import { CommentJobStatus, CampaignStatus, AccountStatus } from "@prisma/client";

export interface OverviewStats {
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
}

export class OverviewService {
  async getOverview(organizationId: string): Promise<OverviewStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      accountStats,
      commentStats,
      campaignStats,
      engagementStats,
      fomoStats,
    ] = await Promise.all([
      this.getAccountStats(organizationId),
      this.getCommentStats(organizationId, today),
      this.getCampaignStats(organizationId),
      this.getEngagementStats(organizationId),
      this.getFomoStats(organizationId),
    ]);

    return {
      accounts: accountStats,
      comments: commentStats,
      campaigns: campaignStats,
      engagement: engagementStats,
      fomo: fomoStats,
    };
  }

  private async getAccountStats(organizationId: string) {
    const [total, byStatus, avgHealth] = await Promise.all([
      prisma.socialAccount.count({ where: { organizationId } }),
      prisma.socialAccount.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: true,
      }),
      prisma.socialAccount.aggregate({
        where: { organizationId },
        _avg: { healthScore: true },
      }),
    ]);

    const statusMap = Object.fromEntries(
      byStatus.map((s) => [s.status, s._count])
    );

    return {
      total,
      healthy: statusMap[AccountStatus.HEALTHY] ?? 0,
      warming: statusMap[AccountStatus.WARMING] ?? 0,
      flagged: statusMap[AccountStatus.FLAGGED] ?? 0,
      avgHealth: Math.round(avgHealth._avg.healthScore ?? 0),
    };
  }

  private async getCommentStats(organizationId: string, today: Date) {
    const [total, byStatus, todayCount] = await Promise.all([
      prisma.commentJob.count({ where: { organizationId } }),
      prisma.commentJob.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: true,
      }),
      prisma.commentJob.count({
        where: {
          organizationId,
          createdAt: { gte: today },
        },
      }),
    ]);

    const statusMap = Object.fromEntries(
      byStatus.map((s) => [s.status, s._count])
    );

    return {
      total,
      completed: statusMap[CommentJobStatus.COMPLETED] ?? 0,
      failed: statusMap[CommentJobStatus.FAILED] ?? 0,
      pending:
        (statusMap[CommentJobStatus.PENDING] ?? 0) +
        (statusMap[CommentJobStatus.SCHEDULED] ?? 0),
      todayCount,
    };
  }

  private async getCampaignStats(organizationId: string) {
    const [total, active, budgets] = await Promise.all([
      prisma.campaign.count({ where: { organizationId } }),
      prisma.campaign.count({
        where: { organizationId, status: CampaignStatus.ACTIVE },
      }),
      prisma.campaign.aggregate({
        where: { organizationId },
        _sum: {
          budgetTotal: true,
          budgetSpent: true,
        },
      }),
    ]);

    const totalBudget = budgets._sum.budgetTotal?.toNumber() ?? 0;
    const totalSpent = budgets._sum.budgetSpent?.toNumber() ?? 0;

    return {
      total,
      active,
      totalSpend: totalSpent,
      budgetRemaining: totalBudget - totalSpent,
    };
  }

  private async getEngagementStats(organizationId: string) {
    const engagement = await prisma.commentEngagement.aggregate({
      where: {
        commentJob: {
          organizationId,
          status: CommentJobStatus.COMPLETED,
        },
      },
      _sum: {
        likes: true,
        replies: true,
        impressions: true,
        conversions: true,
      },
    });

    const totalComments = await prisma.commentJob.count({
      where: {
        organizationId,
        status: CommentJobStatus.COMPLETED,
      },
    });

    const totalLikes = engagement._sum.likes ?? 0;
    const totalReplies = engagement._sum.replies ?? 0;
    const totalImpressions = engagement._sum.impressions ?? 0;

    const avgEngagementRate =
      totalImpressions > 0
        ? ((totalLikes + totalReplies) / totalImpressions) * 100
        : 0;

    return {
      totalLikes,
      totalReplies,
      totalImpressions,
      avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      conversions: engagement._sum.conversions ?? 0,
    };
  }

  private async getFomoStats(organizationId: string) {
    const [fomoTotals, topTemplate] = await Promise.all([
      prisma.dailyAnalytics.aggregate({
        where: { organizationId },
        _sum: {
          scarcityUses: true,
          urgencyUses: true,
          socialProofUses: true,
          exclusivityUses: true,
        },
      }),
      prisma.commentTemplate.findFirst({
        where: {
          organizationId,
          isActive: true,
          timesUsed: { gt: 0 },
        },
        orderBy: { avgEngagement: "desc" },
        select: { name: true, fomoType: true },
      }),
    ]);

    const uses = {
      scarcity: fomoTotals._sum.scarcityUses ?? 0,
      urgency: fomoTotals._sum.urgencyUses ?? 0,
      socialProof: fomoTotals._sum.socialProofUses ?? 0,
      exclusivity: fomoTotals._sum.exclusivityUses ?? 0,
    };

    // Determine top performer
    const sorted = Object.entries(uses).sort(([, a], [, b]) => b - a);
    const topPerformer = topTemplate?.fomoType || sorted[0]?.[0] || "none";

    return {
      scarcityUses: uses.scarcity,
      urgencyUses: uses.urgency,
      socialProofUses: uses.socialProof,
      exclusivityUses: uses.exclusivity,
      topPerformer,
    };
  }

  async getDashboardMetrics(organizationId: string) {
    const overview = await this.getOverview(organizationId);

    // Calculate key metrics for dashboard display
    return {
      ...overview,
      metrics: {
        successRate:
          overview.comments.total > 0
            ? Math.round(
                (overview.comments.completed / overview.comments.total) * 100
              )
            : 0,
        activeAccountRate:
          overview.accounts.total > 0
            ? Math.round(
                (overview.accounts.healthy / overview.accounts.total) * 100
              )
            : 0,
        budgetUtilization:
          overview.campaigns.totalSpend + overview.campaigns.budgetRemaining > 0
            ? Math.round(
                (overview.campaigns.totalSpend /
                  (overview.campaigns.totalSpend +
                    overview.campaigns.budgetRemaining)) *
                  100
              )
            : 0,
      },
    };
  }
}

export const overviewService = new OverviewService();
