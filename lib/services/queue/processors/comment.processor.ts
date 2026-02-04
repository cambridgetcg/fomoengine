import { CommentJobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jobService } from "@/lib/services/comments";
import { accountService } from "@/lib/services/accounts";
import { getSocialAdapter, PostCommentInput } from "@/lib/services/integrations/social";

export interface CommentJobPayload {
  commentJobId: string;
}

export class CommentProcessor {
  async process(payload: CommentJobPayload) {
    const { commentJobId } = payload;

    // Get the job with all related data
    const job = await prisma.commentJob.findUnique({
      where: { id: commentJobId },
      include: {
        account: {
          include: { proxy: true },
        },
        template: true,
      },
    });

    if (!job) {
      throw new Error(`Comment job not found: ${commentJobId}`);
    }

    // Check if job is in a processable state
    if (
      job.status !== CommentJobStatus.PENDING &&
      job.status !== CommentJobStatus.SCHEDULED
    ) {
      console.log(`Skipping job ${commentJobId}: status is ${job.status}`);
      return { skipped: true, reason: `Invalid status: ${job.status}` };
    }

    // Update status to processing
    await jobService.updateStatus(commentJobId, CommentJobStatus.PROCESSING);

    try {
      // Check account health and limits
      if (job.account.commentsToday >= job.account.dailyCommentLimit) {
        throw new Error("Daily comment limit reached for account");
      }

      // Get the appropriate social adapter
      const adapter = getSocialAdapter(job.targetPlatform);

      // Validate account token
      if (!job.account.accessToken) {
        throw new Error("Account has no access token");
      }

      const isTokenValid = await adapter.validateToken(job.account.accessToken);

      if (!isTokenValid) {
        // Try to refresh token
        if (job.account.refreshToken) {
          const refreshed = await adapter.refreshToken(job.account.refreshToken);
          if (refreshed) {
            await prisma.socialAccount.update({
              where: { id: job.account.id },
              data: {
                accessToken: refreshed.accessToken,
                refreshToken: refreshed.refreshToken,
                tokenExpiresAt: refreshed.expiresAt,
              },
            });
            job.account.accessToken = refreshed.accessToken;
          } else {
            throw new Error("Failed to refresh access token");
          }
        } else {
          throw new Error("Access token expired and no refresh token available");
        }
      }

      // Build comment input
      const commentInput: PostCommentInput = {
        accessToken: job.account.accessToken,
        postId: job.targetPostId || "",
        postUrl: job.targetPostUrl,
        content: job.content,
      };

      // Add proxy if available
      if (job.account.proxy) {
        commentInput.proxy = {
          host: job.account.proxy.host,
          port: job.account.proxy.port,
          username: job.account.proxy.username || undefined,
          password: job.account.proxy.password || undefined,
        };
      }

      // Post the comment
      const result = await adapter.postComment(commentInput);

      if (!result.success) {
        throw new Error(result.error || "Comment posting failed");
      }

      // Update job as completed
      await jobService.updateStatus(commentJobId, CommentJobStatus.COMPLETED, {
        commentId: result.commentId,
        commentUrl: result.commentUrl,
      });

      // Increment account comment counter
      await accountService.incrementCommentsToday(job.account.id);

      // Record template usage if using a template
      if (job.templateId) {
        const { templateService } = await import("@/lib/services/comments");
        await templateService.recordUsage(job.templateId);
      }

      return {
        success: true,
        commentId: result.commentId,
        commentUrl: result.commentUrl,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Update job as failed
      await jobService.updateStatus(commentJobId, CommentJobStatus.FAILED, {
        errorMessage,
      });

      // Check if we should retry
      const updatedJob = await prisma.commentJob.findUnique({
        where: { id: commentJobId },
        select: { retryCount: true, maxRetries: true },
      });

      if (
        updatedJob &&
        updatedJob.retryCount < updatedJob.maxRetries &&
        this.isRetryableError(errorMessage)
      ) {
        // Reset to pending for retry
        await prisma.commentJob.update({
          where: { id: commentJobId },
          data: {
            status: CommentJobStatus.PENDING,
            retryCount: { increment: 1 },
          },
        });
      }

      throw error;
    }
  }

  private isRetryableError(error: string): boolean {
    const nonRetryablePatterns = [
      "access token expired",
      "no access token",
      "daily limit",
      "account suspended",
      "forbidden",
      "unauthorized",
    ];

    const errorLower = error.toLowerCase();
    return !nonRetryablePatterns.some((pattern) => errorLower.includes(pattern));
  }
}

export const commentProcessor = new CommentProcessor();
