-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('INSTAGRAM', 'TIKTOK', 'TWITTER', 'FACEBOOK', 'LINKEDIN', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('HEALTHY', 'WARMING', 'FLAGGED', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "WarmupPhase" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETE');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommentTone" AS ENUM ('FRIENDLY', 'PROFESSIONAL', 'CASUAL', 'URGENT', 'FOMO');

-- CreateEnum
CREATE TYPE "CommentJobStatus" AS ENUM ('PENDING', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FomoTriggerType" AS ENUM ('SCARCITY', 'URGENCY', 'SOCIAL_PROOF', 'EXCLUSIVITY');

-- CreateEnum
CREATE TYPE "ProxyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "avatarUrl" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "billingEmail" TEXT,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "profileUrl" TEXT,
    "avatarUrl" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'WARMING',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "warmupPhase" "WarmupPhase" NOT NULL DEFAULT 'PENDING',
    "warmupProgress" INTEGER NOT NULL DEFAULT 0,
    "warmupStartedAt" TIMESTAMP(3),
    "healthScore" INTEGER NOT NULL DEFAULT 100,
    "lastHealthCheck" TIMESTAMP(3),
    "healthHistory" JSONB,
    "dailyCommentLimit" INTEGER NOT NULL DEFAULT 50,
    "commentsToday" INTEGER NOT NULL DEFAULT 0,
    "lastCommentAt" TIMESTAMP(3),
    "proxyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3),

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proxy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "location" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "status" "ProxyStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastCheckAt" TIMESTAMP(3),
    "responseTimeMs" INTEGER,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proxy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "platform" "Platform",
    "tone" "CommentTone" NOT NULL,
    "fomoType" "FomoTriggerType",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPrompt" TEXT,
    "aiVariations" JSONB,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "avgEngagement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "CommentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "templateId" TEXT,
    "campaignId" TEXT,
    "targetPlatform" "Platform" NOT NULL,
    "targetPostUrl" TEXT NOT NULL,
    "targetPostId" TEXT,
    "content" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3),
    "status" "CommentJobStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "commentId" TEXT,
    "commentUrl" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentEngagement" (
    "id" TEXT NOT NULL,
    "commentJobId" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "linkClicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "budgetDaily" DECIMAL(10,2) NOT NULL,
    "budgetTotal" DECIMAL(10,2) NOT NULL,
    "budgetSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "targetPlatforms" "Platform"[],
    "targetHashtags" TEXT[],
    "targetAccounts" TEXT[],
    "targetKeywords" TEXT[],
    "demographics" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "scheduleConfig" JSONB,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "cpc" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountAnalytics" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "commentsPosted" INTEGER NOT NULL DEFAULT 0,
    "totalEngagement" INTEGER NOT NULL DEFAULT 0,
    "avgEngagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "healthScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateAnalytics" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalReplies" INTEGER NOT NULL DEFAULT 0,
    "avgEngagement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignAnalytics" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "commentsPosted" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spend" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cpc" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAnalytics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalComments" INTEGER NOT NULL DEFAULT 0,
    "totalEngagement" INTEGER NOT NULL DEFAULT 0,
    "avgEngagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalConversions" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "scarcityUses" INTEGER NOT NULL DEFAULT 0,
    "urgencyUses" INTEGER NOT NULL DEFAULT 0,
    "socialProofUses" INTEGER NOT NULL DEFAULT 0,
    "exclusivityUses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobQueue" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_userId_organizationId_key" ON "OrganizationMember"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "SocialAccount_organizationId_idx" ON "SocialAccount"("organizationId");

-- CreateIndex
CREATE INDEX "SocialAccount_status_idx" ON "SocialAccount"("status");

-- CreateIndex
CREATE INDEX "SocialAccount_platform_idx" ON "SocialAccount"("platform");

-- CreateIndex
CREATE INDEX "SocialAccount_proxyId_idx" ON "SocialAccount"("proxyId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_organizationId_platform_username_key" ON "SocialAccount"("organizationId", "platform", "username");

-- CreateIndex
CREATE INDEX "Proxy_organizationId_idx" ON "Proxy"("organizationId");

-- CreateIndex
CREATE INDEX "Proxy_status_idx" ON "Proxy"("status");

-- CreateIndex
CREATE INDEX "Proxy_location_idx" ON "Proxy"("location");

-- CreateIndex
CREATE INDEX "CommentTemplate_organizationId_idx" ON "CommentTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "CommentTemplate_platform_idx" ON "CommentTemplate"("platform");

-- CreateIndex
CREATE INDEX "CommentTemplate_tone_idx" ON "CommentTemplate"("tone");

-- CreateIndex
CREATE INDEX "CommentTemplate_isActive_idx" ON "CommentTemplate"("isActive");

-- CreateIndex
CREATE INDEX "CommentJob_organizationId_idx" ON "CommentJob"("organizationId");

-- CreateIndex
CREATE INDEX "CommentJob_accountId_idx" ON "CommentJob"("accountId");

-- CreateIndex
CREATE INDEX "CommentJob_status_idx" ON "CommentJob"("status");

-- CreateIndex
CREATE INDEX "CommentJob_scheduledFor_idx" ON "CommentJob"("scheduledFor");

-- CreateIndex
CREATE INDEX "CommentJob_campaignId_idx" ON "CommentJob"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentEngagement_commentJobId_key" ON "CommentEngagement"("commentJobId");

-- CreateIndex
CREATE INDEX "CommentEngagement_commentJobId_idx" ON "CommentEngagement"("commentJobId");

-- CreateIndex
CREATE INDEX "Campaign_organizationId_idx" ON "Campaign"("organizationId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_startDate_endDate_idx" ON "Campaign"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "AccountAnalytics_accountId_idx" ON "AccountAnalytics"("accountId");

-- CreateIndex
CREATE INDEX "AccountAnalytics_date_idx" ON "AccountAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AccountAnalytics_accountId_date_key" ON "AccountAnalytics"("accountId", "date");

-- CreateIndex
CREATE INDEX "TemplateAnalytics_templateId_idx" ON "TemplateAnalytics"("templateId");

-- CreateIndex
CREATE INDEX "TemplateAnalytics_date_idx" ON "TemplateAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateAnalytics_templateId_date_key" ON "TemplateAnalytics"("templateId", "date");

-- CreateIndex
CREATE INDEX "CampaignAnalytics_campaignId_idx" ON "CampaignAnalytics"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignAnalytics_date_idx" ON "CampaignAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignAnalytics_campaignId_date_key" ON "CampaignAnalytics"("campaignId", "date");

-- CreateIndex
CREATE INDEX "DailyAnalytics_organizationId_idx" ON "DailyAnalytics"("organizationId");

-- CreateIndex
CREATE INDEX "DailyAnalytics_date_idx" ON "DailyAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAnalytics_organizationId_date_key" ON "DailyAnalytics"("organizationId", "date");

-- CreateIndex
CREATE INDEX "JobQueue_status_scheduledFor_idx" ON "JobQueue"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "JobQueue_type_idx" ON "JobQueue"("type");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_proxyId_fkey" FOREIGN KEY ("proxyId") REFERENCES "Proxy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proxy" ADD CONSTRAINT "Proxy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentTemplate" ADD CONSTRAINT "CommentTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentJob" ADD CONSTRAINT "CommentJob_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentJob" ADD CONSTRAINT "CommentJob_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CommentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentJob" ADD CONSTRAINT "CommentJob_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentEngagement" ADD CONSTRAINT "CommentEngagement_commentJobId_fkey" FOREIGN KEY ("commentJobId") REFERENCES "CommentJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountAnalytics" ADD CONSTRAINT "AccountAnalytics_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateAnalytics" ADD CONSTRAINT "TemplateAnalytics_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CommentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAnalytics" ADD CONSTRAINT "CampaignAnalytics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAnalytics" ADD CONSTRAINT "DailyAnalytics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
