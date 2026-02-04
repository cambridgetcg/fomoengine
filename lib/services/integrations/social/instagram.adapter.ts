import { Platform } from "@prisma/client";
import {
  BaseSocialAdapter,
  PostCommentInput,
  PostCommentResult,
  AccountInfo,
  PostInfo,
} from "./base.adapter";

export class InstagramAdapter extends BaseSocialAdapter {
  platform = Platform.INSTAGRAM;

  private readonly API_BASE = "https://graph.instagram.com";
  private readonly API_VERSION = "v18.0";

  async postComment(input: PostCommentInput): Promise<PostCommentResult> {
    try {
      const postId = this.extractPostId(input.postUrl) ?? input.postId;

      if (!postId) {
        return {
          success: false,
          error: "Could not extract post ID from URL",
          errorCode: "INVALID_POST_URL",
        };
      }

      // Instagram Graph API requires media ID, not shortcode
      // In production, you'd need to convert shortcode to media ID
      const response = await fetch(
        `${this.API_BASE}/${this.API_VERSION}/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: input.content,
            access_token: input.accessToken,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Instagram API error: ${response.status}`
        );
      }

      const data = await response.json();

      return {
        success: true,
        commentId: data.id,
        commentUrl: `https://www.instagram.com/p/${postId}/c/${data.id}/`,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAccountInfo(accessToken: string): Promise<AccountInfo> {
    const response = await fetch(
      `${this.API_BASE}/${this.API_VERSION}/me?fields=id,username,name,profile_picture_url,followers_count,follows_count&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get account info: ${response.status}`);
    }

    const data = await response.json();

    return {
      username: data.username,
      displayName: data.name,
      avatarUrl: data.profile_picture_url,
      profileUrl: `https://www.instagram.com/${data.username}/`,
      followersCount: data.followers_count,
      followingCount: data.follows_count,
    };
  }

  async getPostInfo(
    accessToken: string,
    postId: string
  ): Promise<PostInfo | null> {
    try {
      const response = await fetch(
        `${this.API_BASE}/${this.API_VERSION}/${postId}?fields=id,shortcode,caption,like_count,comments_count,timestamp,username&access_token=${accessToken}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      return {
        id: data.id,
        url: `https://www.instagram.com/p/${data.shortcode}/`,
        content: data.caption,
        authorUsername: data.username,
        likesCount: data.like_count,
        commentsCount: data.comments_count,
        createdAt: data.timestamp ? new Date(data.timestamp) : undefined,
      };
    } catch {
      return null;
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.API_BASE}/${this.API_VERSION}/me?access_token=${accessToken}`
      );
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
      // Instagram long-lived tokens can be refreshed
      const response = await fetch(
        `${this.API_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${refreshToken}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      return {
        accessToken: data.access_token,
        expiresAt,
      };
    } catch {
      return null;
    }
  }

  extractPostId(url: string): string | null {
    // Match Instagram post URLs
    // https://www.instagram.com/p/ABC123/
    // https://instagram.com/p/ABC123
    // https://www.instagram.com/reel/ABC123/
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  buildPostUrl(postId: string): string {
    return `https://www.instagram.com/p/${postId}/`;
  }
}

export const instagramAdapter = new InstagramAdapter();
