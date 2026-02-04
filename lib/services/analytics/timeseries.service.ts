import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export type TimeGranularity = "day" | "week" | "month";

export class TimeSeriesService {
  async getCommentsTimeSeries(
    organizationId: string,
    range: DateRange,
    granularity: TimeGranularity = "day"
  ): Promise<TimeSeriesData> {
    const data = await prisma.dailyAnalytics.findMany({
      where: {
        organizationId,
        date: {
          gte: range.start,
          lte: range.end,
        },
      },
      orderBy: { date: "asc" },
    });

    const aggregated = this.aggregateByGranularity(data, granularity, "totalComments");

    return {
      labels: aggregated.map((d) => d.date),
      datasets: [
        {
          label: "Comments Posted",
          data: aggregated.map((d) => d.value),
        },
      ],
    };
  }

  async getEngagementTimeSeries(
    organizationId: string,
    range: DateRange,
    granularity: TimeGranularity = "day"
  ): Promise<TimeSeriesData> {
    const data = await prisma.dailyAnalytics.findMany({
      where: {
        organizationId,
        date: {
          gte: range.start,
          lte: range.end,
        },
      },
      orderBy: { date: "asc" },
    });

    const engagementData = this.aggregateByGranularity(
      data,
      granularity,
      "totalEngagement"
    );
    const rateData = this.aggregateByGranularity(
      data,
      granularity,
      "avgEngagementRate"
    );

    return {
      labels: engagementData.map((d) => d.date),
      datasets: [
        {
          label: "Total Engagement",
          data: engagementData.map((d) => d.value),
        },
        {
          label: "Avg Engagement Rate (%)",
          data: rateData.map((d) => Math.round(d.value * 100) / 100),
        },
      ],
    };
  }

  async getAccountHealthTimeSeries(
    organizationId: string,
    range: DateRange
  ): Promise<TimeSeriesData> {
    const accounts = await prisma.socialAccount.findMany({
      where: { organizationId },
      select: { id: true },
    });

    const accountIds = accounts.map((a) => a.id);

    const data = await prisma.accountAnalytics.findMany({
      where: {
        accountId: { in: accountIds },
        date: {
          gte: range.start,
          lte: range.end,
        },
      },
      orderBy: { date: "asc" },
    });

    // Group by date and calculate average health
    const byDate = new Map<string, number[]>();
    for (const d of data) {
      const dateStr = d.date.toISOString().split("T")[0];
      if (!byDate.has(dateStr)) {
        byDate.set(dateStr, []);
      }
      byDate.get(dateStr)!.push(d.healthScore);
    }

    const labels: string[] = [];
    const avgHealthData: number[] = [];

    byDate.forEach((scores, date) => {
      labels.push(date);
      avgHealthData.push(
        Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      );
    });

    return {
      labels,
      datasets: [
        {
          label: "Average Health Score",
          data: avgHealthData,
        },
      ],
    };
  }

  async getCampaignPerformanceTimeSeries(
    campaignId: string,
    range: DateRange
  ): Promise<TimeSeriesData> {
    const data = await prisma.campaignAnalytics.findMany({
      where: {
        campaignId,
        date: {
          gte: range.start,
          lte: range.end,
        },
      },
      orderBy: { date: "asc" },
    });

    return {
      labels: data.map((d) => d.date.toISOString().split("T")[0]),
      datasets: [
        {
          label: "Comments Posted",
          data: data.map((d) => d.commentsPosted),
        },
        {
          label: "Impressions",
          data: data.map((d) => d.impressions),
        },
        {
          label: "Engagements",
          data: data.map((d) => d.engagements),
        },
        {
          label: "Conversions",
          data: data.map((d) => d.conversions),
        },
      ],
    };
  }

  async getFomoTriggerTimeSeries(
    organizationId: string,
    range: DateRange
  ): Promise<TimeSeriesData> {
    const data = await prisma.dailyAnalytics.findMany({
      where: {
        organizationId,
        date: {
          gte: range.start,
          lte: range.end,
        },
      },
      orderBy: { date: "asc" },
    });

    return {
      labels: data.map((d) => d.date.toISOString().split("T")[0]),
      datasets: [
        {
          label: "Scarcity",
          data: data.map((d) => d.scarcityUses),
        },
        {
          label: "Urgency",
          data: data.map((d) => d.urgencyUses),
        },
        {
          label: "Social Proof",
          data: data.map((d) => d.socialProofUses),
        },
        {
          label: "Exclusivity",
          data: data.map((d) => d.exclusivityUses),
        },
      ],
    };
  }

  async getConversionTimeSeries(
    organizationId: string,
    range: DateRange,
    granularity: TimeGranularity = "day"
  ): Promise<TimeSeriesData> {
    const data = await prisma.dailyAnalytics.findMany({
      where: {
        organizationId,
        date: {
          gte: range.start,
          lte: range.end,
        },
      },
      orderBy: { date: "asc" },
    });

    const conversionData = this.aggregateByGranularity(
      data,
      granularity,
      "totalConversions"
    );

    const revenueData = data.map((d) => ({
      date: d.date,
      value: d.totalRevenue.toNumber(),
    }));

    const aggregatedRevenue = this.aggregatePointsByGranularity(
      revenueData,
      granularity
    );

    return {
      labels: conversionData.map((d) => d.date),
      datasets: [
        {
          label: "Conversions",
          data: conversionData.map((d) => d.value),
        },
        {
          label: "Revenue ($)",
          data: aggregatedRevenue.map((d) => Math.round(d.value * 100) / 100),
        },
      ],
    };
  }

  private aggregateByGranularity(
    data: Array<{ date: Date } & Record<string, unknown>>,
    granularity: TimeGranularity,
    field: string
  ): TimeSeriesPoint[] {
    const points = data.map((d) => ({
      date: d.date,
      value: (d[field] as number) ?? 0,
    }));

    return this.aggregatePointsByGranularity(points, granularity);
  }

  private aggregatePointsByGranularity(
    points: Array<{ date: Date; value: number }>,
    granularity: TimeGranularity
  ): TimeSeriesPoint[] {
    if (granularity === "day") {
      return points.map((p) => ({
        date: p.date.toISOString().split("T")[0],
        value: p.value,
      }));
    }

    const groups = new Map<string, number[]>();

    for (const point of points) {
      const key = this.getGroupKey(point.date, granularity);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(point.value);
    }

    return Array.from(groups.entries()).map(([key, values]) => ({
      date: key,
      value: values.reduce((a, b) => a + b, 0),
    }));
  }

  private getGroupKey(date: Date, granularity: TimeGranularity): string {
    const year = date.getFullYear();
    const month = date.getMonth();

    if (granularity === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return weekStart.toISOString().split("T")[0];
    }

    if (granularity === "month") {
      return `${year}-${String(month + 1).padStart(2, "0")}`;
    }

    return date.toISOString().split("T")[0];
  }

  async recordDailyAnalytics(
    organizationId: string,
    date: Date,
    data: Partial<{
      totalComments: number;
      totalEngagement: number;
      avgEngagementRate: number;
      totalConversions: number;
      totalRevenue: number;
      scarcityUses: number;
      urgencyUses: number;
      socialProofUses: number;
      exclusivityUses: number;
    }>
  ) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    return prisma.dailyAnalytics.upsert({
      where: {
        organizationId_date: {
          organizationId,
          date: dateOnly,
        },
      },
      create: {
        organizationId,
        date: dateOnly,
        ...data,
      },
      update: {
        totalComments: data.totalComments
          ? { increment: data.totalComments }
          : undefined,
        totalEngagement: data.totalEngagement
          ? { increment: data.totalEngagement }
          : undefined,
        avgEngagementRate: data.avgEngagementRate,
        totalConversions: data.totalConversions
          ? { increment: data.totalConversions }
          : undefined,
        totalRevenue: data.totalRevenue
          ? { increment: data.totalRevenue }
          : undefined,
        scarcityUses: data.scarcityUses
          ? { increment: data.scarcityUses }
          : undefined,
        urgencyUses: data.urgencyUses
          ? { increment: data.urgencyUses }
          : undefined,
        socialProofUses: data.socialProofUses
          ? { increment: data.socialProofUses }
          : undefined,
        exclusivityUses: data.exclusivityUses
          ? { increment: data.exclusivityUses }
          : undefined,
      },
    });
  }
}

export const timeSeriesService = new TimeSeriesService();
