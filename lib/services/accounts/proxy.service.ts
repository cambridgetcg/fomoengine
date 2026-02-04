import { prisma } from "@/lib/prisma";
import { ProxyStatus, Prisma } from "@prisma/client";

export interface CreateProxyInput {
  organizationId: string;
  provider: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  location: string;
  country: string;
}

export interface UpdateProxyInput {
  provider?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  location?: string;
  country?: string;
  status?: ProxyStatus;
}

export interface ProxyFilters {
  organizationId: string;
  status?: ProxyStatus;
  country?: string;
  location?: string;
  provider?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class ProxyService {
  async create(input: CreateProxyInput) {
    return prisma.proxy.create({
      data: {
        organizationId: input.organizationId,
        provider: input.provider,
        host: input.host,
        port: input.port,
        username: input.username,
        password: input.password,
        location: input.location,
        country: input.country,
        status: ProxyStatus.ACTIVE,
      },
    });
  }

  async getById(id: string, organizationId: string) {
    const proxy = await prisma.proxy.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        accounts: {
          select: {
            id: true,
            username: true,
            platform: true,
            status: true,
          },
        },
      },
    });

    if (!proxy) {
      throw new Error("Proxy not found");
    }

    return proxy;
  }

  async list(filters: ProxyFilters, pagination: PaginationOptions = {}) {
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.ProxyWhereInput = {
      organizationId: filters.organizationId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.country) {
      where.country = filters.country;
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: "insensitive" };
    }

    if (filters.provider) {
      where.provider = filters.provider;
    }

    const [proxies, total] = await Promise.all([
      prisma.proxy.findMany({
        where,
        include: {
          _count: {
            select: { accounts: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.proxy.count({ where }),
    ]);

    return {
      proxies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, organizationId: string, input: UpdateProxyInput) {
    const proxy = await this.getById(id, organizationId);

    return prisma.proxy.update({
      where: { id: proxy.id },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const proxy = await this.getById(id, organizationId);

    // Check if proxy is assigned to any accounts
    const assignedAccounts = await prisma.socialAccount.count({
      where: { proxyId: id },
    });

    if (assignedAccounts > 0) {
      throw new Error(
        `Cannot delete proxy: ${assignedAccounts} account(s) are using this proxy. Unassign them first.`
      );
    }

    await prisma.proxy.delete({
      where: { id: proxy.id },
    });

    return { success: true };
  }

  async updateStatus(id: string, organizationId: string, status: ProxyStatus) {
    const proxy = await this.getById(id, organizationId);

    return prisma.proxy.update({
      where: { id: proxy.id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  async recordHealthCheck(id: string, responseTimeMs: number, success: boolean) {
    const updateData: Prisma.ProxyUpdateInput = {
      lastCheckAt: new Date(),
      responseTimeMs,
    };

    if (success) {
      updateData.failureCount = 0;
    } else {
      updateData.failureCount = { increment: 1 };
    }

    const proxy = await prisma.proxy.update({
      where: { id },
      data: updateData,
    });

    // Auto-mark as inactive after 5 consecutive failures
    if (proxy.failureCount >= 5 && proxy.status === ProxyStatus.ACTIVE) {
      await prisma.proxy.update({
        where: { id },
        data: { status: ProxyStatus.INACTIVE },
      });
    }

    return proxy;
  }

  async getAvailableProxy(organizationId: string, preferredCountry?: string) {
    const where: Prisma.ProxyWhereInput = {
      organizationId,
      status: ProxyStatus.ACTIVE,
    };

    if (preferredCountry) {
      where.country = preferredCountry;
    }

    // Get proxy with least accounts assigned
    const proxy = await prisma.proxy.findFirst({
      where,
      orderBy: [
        { accounts: { _count: "asc" } },
        { responseTimeMs: "asc" },
      ],
    });

    return proxy;
  }

  async assignToAccount(proxyId: string, accountId: string, organizationId: string) {
    // Verify proxy belongs to organization
    await this.getById(proxyId, organizationId);

    return prisma.socialAccount.update({
      where: { id: accountId },
      data: { proxyId },
      include: { proxy: true },
    });
  }

  async unassignFromAccount(accountId: string) {
    return prisma.socialAccount.update({
      where: { id: accountId },
      data: { proxyId: null },
    });
  }

  async getStats(organizationId: string) {
    const [total, byStatus, byCountry, avgResponseTime] = await Promise.all([
      prisma.proxy.count({ where: { organizationId } }),
      prisma.proxy.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: true,
      }),
      prisma.proxy.groupBy({
        by: ["country"],
        where: { organizationId },
        _count: true,
      }),
      prisma.proxy.aggregate({
        where: { organizationId, responseTimeMs: { not: null } },
        _avg: { responseTimeMs: true },
      }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      byCountry: Object.fromEntries(byCountry.map((c) => [c.country, c._count])),
      avgResponseTime: avgResponseTime._avg.responseTimeMs ?? 0,
    };
  }
}

export const proxyService = new ProxyService();
