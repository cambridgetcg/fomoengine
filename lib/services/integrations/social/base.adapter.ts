import { Platform } from "@prisma/client";

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface PostCommentInput {
  accessToken: string;
  postId: string;
  postUrl: string;
  content: string;
  proxy?: ProxyConfig;
}

export interface PostCommentResult {
  success: boolean;
  commentId?: string;
  commentUrl?: string;
  error?: string;
  errorCode?: string;
}

export interface AccountInfo {
  username: string;
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  followersCount?: number;
  followingCount?: number;
}

export interface PostInfo {
  id: string;
  url: string;
  content?: string;
  authorUsername: string;
  likesCount?: number;
  commentsCount?: number;
  createdAt?: Date;
}

export abstract class BaseSocialAdapter {
  abstract platform: Platform;

  abstract postComment(input: PostCommentInput): Promise<PostCommentResult>;

  abstract getAccountInfo(accessToken: string): Promise<AccountInfo>;

  abstract getPostInfo(
    accessToken: string,
    postId: string
  ): Promise<PostInfo | null>;

  abstract validateToken(accessToken: string): Promise<boolean>;

  abstract refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  } | null>;

  // Parse post URL to extract post ID
  abstract extractPostId(url: string): string | null;

  // Build the post URL from post ID
  abstract buildPostUrl(postId: string): string;

  // Rate limit handling
  protected isRateLimited(error: unknown): boolean {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes("rate limit") ||
        msg.includes("too many requests") ||
        msg.includes("429")
      );
    }
    return false;
  }

  // Common error handling
  protected handleError(error: unknown): PostCommentResult {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    let errorCode = "UNKNOWN_ERROR";

    if (this.isRateLimited(error)) {
      errorCode = "RATE_LIMITED";
    } else if (message.includes("unauthorized") || message.includes("401")) {
      errorCode = "UNAUTHORIZED";
    } else if (message.includes("forbidden") || message.includes("403")) {
      errorCode = "FORBIDDEN";
    } else if (message.includes("not found") || message.includes("404")) {
      errorCode = "NOT_FOUND";
    }

    return {
      success: false,
      error: message,
      errorCode,
    };
  }
}
