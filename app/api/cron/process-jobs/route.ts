import { NextRequest, NextResponse } from "next/server";
import { jobService } from "@/lib/services/comments";
import { commentProcessor } from "@/lib/services/queue/processors/comment.processor";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn("CRON_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// GET /api/cron/process-jobs - Process pending comment jobs
// Scheduled to run every minute via Vercel Cron
export async function GET(req: NextRequest) {
  // In production, verify the cron secret
  if (process.env.NODE_ENV === "production" && !verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const batchSize = 10;

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  try {
    // Get jobs ready to process
    const jobs = await jobService.getJobsToProcess(batchSize);

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No jobs to process",
        duration: Date.now() - startTime,
      });
    }

    console.log(`Processing ${jobs.length} comment jobs`);

    // Process jobs sequentially to avoid rate limits
    for (const job of jobs) {
      try {
        const result = await commentProcessor.process({
          commentJobId: job.id,
        });

        results.processed++;

        if (result.skipped) {
          results.skipped++;
        } else if (result.success) {
          results.succeeded++;
        }
      } catch (error) {
        results.processed++;
        results.failed++;
        results.errors.push(
          `Job ${job.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        console.error(`Failed to process job ${job.id}:`, error);
      }

      // Add a small delay between jobs to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const duration = Date.now() - startTime;

    console.log(
      `Job processing complete: ${results.succeeded}/${results.processed} succeeded, ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      duration,
      results,
    });
  } catch (error) {
    console.error("Cron job processing error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Job processing failed",
        duration: Date.now() - startTime,
        results,
      },
      { status: 500 }
    );
  }
}
