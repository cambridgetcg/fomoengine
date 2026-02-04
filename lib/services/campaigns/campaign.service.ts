import { prisma } from "@/lib/prisma";
import { CampaignStatus, Platform, Prisma } from "@prisma/client";

export interface CreateCampaignInput {
  organizationId: string;
  name: string;
  description?: string;
  budgetDaily: number;
  budgetTotal: number;
  targetPlatforms: Platform[];
  targetHashtags?: string[];
  targetAccounts?: string[];
  targetKeywords?: string[];
  demographics?: Record<string, unknown>;
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
  scheduleConfig?: Record<string, unknown>;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  budgetDaily?: number;
  budgetTotal?: number;
  targetPlatforms?: Platform[];
  targetHashtags?: string[];
  targetAccounts?: string[];
  targetKeywords?: string[];
  demographics?: Record<string, unknown>;
  startDate?: Date | null;
  endDate?: Date | null;
  timezone?: string;
  scheduleConfig?: Record<string, unknown>;
}

export interface CampaignFilters {
  organizationId: string;
  status?: CampaignStatus;
  targetPlatform?: Platform;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class CampaignService {
  async create(input: CreateCampaignInput) {
    return prisma.campaign.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        description: input.description,
        budgetDaily: input.budgetDaily,
        budgetTotal: input.budgetTotal,
        targetPlatforms: input.targetPlatforms,
        targetHashtags: input.targetHashtags ?? [],
        targetAccounts: input.targetAccounts ?? [],
        targetKeywords: input.targetKeywords ?? [],
        demographics: input.demographics as Prisma.InputJsonValue,
        startDate: input.startDate,
        endDate: input.endDate,
        timezone: input.timezone ?? "UTC",
        scheduleConfig: input.scheduleConfig as Prisma.InputJsonValue,
        status: CampaignStatus.DRAFT,
      },
    });
  }

  async getById(id: string, organizationId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        analytics: {
          orderBy: { date: "desc" },
          take: 30,
        },
        _count: {
          select: { commentJobs: true },
        },
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    return campaign;
  }

  async list(filters: CampaignFilters, pagination: PaginationOptions = {}) {
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.CampaignWhereInput = {
      organizationId: filters.organizationId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.targetPlatform) {
      where.targetPlatforms = { has: filters.targetPlatform };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          _count: {
            select: { commentJobs: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    return {
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, organizationId: string, input: UpdateCampaignInput) {
    const campaign = await this.getById(id, organizationId);

    // Can't update an archived campaign
    if (campaign.status === CampaignStatus.ARCHIVED) {
      throw new Error("Cannot update archived campaign");
    }

    return prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        ...input,
        demographics: input.demographics as Prisma.InputJsonValue,
        scheduleConfig: input.scheduleConfig as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const campaign = await this.getById(id, organizationId);

    // Delete related jobs first
    await prisma.commentJob.deleteMany({
      where: { campaignId: id },
    });

    await prisma.campaign.delete({
      where: { id: campaign.id },
    });

    return { success: true };
  }

  async updateStatus(id: string, organizationId: string, status: CampaignStatus) {
    const campaign = await this.getById(id, organizationId);

    // Validate status transitions
    const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
      [CampaignStatus.DRAFT]: [CampaignStatus.ACTIVE, CampaignStatus.ARCHIVED],
      [CampaignStatus.ACTIVE]: [CampaignStatus.PAUSED, CampaignStatus.COMPLETED],
      [CampaignStatus.PAUSED]: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED],
      [CampaignStatus.COMPLETED]: [CampaignStatus.ARCHIVED],
      [CampaignStatus.ARCHIVED]: [],
    };

    if (!validTransitions[campaign.status].includes(status)) {
      throw new Error(
        `Invalid status transition from ${campaign.status} to ${status}`
      );
    }

    return prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  async activate(id: string, organizationId: string) {
    const campaign = await this.getById(id, organizationId);

    // Validate campaign is ready to be activated
    if (!campaign.targetPlatforms.length) {
      throw new Error("Campaign must have at least one target platform");
    }

    if (campaign.budgetTotal.toNumber() <= 0) {
      throw new Error("Campaign must have a budget greater than 0");
    }

    return this.updateStatus(id, organizationId, CampaignStatus.ACTIVE);
  }

  async pause(id: string, organizationId: string) {
    return this.updateStatus(id, organizationId, CampaignStatus.PAUSED);
  }

  async complete(id: string, organizationId: string) {
    return this.updateStatus(id, organizationId, CampaignStatus.COMPLETED);
  }

  async archive(id: string, organizationId: string) {
    return this.updateStatus(id, organizationId, CampaignStatus.ARCHIVED);
  }

  async recordSpend(id: string, amount: number) {
    return prisma.campaign.update({
      where: { id },
      data: {
        budgetSpent: { increment: amount },
        updatedAt: new Date(),
      },
    });
  }

  async recordEngagement(
    id: string,
    metrics: {
      impressions?: number;
      engagements?: number;
      conversions?: number;
    }
  ) {
    return prisma.campaign.update({
      where: { id },
      data: {
        impressions: metrics.impressions
          ? { increment: metrics.impressions }
          : undefined,
        engagements: metrics.engagements
          ? { increment: metrics.engagements }
          : undefined,
        conversions: metrics.conversions
          ? { increment: metrics.conversions }
          : undefined,
        updatedAt: new Date(),
      },
    });
  }

  async getActiveCampaigns(organizationId: string) {
    return prisma.campaign.findMany({
      where: {
        organizationId,
        status: CampaignStatus.ACTIVE,
      },
      include: {
        _count: {
          select: { commentJobs: true },
        },
      },
    });
  }

  async getCampaignsNeedingComments(organizationId: string) {
    const now = new Date();

    return prisma.campaign.findMany({
      where: {
        organizationId,
        status: CampaignStatus.ACTIVE,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      include: {
        _count: {
          select: { commentJobs: true },
        },
      },
    });
  }

  async getStats(organizationId: string) {
    const [total, byStatus, totalSpend, totalEngagement] = await Promise.all([
      prisma.campaign.count({ where: { organizationId } }),
      prisma.campaign.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: true,
      }),
      prisma.campaign.aggregate({
        where: { organizationId },
        _sum: {
          budgetSpent: true,
          budgetTotal: true,
        },
      }),
      prisma.campaign.aggregate({
        where: { organizationId },
        _sum: {
          impressions: true,
          engagements: true,
          conversions: true,
        },
      }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      budget: {
        total: totalSpend._sum.budgetTotal?.toNumber() ?? 0,
        spent: totalSpend._sum.budgetSpent?.toNumber() ?? 0,
      },
      engagement: {
        impressions: totalEngagement._sum.impressions ?? 0,
        engagements: totalEngagement._sum.engagements ?? 0,
        conversions: totalEngagement._sum.conversions ?? 0,
      },
    };
  }
}

export const campaignService = new CampaignService();
