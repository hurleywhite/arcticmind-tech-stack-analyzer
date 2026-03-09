# ArcticMind Tech Stack Analyzer

Infer a company's tech stack from their public job listings. Enter a company URL, get back a structured JSON of every technology they use — categorized and ready to feed into company profiles.

Built for the [ArcticMind](https://arcticblueai.com) platform by Hurley White.

## How It Works

1. User enters a company domain (e.g., `snowflake.com`)
2. SerpAPI queries Google Jobs for that company's active job listings
3. Job descriptions are sent to Claude (Anthropic API) for tech extraction
4. Claude identifies and categorizes all named technologies
5. Returns structured JSON with tech stack, summary, confidence score

## Setup

### Prerequisites

- Node.js 18+
- [SerpAPI key](https://serpapi.com/) (free tier: 100 searches/month)
- [Anthropic API key](https://console.anthropic.com/)

### Install & Run

```bash
git clone <repo-url>
cd arcticmind-tech-stack-analyzer
npm install
```

Copy `.env.example` to `.env.local` and add your keys:

```bash
cp .env.example .env.local
```

```
SERPAPI_KEY=your_serpapi_key_here
CLAUDE_API_KEY=your_anthropic_api_key_here
```

> **Note:** Use `CLAUDE_API_KEY` locally (avoids collision with Claude Code). On Vercel, `ANTHROPIC_API_KEY` also works — the app checks both.

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoint

### `POST /api/analyze-stack`

**Request:**
```json
{
  "companyUrl": "snowflake.com"
}
```

**Response:**
```json
{
  "company": "Snowflake",
  "domain": "snowflake.com",
  "tech_stack": {
    "cloud_infrastructure": ["AWS", "Azure", "GCP", "Terraform"],
    "data_engineering": ["Snowflake", "dbt", "Apache Spark", "Airflow"],
    "backend": ["Python", "Java", "Go", "Scala"],
    "frontend": ["React", "TypeScript"],
    "mobile": [],
    "devops_ci_cd": ["Docker", "Kubernetes", "Jenkins", "GitHub Actions"],
    "databases": ["PostgreSQL", "Redis", "DynamoDB"],
    "marketing_sales": ["Salesforce", "HubSpot"],
    "design": ["Figma"],
    "project_management": ["Jira", "Confluence"],
    "ai_ml": ["PyTorch", "TensorFlow"],
    "security": ["Okta", "Snyk"],
    "communication": ["Slack"],
    "other": []
  },
  "summary": "Snowflake is a cloud-native data platform company with a heavy emphasis on data engineering and cloud infrastructure...",
  "jobs_analyzed": 27,
  "job_titles_sampled": ["Senior Data Engineer", "Staff Software Engineer", "..."],
  "confidence": "high",
  "last_analyzed": "2026-03-06T12:00:00.000Z"
}
```

### Confidence Scoring

| Level  | Jobs Found |
|--------|-----------|
| High   | 15+       |
| Medium | 5-14      |
| Low    | 1-4       |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Job Data:** SerpAPI (Google Jobs endpoint)
- **AI Extraction:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Language:** TypeScript

## Project Structure

```
/app
  /page.tsx                    — Input form + results display
  /api/analyze-stack/route.ts  — Main API route
/lib
  /job-sources/
    serpapi.ts                 — SerpAPI Google Jobs integration
  /analyzer.ts                — Claude API tech extraction
  /types.ts                   — TypeScript interfaces
```

## Architecture Decisions

- **SerpAPI over direct scraping:** Google Jobs aggregates from LinkedIn, Indeed, Glassdoor, and company career pages. One API call covers all sources. No need to detect which ATS a company uses.
- **Claude for extraction:** LLM-based extraction handles the variety of how technologies are mentioned in job descriptions far better than regex or keyword matching.
- **No persistence:** This is a stateless tool. Zach's ArcticMind platform has its own Supabase database — this just provides the extraction endpoint.
- **No caching:** Keeping v1 simple. Job listings change frequently anyway.

## Deployment

Deploy to Vercel:

```bash
vercel
```

Set environment variables in Vercel dashboard:
- `SERPAPI_KEY`
- `ANTHROPIC_API_KEY` (or `CLAUDE_API_KEY` — either works)
