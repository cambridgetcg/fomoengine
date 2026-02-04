import { Platform } from "@prisma/client";
import { BaseSocialAdapter } from "./base.adapter";
import { instagramAdapter } from "./instagram.adapter";
import { tiktokAdapter } from "./tiktok.adapter";
import { twitterAdapter } from "./twitter.adapter";

export { BaseSocialAdapter } from "./base.adapter";
export type {
  ProxyConfig,
  PostCommentInput,
  PostCommentResult,
  AccountInfo,
  PostInfo,
} from "./base.adapter";

export { instagramAdapter } from "./instagram.adapter";
export { tiktokAdapter } from "./tiktok.adapter";
export { twitterAdapter } from "./twitter.adapter";

// Adapter factory
const adapters: Partial<Record<Platform, BaseSocialAdapter>> = {
  [Platform.INSTAGRAM]: instagramAdapter,
  [Platform.TIKTOK]: tiktokAdapter,
  [Platform.TWITTER]: twitterAdapter,
};

export function getSocialAdapter(platform: Platform): BaseSocialAdapter {
  const adapter = adapters[platform];

  if (!adapter) {
    throw new Error(`No adapter available for platform: ${platform}`);
  }

  return adapter;
}

export function isSupportedPlatform(platform: Platform): boolean {
  return platform in adapters;
}

export function getSupportedPlatforms(): Platform[] {
  return Object.keys(adapters) as Platform[];
}
