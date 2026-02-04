import { Platform } from "@prisma/client";
import {
  BaseSocialAdapter,
  PostCommentInput,
  PostCommentResult,
  AccountInfo,
  PostInfo,
} from "./base.adapter";

export class TwitterAdapter extends BaseSocialAdapter {
  platform = Platform.TWITTER;

  private readonly API_BASE = "https://api.twitter.com/2";

  async postComment(input: PostCommentInput): Promise<PostCommentResult> {
    try {
      const tweetId = this.extractPostId(input.postUrl) ?? input.postId;

      if (!tweetId) {
        return {
          success: false,
          error: "Could not extract tweet ID from URL",
          errorCode: "INVALID_POST_URL",
        };
      }

      // Twitter API v2 - Reply to a tweet
      const response = await fetch(`${this.API_BASE}/tweets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${input.accessToken}`,
        },
        body: JSON.stringify({
          text: input.content,
          reply: {
            in_reply_to_tweet_id: tweetId,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            errorData.errors?.[0]?.message ||
            `Twitter API error: ${response.status}`
        );
      }

      const data = await response.json();
      const replyId = data.data?.id;

      return {
        success: true,
        commentId: replyId,
        commentUrl: replyId
          ? `https://twitter.com/i/web/status/${replyId}`
          : undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAccountInfo(accessToken: string): Promise<AccountInfo> {
    const response = await fetch(
      `${this.API_BASE}/users/me?user.fields=name,username,profile_image_url,public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get account info: ${response.status}`);
    }

    const data = await response.json();
    const user = data.data;

    return {
      username: user.username,
      displayName: user.name,
      avatarUrl: user.profile_image_url,
      profileUrl: `https://twitter.com/${user.username}`,
      followersCount: user.public_metrics?.followers_count,
      followingCount: user.public_metrics?.following_count,
    };
  }

  async getPostInfo(
    accessToken: string,
    tweetId: string
  ): Promise<PostInfo | null> {
    try {
      const response = await fetch(
        `${this.API_BASE}/tweets/${tweetId}?tweet.fields=author_id,created_at,public_metrics&expansions=author_id&user.fields=username`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const tweet = data.data;
      const author = data.includes?.users?.[0];

      return {
        id: tweet.id,
        url: this.buildPostUrl(tweet.id),
        content: tweet.text,
        authorUsername: author?.username || "",
        likesCount: tweet.public_metrics?.like_count,
        commentsCount: tweet.public_metrics?.reply_count,
        createdAt: tweet.created_at ? new Date(tweet.created_at) : undefined,
      };
    } catch {
      return null;
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  } | null> {
    try {
      const clientId = process.env.TWITTER_CLIENT_ID;
      const clientSecret = process.env.TWITTER_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return null;
      }

      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64"
      );

      const response = await fetch(`${this.API_BASE}/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      };
    } catch {
      return null;
    }
  }

  extractPostId(url: string): string | null {
    // Match Twitter/X post URLs
    // https://twitter.com/username/status/1234567890
    // https://x.com/username/status/1234567890
    const patterns = [
      /twitter\.com\/[^/]+\/status\/(\d+)/,
      /x\.com\/[^/]+\/status\/(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  buildPostUrl(tweetId: string): string {
    return `https://twitter.com/i/web/status/${tweetId}`;
  }
}

export const twitterAdapter = new TwitterAdapter();
