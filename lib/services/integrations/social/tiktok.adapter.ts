import { Platform } from "@prisma/client";
import {
  BaseSocialAdapter,
  PostCommentInput,
  PostCommentResult,
  AccountInfo,
  PostInfo,
} from "./base.adapter";

export class TikTokAdapter extends BaseSocialAdapter {
  platform = Platform.TIKTOK;

  private readonly API_BASE = "https://open.tiktokapis.com/v2";

  async postComment(input: PostCommentInput): Promise<PostCommentResult> {
    try {
      const videoId = this.extractPostId(input.postUrl) ?? input.postId;

      if (!videoId) {
        return {
          success: false,
          error: "Could not extract video ID from URL",
          errorCode: "INVALID_POST_URL",
        };
      }

      // TikTok API for posting comments
      // Note: TikTok's comment API has limited availability
      const response = await fetch(`${this.API_BASE}/video/comment/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${input.accessToken}`,
        },
        body: JSON.stringify({
          video_id: videoId,
          text: input.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `TikTok API error: ${response.status}`
        );
      }

      const data = await response.json();

      return {
        success: true,
        commentId: data.data?.comment_id,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAccountInfo(accessToken: string): Promise<AccountInfo> {
    const response = await fetch(
      `${this.API_BASE}/user/info/?fields=display_name,avatar_url,follower_count,following_count,open_id,union_id,username`,
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
    const user = data.data?.user;

    return {
      username: user?.username || user?.open_id,
      displayName: user?.display_name,
      avatarUrl: user?.avatar_url,
      profileUrl: user?.username
        ? `https://www.tiktok.com/@${user.username}`
        : undefined,
      followersCount: user?.follower_count,
      followingCount: user?.following_count,
    };
  }

  async getPostInfo(
    accessToken: string,
    videoId: string
  ): Promise<PostInfo | null> {
    try {
      const response = await fetch(
        `${this.API_BASE}/video/query/?fields=id,title,like_count,comment_count,create_time`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            filters: {
              video_ids: [videoId],
            },
          }),
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const video = data.data?.videos?.[0];

      if (!video) {
        return null;
      }

      return {
        id: video.id,
        url: this.buildPostUrl(video.id),
        content: video.title,
        authorUsername: "", // Would need separate call to get author
        likesCount: video.like_count,
        commentsCount: video.comment_count,
        createdAt: video.create_time
          ? new Date(video.create_time * 1000)
          : undefined,
      };
    } catch {
      return null;
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.API_BASE}/user/info/?fields=open_id`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
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
      const response = await fetch(`${this.API_BASE}/oauth/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
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
    // Match TikTok video URLs
    // https://www.tiktok.com/@username/video/1234567890
    // https://vm.tiktok.com/ABC123/
    const patterns = [
      /tiktok\.com\/@[^/]+\/video\/(\d+)/,
      /tiktok\.com\/t\/([A-Za-z0-9]+)/,
      /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  buildPostUrl(videoId: string): string {
    // TikTok URLs require username, which we might not have
    // Return a generic format
    return `https://www.tiktok.com/video/${videoId}`;
  }
}

export const tiktokAdapter = new TikTokAdapter();
