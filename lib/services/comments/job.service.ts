import { prisma } from "@/lib/prisma";
import { CommentJobStatus, Platform, Prisma } from "@prisma/client";
import { accountService } from "@/lib/services/accounts";

export interface CreateJobInput {
  organizationId: string;
  accountId: string;
  templateId?: string;
  campaignId?: string;
  targetPlatform: Platform;
  targetPostUrl: string;
  targetPostId?: string;
  content: string;
  scheduledFor?: Date;
}

export interface JobFilters {
  organizationId: string;
  accountId?: string;
  campaignId?: string;
  status?: CommentJobStatus;
  targetPlatform?: Platform;
  scheduledAfter?: Date;
  scheduledBefore?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class JobService {
  async create(input: CreateJobInput) {
    // Verify account exists and belongs to organization
    const account = await accountService.getById(input.accountId, input.organizationId);

    // Check daily limit
    if (account.commentsToday >= account.dailyCommentLimit) {
      throw new Error("Daily comment limit reached for this account");
    }

    return prisma.commentJob.create({
      data: {
        organizationId: input.organizationId,
        accountId: input.accountId,
        templateId: input.templateId,
        campaignId: input.campaignId,
        targetPlatform: input.targetPlatform,
        targetPostUrl: input.targetPostUrl,
        targetPostId: input.targetPostId,
        content: input.content,
        status: input.scheduledFor ? CommentJobStatus.SCHEDULED : CommentJobStatus.PENDING,
        scheduledFor: input.scheduledFor,
        generatedAt: new Date(),
      },
      include: {
        account: {
          select: {
            id: true,
            username: true,
            platform: true,
            status: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            tone: true,
          },
        },
      },
    });
  }

  async createBulk(jobs: CreateJobInput[]) {
    const results = [];
    const errors = [];

    for (const job of jobs) {
      try {
        const created = await this.create(job);
        results.push(created);
      } catch (error) {
        errors.push({
          job,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { created: results, errors };
  }

  async getById(id: string, organizationId: string) {
    const job = await prisma.commentJob.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        account: true,
        template: true,
        campaign: true,
        engagement: true,
      },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    return job;
  }

  async list(filters: JobFilters, pagination: PaginationOptions = {}) {
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.CommentJobWhereInput = {
      organizationId: filters.organizationId,
    };

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.campaignId) {
      where.campaignId = filters.campaignId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.targetPlatform) {
      where.targetPlatform = filters.targetPlatform;
    }

    if (filters.scheduledAfter || filters.scheduledBefore) {
      where.scheduledFor = {};
      if (filters.scheduledAfter) {
        where.scheduledFor.gte = filters.scheduledAfter;
      }
      if (filters.scheduledBefore) {
        where.scheduledFor.lte = filters.scheduledBefore;
      }
    }

    const [jobs, total] = await Promise.all([
      prisma.commentJob.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              username: true,
              platform: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
            },
          },
          engagement: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.commentJob.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(
    id: string,
    status: CommentJobStatus,
    details?: {
      commentId?: string;
      commentUrl?: string;
      errorMessage?: string;
    }
  ) {
    const updateData: Prisma.CommentJobUpdateInput = {
      status,
      updatedAt: new Date(),
    };

    if (status === CommentJobStatus.PROCESSING) {
      updateData.processedAt = new Date();
    }

    if (details?.commentId) {
      updateData.commentId = details.commentId;
    }

    if (details?.commentUrl) {
      updateData.commentUrl = details.commentUrl;
    }

    if (details?.errorMessage) {
      updateData.errorMessage = details.errorMessage;
    }

    return prisma.commentJob.update({
      where: { id },
      data: updateData,
    });
  }

  async cancel(id: string, organizationId: string) {
    const job = await this.getById(id, organizationId);

    if (
      job.status !== CommentJobStatus.PENDING &&
      job.status !== CommentJobStatus.SCHEDULED
    ) {
      throw new Error("Can only cancel pending or scheduled jobs");
    }

    return this.updateStatus(id, CommentJobStatus.CANCELLED);
  }

  async retry(id: string, organizationId: string) {
    const job = await this.getById(id, organizationId);

    if (job.status !== CommentJobStatus.FAILED) {
      throw new Error("Can only retry failed jobs");
    }

    if (job.retryCount >= job.maxRetries) {
      throw new Error("Maximum retry attempts reached");
    }

    return prisma.commentJob.update({
      where: { id },
      data: {
        status: CommentJobStatus.PENDING,
        retryCount: { increment: 1 },
        errorMessage: null,
        updatedAt: new Date(),
      },
    });
  }

  async getJobsToProcess(limit: number = 10) {
    const now = new Date();

    return prisma.commentJob.findMany({
      where: {
        OR: [
          { status: CommentJobStatus.PENDING },
          {
            status: CommentJobStatus.SCHEDULED,
            scheduledFor: { lte: now },
          },
        ],
      },
      include: {
        account: {
          include: {
            proxy: true,
          },
        },
        template: true,
      },
      orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
      take: limit,
    });
  }

  async getStats(organizationId: string, dateRange?: { start: Date; end: Date }) {
    const where: Prisma.CommentJobWhereInput = { organizationId };

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    const [total, byStatus, byPlatform, recentEngagement] = await Promise.all([
      prisma.commentJob.count({ where }),
      prisma.commentJob.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
      prisma.commentJob.groupBy({
        by: ["targetPlatform"],
        where,
        _count: true,
      }),
      prisma.commentEngagement.aggregate({
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
          linkClicks: true,
          conversions: true,
        },
        _avg: {
          likes: true,
          replies: true,
        },
      }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      byPlatform: Object.fromEntries(byPlatform.map((p) => [p.targetPlatform, p._count])),
      engagement: {
        total: {
          likes: recentEngagement._sum.likes ?? 0,
          replies: recentEngagement._sum.replies ?? 0,
          impressions: recentEngagement._sum.impressions ?? 0,
          linkClicks: recentEngagement._sum.linkClicks ?? 0,
          conversions: recentEngagement._sum.conversions ?? 0,
        },
        average: {
          likes: recentEngagement._avg.likes ?? 0,
          replies: recentEngagement._avg.replies ?? 0,
        },
      },
    };
  }

  async recordEngagement(
    jobId: string,
    engagement: {
      likes?: number;
      replies?: number;
      impressions?: number;
      linkClicks?: number;
      conversions?: number;
      revenue?: number;
    }
  ) {
    return prisma.commentEngagement.upsert({
      where: { commentJobId: jobId },
      create: {
        commentJobId: jobId,
        likes: engagement.likes ?? 0,
        replies: engagement.replies ?? 0,
        impressions: engagement.impressions ?? 0,
        linkClicks: engagement.linkClicks ?? 0,
        conversions: engagement.conversions ?? 0,
        revenue: engagement.revenue ?? 0,
      },
      update: {
        likes: engagement.likes,
        replies: engagement.replies,
        impressions: engagement.impressions,
        linkClicks: engagement.linkClicks,
        conversions: engagement.conversions,
        revenue: engagement.revenue,
        lastUpdated: new Date(),
      },
    });
  }
}

export const jobService = new JobService();
