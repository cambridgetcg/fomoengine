import { prisma } from "@/lib/prisma";
import { Platform, CommentTone, FomoTriggerType, Prisma } from "@prisma/client";

export interface CreateTemplateInput {
  organizationId: string;
  name: string;
  content: string;
  platform?: Platform;
  tone: CommentTone;
  fomoType?: FomoTriggerType;
  isAiGenerated?: boolean;
  aiPrompt?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  content?: string;
  platform?: Platform | null;
  tone?: CommentTone;
  fomoType?: FomoTriggerType | null;
  isActive?: boolean;
  aiPrompt?: string;
}

export interface TemplateFilters {
  organizationId: string;
  platform?: Platform;
  tone?: CommentTone;
  fomoType?: FomoTriggerType;
  isActive?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class TemplateService {
  async create(input: CreateTemplateInput) {
    return prisma.commentTemplate.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        content: input.content,
        platform: input.platform,
        tone: input.tone,
        fomoType: input.fomoType,
        isAiGenerated: input.isAiGenerated ?? false,
        aiPrompt: input.aiPrompt,
      },
    });
  }

  async getById(id: string, organizationId: string) {
    const template = await prisma.commentTemplate.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        analytics: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    return template;
  }

  async list(filters: TemplateFilters, pagination: PaginationOptions = {}) {
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.CommentTemplateWhereInput = {
      organizationId: filters.organizationId,
    };

    if (filters.platform) {
      where.platform = filters.platform;
    }

    if (filters.tone) {
      where.tone = filters.tone;
    }

    if (filters.fomoType) {
      where.fomoType = filters.fomoType;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { content: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.commentTemplate.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.commentTemplate.count({ where }),
    ]);

    return {
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, organizationId: string, input: UpdateTemplateInput) {
    const template = await this.getById(id, organizationId);

    return prisma.commentTemplate.update({
      where: { id: template.id },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const template = await this.getById(id, organizationId);

    await prisma.commentTemplate.delete({
      where: { id: template.id },
    });

    return { success: true };
  }

  async toggleActive(id: string, organizationId: string) {
    const template = await this.getById(id, organizationId);

    return prisma.commentTemplate.update({
      where: { id: template.id },
      data: {
        isActive: !template.isActive,
        updatedAt: new Date(),
      },
    });
  }

  async recordUsage(id: string, engagement?: { likes?: number; replies?: number }) {
    const template = await prisma.commentTemplate.update({
      where: { id },
      data: {
        timesUsed: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    // Update daily analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.templateAnalytics.upsert({
      where: {
        templateId_date: {
          templateId: id,
          date: today,
        },
      },
      create: {
        templateId: id,
        date: today,
        timesUsed: 1,
        totalLikes: engagement?.likes ?? 0,
        totalReplies: engagement?.replies ?? 0,
      },
      update: {
        timesUsed: { increment: 1 },
        totalLikes: { increment: engagement?.likes ?? 0 },
        totalReplies: { increment: engagement?.replies ?? 0 },
      },
    });

    return template;
  }

  async getTopPerforming(organizationId: string, limit: number = 10) {
    return prisma.commentTemplate.findMany({
      where: {
        organizationId,
        isActive: true,
        timesUsed: { gt: 0 },
      },
      orderBy: [{ avgEngagement: "desc" }, { timesUsed: "desc" }],
      take: limit,
    });
  }

  async getRandomTemplate(
    organizationId: string,
    platform?: Platform,
    tone?: CommentTone,
    fomoType?: FomoTriggerType
  ) {
    const where: Prisma.CommentTemplateWhereInput = {
      organizationId,
      isActive: true,
    };

    if (platform) {
      where.OR = [{ platform }, { platform: null }];
    }

    if (tone) {
      where.tone = tone;
    }

    if (fomoType) {
      where.fomoType = fomoType;
    }

    const templates = await prisma.commentTemplate.findMany({
      where,
      select: { id: true },
    });

    if (templates.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * templates.length);
    return this.getById(templates[randomIndex].id, organizationId);
  }

  async getStats(organizationId: string) {
    const [total, byTone, byFomoType, byPlatform, avgEngagement] = await Promise.all([
      prisma.commentTemplate.count({ where: { organizationId } }),
      prisma.commentTemplate.groupBy({
        by: ["tone"],
        where: { organizationId },
        _count: true,
      }),
      prisma.commentTemplate.groupBy({
        by: ["fomoType"],
        where: { organizationId, fomoType: { not: null } },
        _count: true,
      }),
      prisma.commentTemplate.groupBy({
        by: ["platform"],
        where: { organizationId },
        _count: true,
      }),
      prisma.commentTemplate.aggregate({
        where: { organizationId, timesUsed: { gt: 0 } },
        _avg: { avgEngagement: true },
      }),
    ]);

    return {
      total,
      byTone: Object.fromEntries(byTone.map((t) => [t.tone, t._count])),
      byFomoType: Object.fromEntries(
        byFomoType.map((f) => [f.fomoType ?? "NONE", f._count])
      ),
      byPlatform: Object.fromEntries(
        byPlatform.map((p) => [p.platform ?? "ALL", p._count])
      ),
      avgEngagement: avgEngagement._avg.avgEngagement ?? 0,
    };
  }
}

export const templateService = new TemplateService();
