import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types/api";

type ExportFormat = "json" | "csv";
type ExportType = "comments" | "accounts" | "campaigns" | "analytics";

// GET /api/v1/analytics/export - Export data
export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);

    const format = (searchParams.get("format") || "json") as ExportFormat;
    const type = (searchParams.get("type") || "analytics") as ExportType;

    // Default to last 30 days
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date();

    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    let data: Record<string, unknown>[];

    switch (type) {
      case "comments":
        data = await exportComments(ctx.organizationId, startDate, endDate);
        break;
      case "accounts":
        data = await exportAccounts(ctx.organizationId);
        break;
      case "campaigns":
        data = await exportCampaigns(ctx.organizationId);
        break;
      case "analytics":
      default:
        data = await exportAnalytics(ctx.organizationId, startDate, endDate);
        break;
    }

    if (format === "csv") {
      const csv = convertToCSV(data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    const response: ApiResponse = {
      success: true,
      data: {
        type,
        range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        count: data.length,
        records: data,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "EXPORT_FAILED",
        message: error instanceof Error ? error.message : "Failed to export data",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
});

async function exportComments(
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  const jobs = await prisma.commentJob.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      account: {
        select: {
          username: true,
          platform: true,
        },
      },
      template: {
        select: {
          name: true,
          tone: true,
          fomoType: true,
        },
      },
      engagement: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return jobs.map((job: typeof jobs[number]) => ({
    id: job.id,
    status: job.status,
    platform: job.targetPlatform,
    account: job.account.username,
    targetPostUrl: job.targetPostUrl,
    content: job.content,
    templateName: job.template?.name,
    tone: job.template?.tone,
    fomoType: job.template?.fomoType,
    likes: job.engagement?.likes ?? 0,
    replies: job.engagement?.replies ?? 0,
    impressions: job.engagement?.impressions ?? 0,
    conversions: job.engagement?.conversions ?? 0,
    createdAt: job.createdAt.toISOString(),
    processedAt: job.processedAt?.toISOString(),
  }));
}

async function exportAccounts(organizationId: string) {
  const accounts = await prisma.socialAccount.findMany({
    where: { organizationId },
    include: {
      proxy: {
        select: {
          location: true,
          country: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return accounts.map((account) => ({
    id: account.id,
    platform: account.platform,
    username: account.username,
    displayName: account.displayName,
    status: account.status,
    warmupPhase: account.warmupPhase,
    warmupProgress: account.warmupProgress,
    healthScore: account.healthScore,
    dailyCommentLimit: account.dailyCommentLimit,
    commentsToday: account.commentsToday,
    proxyLocation: account.proxy?.location,
    proxyCountry: account.proxy?.country,
    createdAt: account.createdAt.toISOString(),
    lastActivityAt: account.lastActivityAt?.toISOString(),
  }));
}

async function exportCampaigns(organizationId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: { commentJobs: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    budgetDaily: campaign.budgetDaily.toNumber(),
    budgetTotal: campaign.budgetTotal.toNumber(),
    budgetSpent: campaign.budgetSpent.toNumber(),
    targetPlatforms: campaign.targetPlatforms.join(", "),
    impressions: campaign.impressions,
    engagements: campaign.engagements,
    conversions: campaign.conversions,
    commentJobsCount: campaign._count.commentJobs,
    startDate: campaign.startDate?.toISOString(),
    endDate: campaign.endDate?.toISOString(),
    createdAt: campaign.createdAt.toISOString(),
  }));
}

async function exportAnalytics(
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  const analytics = await prisma.dailyAnalytics.findMany({
    where: {
      organizationId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "desc" },
  });

  return analytics.map((a) => ({
    date: a.date.toISOString().split("T")[0],
    totalComments: a.totalComments,
    totalEngagement: a.totalEngagement,
    avgEngagementRate: a.avgEngagementRate,
    totalConversions: a.totalConversions,
    totalRevenue: a.totalRevenue.toNumber(),
    scarcityUses: a.scarcityUses,
    urgencyUses: a.urgencyUses,
    socialProofUses: a.socialProofUses,
    exclusivityUses: a.exclusivityUses,
  }));
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) {
    return "";
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) {
          return "";
        }
        const str = String(value);
        // Escape quotes and wrap in quotes if contains comma or newline
        if (str.includes(",") || str.includes("\n") || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
