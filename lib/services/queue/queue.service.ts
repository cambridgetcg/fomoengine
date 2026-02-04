import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface JobPayload {
  type: string;
  data: Record<string, unknown>;
}

export interface QueuedJob {
  id: string;
  type: string;
  payload: JobPayload;
  priority: number;
  status: string;
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

export class QueueService {
  async enqueue(
    type: string,
    payload: Record<string, unknown>,
    options: {
      priority?: number;
      scheduledFor?: Date;
      maxAttempts?: number;
    } = {}
  ) {
    return prisma.jobQueue.create({
      data: {
        type,
        payload: payload as Prisma.InputJsonValue,
        priority: options.priority ?? 0,
        scheduledFor: options.scheduledFor ?? new Date(),
        maxAttempts: options.maxAttempts ?? 3,
      },
    });
  }

  async enqueueBulk(
    jobs: Array<{
      type: string;
      payload: Record<string, unknown>;
      priority?: number;
      scheduledFor?: Date;
    }>
  ) {
    return prisma.jobQueue.createMany({
      data: jobs.map((job) => ({
        type: job.type,
        payload: job.payload as Prisma.InputJsonValue,
        priority: job.priority ?? 0,
        scheduledFor: job.scheduledFor ?? new Date(),
      })),
    });
  }

  async dequeue(types?: string[], limit: number = 10): Promise<QueuedJob[]> {
    const now = new Date();

    const where: Prisma.JobQueueWhereInput = {
      status: "pending",
      scheduledFor: { lte: now },
    };

    if (types && types.length > 0) {
      where.type = { in: types };
    }

    // Get jobs and mark them as processing atomically
    const jobs = await prisma.jobQueue.findMany({
      where,
      orderBy: [{ priority: "desc" }, { scheduledFor: "asc" }],
      take: limit,
    });

    if (jobs.length === 0) {
      return [];
    }

    // Mark jobs as processing
    await prisma.jobQueue.updateMany({
      where: {
        id: { in: jobs.map((j) => j.id) },
        status: "pending", // Double-check status for safety
      },
      data: {
        status: "processing",
        startedAt: now,
        attempts: { increment: 1 },
      },
    });

    return jobs.map((job) => ({
      ...job,
      payload: job.payload as unknown as JobPayload,
      startedAt: now,
      attempts: job.attempts + 1,
    }));
  }

  async complete(jobId: string) {
    return prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });
  }

  async fail(jobId: string, errorMessage: string) {
    const job = await prisma.jobQueue.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    const newStatus =
      job.attempts >= job.maxAttempts ? "failed" : "pending";

    return prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: newStatus,
        errorMessage,
        // If retrying, schedule for later with exponential backoff
        scheduledFor:
          newStatus === "pending"
            ? new Date(Date.now() + Math.pow(2, job.attempts) * 60000) // 2^n minutes
            : undefined,
      },
    });
  }

  async retry(jobId: string) {
    return prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: "pending",
        errorMessage: null,
        scheduledFor: new Date(),
      },
    });
  }

  async getStats() {
    const [total, byStatus, byType] = await Promise.all([
      prisma.jobQueue.count(),
      prisma.jobQueue.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.jobQueue.groupBy({
        by: ["type"],
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      byType: Object.fromEntries(byType.map((t) => [t.type, t._count])),
    };
  }

  async cleanup(olderThan: Date) {
    // Delete completed jobs older than the specified date
    const deleted = await prisma.jobQueue.deleteMany({
      where: {
        status: { in: ["completed", "failed"] },
        completedAt: { lt: olderThan },
      },
    });

    return { deleted: deleted.count };
  }

  async getPendingCount(type?: string) {
    return prisma.jobQueue.count({
      where: {
        status: "pending",
        type: type || undefined,
      },
    });
  }

  async getFailedJobs(limit: number = 50) {
    return prisma.jobQueue.findMany({
      where: { status: "failed" },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export const queueService = new QueueService();
