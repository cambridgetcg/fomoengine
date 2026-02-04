import { prisma } from "@/lib/prisma";
import { Platform, AccountStatus, WarmupPhase, Prisma } from "@prisma/client";

export interface CreateAccountInput {
  organizationId: string;
  platform: Platform;
  username: string;
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  proxyId?: string;
}

export interface UpdateAccountInput {
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  status?: AccountStatus;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  proxyId?: string | null;
  dailyCommentLimit?: number;
}

export interface AccountFilters {
  organizationId: string;
  platform?: Platform;
  status?: AccountStatus;
  warmupPhase?: WarmupPhase;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class AccountService {
  async create(input: CreateAccountInput) {
    const existing = await prisma.socialAccount.findUnique({
      where: {
        organizationId_platform_username: {
          organizationId: input.organizationId,
          platform: input.platform,
          username: input.username,
        },
      },
    });

    if (existing) {
      throw new Error("Account with this username already exists for this platform");
    }

    return prisma.socialAccount.create({
      data: {
        organizationId: input.organizationId,
        platform: input.platform,
        username: input.username,
        displayName: input.displayName,
        profileUrl: input.profileUrl,
        avatarUrl: input.avatarUrl,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        tokenExpiresAt: input.tokenExpiresAt,
        proxyId: input.proxyId,
        status: AccountStatus.WARMING,
        warmupPhase: WarmupPhase.PENDING,
      },
      include: {
        proxy: true,
      },
    });
  }

  async getById(id: string, organizationId: string) {
    const account = await prisma.socialAccount.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        proxy: true,
        analytics: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    return account;
  }

  async list(filters: AccountFilters, pagination: PaginationOptions = {}) {
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.SocialAccountWhereInput = {
      organizationId: filters.organizationId,
    };

    if (filters.platform) {
      where.platform = filters.platform;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.warmupPhase) {
      where.warmupPhase = filters.warmupPhase;
    }

    if (filters.search) {
      where.OR = [
        { username: { contains: filters.search, mode: "insensitive" } },
        { displayName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [accounts, total] = await Promise.all([
      prisma.socialAccount.findMany({
        where,
        include: {
          proxy: {
            select: {
              id: true,
              location: true,
              country: true,
              status: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.socialAccount.count({ where }),
    ]);

    return {
      accounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, organizationId: string, input: UpdateAccountInput) {
    const account = await this.getById(id, organizationId);

    return prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        ...input,
        updatedAt: new Date(),
      },
      include: {
        proxy: true,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const account = await this.getById(id, organizationId);

    await prisma.socialAccount.delete({
      where: { id: account.id },
    });

    return { success: true };
  }

  async updateStatus(id: string, organizationId: string, status: AccountStatus) {
    const account = await this.getById(id, organizationId);

    return prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  async incrementCommentsToday(id: string) {
    return prisma.socialAccount.update({
      where: { id },
      data: {
        commentsToday: { increment: 1 },
        lastCommentAt: new Date(),
        lastActivityAt: new Date(),
      },
    });
  }

  async resetDailyComments(organizationId?: string) {
    const where: Prisma.SocialAccountWhereInput = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }

    return prisma.socialAccount.updateMany({
      where,
      data: {
        commentsToday: 0,
      },
    });
  }

  async getAccountsNeedingWarmup(organizationId: string) {
    return prisma.socialAccount.findMany({
      where: {
        organizationId,
        warmupPhase: { in: [WarmupPhase.PENDING, WarmupPhase.ACTIVE] },
        status: { not: AccountStatus.SUSPENDED },
      },
      include: {
        proxy: true,
      },
    });
  }

  async getHealthyAccountsForPosting(organizationId: string, platform?: Platform) {
    const where: Prisma.SocialAccountWhereInput = {
      organizationId,
      status: AccountStatus.HEALTHY,
      warmupPhase: WarmupPhase.COMPLETE,
    };

    if (platform) {
      where.platform = platform;
    }

    return prisma.socialAccount.findMany({
      where,
      include: {
        proxy: true,
      },
      orderBy: [
        { commentsToday: "asc" },
        { lastCommentAt: "asc" },
      ],
    });
  }

  async getStats(organizationId: string) {
    const [total, byStatus, byPlatform, byWarmupPhase] = await Promise.all([
      prisma.socialAccount.count({ where: { organizationId } }),
      prisma.socialAccount.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: true,
      }),
      prisma.socialAccount.groupBy({
        by: ["platform"],
        where: { organizationId },
        _count: true,
      }),
      prisma.socialAccount.groupBy({
        by: ["warmupPhase"],
        where: { organizationId },
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      byPlatform: Object.fromEntries(byPlatform.map((p) => [p.platform, p._count])),
      byWarmupPhase: Object.fromEntries(byWarmupPhase.map((w) => [w.warmupPhase, w._count])),
    };
  }
}

export const accountService = new AccountService();
