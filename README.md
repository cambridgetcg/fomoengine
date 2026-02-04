# FOMO Engine

**Comment automation for SaaS growth, powered by FOMO psychology.**

## Mission Statement

FOMO Engine exists to help SaaS founders convert social media attention into signups.

Social platforms are where your prospects live. They scroll past thousands of posts daily. The difference between being ignored and being clicked comes down to psychology—specifically, the fear of missing out.

We automate the hardest part of social selling: showing up consistently with comments that trigger action. Not spam. Not generic replies. Contextual, platform-native comments that leverage scarcity, urgency, social proof, and exclusivity—the four forces that move people from "interesting" to "I need this now."

## Purpose

SaaS founders face a brutal reality: social media works, but it doesn't scale. You can't personally comment on every relevant post. You can't maintain dozens of accounts without burning them. You can't A/B test psychological triggers manually.

FOMO Engine solves this by:

1. **Automating comment deployment** — AI generates platform-specific comments using proven FOMO triggers (scarcity, urgency, social proof, exclusivity), then posts them through managed account pools
2. **Protecting account longevity** — Warmup sequences, daily limits, health scoring, and proxy rotation keep accounts alive instead of suspended
3. **Measuring what matters** — Track conversions, not just likes. Know which FOMO trigger converts best for your SaaS. Attribute signups to specific comments
4. **Scaling without hiring** — One dashboard manages campaigns across Instagram, Twitter/X, TikTok, Facebook, LinkedIn, and YouTube

## Core Capabilities

### Account Management
- Multi-platform support (Instagram, TikTok, Twitter/X, Facebook, LinkedIn, YouTube)
- Automated account warmup with progressive engagement limits
- Health monitoring and early warning system
- Proxy rotation for operational security

### Comment Automation
- AI-powered comment generation (OpenAI/Anthropic)
- FOMO trigger optimization (Scarcity, Urgency, Social Proof, Exclusivity)
- Platform-specific tone and length adaptation
- Template library with performance tracking

### Campaign Management
- Budget allocation and spend tracking
- Multi-platform targeting
- Hashtag and account targeting
- Performance-based optimization

### Analytics
- Engagement rate tracking
- Conversion attribution
- FOMO trigger performance comparison
- Exportable reports (CSV/JSON)

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (AWS RDS)
- **Authentication**: NextAuth.js
- **AI**: OpenAI GPT-4 / Anthropic Claude
- **Infrastructure**: Vercel, AWS (RDS, S3, Secrets Manager)
- **DNS**: Cloudflare

## Quick Start

```bash
# Clone the repository
git clone https://github.com/cambridgetcg/fomoengine.git
cd fomoengine

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://fomoengine.io

# AI (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Cron authentication
CRON_SECRET=your-cron-secret
```

## Architecture

```
fomoengine/
├── app/
│   ├── api/v1/          # REST API endpoints
│   ├── dashboard/       # Dashboard pages
│   └── login/           # Authentication
├── lib/
│   ├── services/        # Business logic
│   │   ├── accounts/    # Account management
│   │   ├── comments/    # Comment generation & jobs
│   │   ├── campaigns/   # Campaign management
│   │   └── analytics/   # Reporting & metrics
│   └── api/             # Frontend API client
├── components/          # React components
└── prisma/              # Database schema
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/accounts` | List social accounts |
| `POST /api/v1/comments/generate` | AI comment generation |
| `GET /api/v1/campaigns` | List campaigns |
| `GET /api/v1/analytics/overview` | Dashboard metrics |

## Deployment

The application is deployed on Vercel with automatic deployments on push to `main`.

**Production URL**: https://fomoengine.io

## License

Proprietary - All rights reserved.

---

Built with purpose by Cambridge TCG.
