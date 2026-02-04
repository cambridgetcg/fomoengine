import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/lib/middleware/auth";
import {
  timeSeriesService,
  TimeGranularity,
} from "@/lib/services/analytics";
import { ApiResponse } from "@/lib/types/api";

type MetricType =
  | "comments"
  | "engagement"
  | "health"
  | "fomo"
  | "conversions";

// GET /api/v1/analytics/timeseries - Get time series data
export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse parameters
    const metric = (searchParams.get("metric") || "comments") as MetricType;
    const granularity = (searchParams.get("granularity") ||
      "day") as TimeGranularity;

    // Default to last 30 days
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date();

    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const range = { start: startDate, end: endDate };

    let data;

    switch (metric) {
      case "comments":
        data = await timeSeriesService.getCommentsTimeSeries(
          ctx.organizationId,
          range,
          granularity
        );
        break;
      case "engagement":
        data = await timeSeriesService.getEngagementTimeSeries(
          ctx.organizationId,
          range,
          granularity
        );
        break;
      case "health":
        data = await timeSeriesService.getAccountHealthTimeSeries(
          ctx.organizationId,
          range
        );
        break;
      case "fomo":
        data = await timeSeriesService.getFomoTriggerTimeSeries(
          ctx.organizationId,
          range
        );
        break;
      case "conversions":
        data = await timeSeriesService.getConversionTimeSeries(
          ctx.organizationId,
          range,
          granularity
        );
        break;
      default:
        throw new Error(`Invalid metric: ${metric}`);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        metric,
        granularity,
        range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        ...data,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "TIMESERIES_FAILED",
        message: error instanceof Error ? error.message : "Failed to fetch time series",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
});
