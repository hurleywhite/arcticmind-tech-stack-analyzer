# ArcticPulse Feed Generation — Debug & Fix Guide

## THE PROBLEM
The `/api/feed` route returns "Failed to load feed" on Vercel production. The feed shows the company profile card and static learning recommendations, but **zero actual news articles** from Claude web search.

## ROOT CAUSE ANALYSIS

### Where it fails
**File:** `lib/feed-generator.ts` — functions `fetchToolUpdates()`, `fetchAiTrends()`, `fetchIndustryAiNews()`

These three functions each make a Claude API call with the `web_search_20250305` tool. They run inside `generateFeed()` which is called from `app/api/feed/route.ts`.

### Why it fails
**The Claude web search calls exceed Vercel's 60-second function timeout.**

The call chain:
1. `GET /api/feed` → checks auth, loads profile, loads company data
2. Calls `generateFeed(profile, companyData)`
3. `generateFeed` runs 3 Claude API calls:
   - `generateCompanyFeed()` → `fetchToolUpdates()` (searches for tool news)
   - `fetchAiTrends()` (searches for AI news matching user interests)
   - `fetchIndustryAiNews()` (searches for industry-specific AI news)
4. Each call uses `client.messages.create()` with `tools: [{ type: "web_search_20250305", name: "web_search", max_uses: N }]`
5. **Each web search call takes 15-45+ seconds** depending on prompt complexity and `max_uses`
6. With 3 calls (some sequential, some parallel), total time easily exceeds 60s

### Evidence from local testing
```
# Test 1: Long prompts (source catalog + quality rules + user context)
# Result: 80 seconds, 2 of 3 calls timed out at 40s
Company feed generation failed: Error: company-feed timed out after 40000ms
AI trends failed: Error: ai-trends timed out after 40000ms

# Test 2: Simplified short prompts (max_uses: 3)
# Result: 46 seconds, all 3 calls succeeded, 10 articles returned
Done in 46.037 seconds
Tools: 4 | Trends: 6 | Learning: 3
```

### The timing breakdown
- `fetchToolUpdates()` with 10 tools + vendor hints + quality rules: ~45s (TIMEOUT)
- `fetchAiTrends()` with full user context + source guidance: ~40s (TIMEOUT)
- `fetchIndustryAiNews()` with full user context: ~30s (usually succeeds)
- Vercel `maxDuration`: 60s (Pro plan)

### What makes prompts slow
1. **`max_uses` parameter** — Each web search round-trip takes 3-5 seconds. `max_uses: 10` means up to 50 seconds of just searching.
2. **Long prompts** — Source catalog guidance, quality rules, user context all add tokens. More input tokens = slower processing.
3. **Complex instructions** — "Check vendor blogs first, then independent coverage, then filter by..." makes Claude do more sequential work.

## ARCHITECTURE OF THE FIX

### Approach 1: Simplify prompts (current partial fix)
- Reduced `max_uses` from 10 → 3
- Shortened prompts dramatically
- Reduced from 10 tools to 5
- **Result: 46s locally, but still tight for Vercel (network overhead can push it over 60s)**

### Approach 2 (RECOMMENDED): Async generation with polling
Instead of generating the feed synchronously in one request:

1. **POST /api/feed** → Creates a `feed_jobs` row with status='generating', returns `{ status: 'generating', jobId: '...' }`
2. **Background**: A separate function/edge function generates the feed asynchronously
3. **GET /api/feed** → Client polls every 3-5 seconds. If feed exists in `news_feeds`, return it. If `feed_jobs` shows 'generating', return `{ status: 'generating' }`. If 'failed', return error.
4. **Client**: Shows loading state while polling, renders feed when ready.

This completely eliminates the timeout issue because the generation happens outside the request-response cycle.

### Approach 3: Sequential generation with partial results
Instead of all 3 Claude calls at once:
1. First request generates tool updates only (15-20s)
2. Return partial feed immediately
3. Client renders what it has, shows "loading more..."
4. Second request generates AI trends (15-20s)
5. Third request generates industry news (15-20s)
6. Each call is well under 60s

## KEY FILES

- `lib/feed-generator.ts` — Claude API calls, prompt construction, JSON parsing
- `app/api/feed/route.ts` — API route handler, caching logic, Supabase queries
- `lib/source-catalog.ts` — Vetted source list (used for guidance, NOT sent to Claude in prompts)
- `lib/feed-types.ts` — TypeScript interfaces
- `lib/db-adapters.ts` — Bridges Supabase schema to app types
- `app/feed/page.tsx` — Frontend feed page, fetches and renders articles

## SUPABASE TABLES

- `user_profiles` — User preferences, company, interests (id = auth.users.id)
- `company_intel_analyses` — Company tech stack data
- `news_feeds` — Cached per-user feeds (feed_data JSONB column)
- `company_feeds` — Shared per-company feed cache (tool updates)
- `feed_jobs` — Job status tracking (pending/generating/complete/failed)
- `article_feedback` — Thumbs up/down per article

## ENVIRONMENT VARIABLES
- `CLAUDE_API_KEY` — Anthropic API key (must have credits, must support web_search tool)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key

## WHAT TO DO

1. **Implement Approach 2 (async polling)** — This is the permanent fix. The feed_jobs table already exists.
2. **OR implement Approach 3 (sequential partial results)** — Simpler, works within current architecture.
3. Keep prompts short — the simplified prompts in the current code work. Don't add source catalog text back into prompts.
4. Keep `max_uses: 3` on web search — higher values cause timeouts.
5. Always test with `npx tsx` locally before deploying:
   ```bash
   export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
   npx tsx -e "import { generateFeed } from './lib/feed-generator'; ..."
   ```
