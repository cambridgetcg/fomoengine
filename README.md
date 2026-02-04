# FOMO Engine

**Intelligent social media engagement automation powered by psychological triggers.**

## Mission Statement

FOMO Engine exists to democratize high-converting social media engagement strategies. We believe that the psychological principles behind viral marketing—scarcity, urgency, social proof, and exclusivity—should be accessible to businesses of all sizes, not just those with dedicated growth teams.

Our mission is to automate authentic, contextually-relevant engagement at scale while maintaining the human touch that builds genuine connections.

## Purpose

FOMO Engine solves the challenge of consistent, high-quality social media engagement by:

1. **Automating the mundane** — Comment scheduling, account rotation, and health monitoring run autonomously
2. **Amplifying effectiveness** — AI-generated comments leverage proven FOMO triggers tailored to each platform
3. **Protecting investments** — Intelligent warmup sequences and health checks safeguard account longevity
4. **Measuring impact** — Comprehensive analytics connect engagement activities to business outcomes

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
