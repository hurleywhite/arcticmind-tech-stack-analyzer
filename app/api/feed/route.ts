import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFeed } from "@/lib/feed-generator";
import { adaptCompanyData } from "@/lib/db-adapters";
import { getCollectiveSignals, formatCollectiveContext } from "@/lib/collective-intel";
import { buildUserPreferences, formatPreferenceContext } from "@/lib/preference-engine";
import { sendSlackFeedHighlights } from "@/lib/slack-notify";

export const maxDuration = 120;

/**
 * Adaptive cache TTL based on visit frequency.
 * Counts how many feed generations happened in the last 7 days,
 * and sets the cache TTL to 24 / visits_per_day hours.
 * Floor: 2 hours (power users). Ceiling: 12 hours (casual users).
 */
async function getAdaptiveTtlHours(supabase: ReturnType<typeof Object>, userId: string): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // @ts-expect-error supabase type
  const { count } = await supabase
    .from("news_feeds")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("generated_at", sevenDaysAgo.toISOString());

  const feedsInLastWeek = count || 0;
  const visitsPerDay = feedsInLastWeek / 7;

  if (visitsPerDay <= 0) return 12; // New user — 12 hour cache
  const ttl = Math.min(12, Math.max(2, Math.round(24 / visitsPerDay)));
  return ttl;
}

function getWindowLabel(): string {
  const hour = new Date().getHours();
  if (hour < 7) return "overnight";
  if (hour < 10) return "early-morning";
  if (hour < 13) return "morning";
  if (hour < 15) return "early-afternoon";
  if (hour < 19) return "afternoon";
  return "evening";
}

// Helper: get user profile — id column IS the auth user id
async function getProfile(supabase: ReturnType<typeof Object>, userId: string) {
  // @ts-expect-error supabase type
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

// Helper: get company data from company_intel_analyses table
async function getCompanyData(supabase: ReturnType<typeof Object>, domain: string) {
  // @ts-expect-error supabase type
  const { data } = await supabase
    .from("company_intel_analyses")
    .select("*")
    .eq("company_domain", domain)
    .order("analyzed_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;
  return adaptCompanyData(data);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range");

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfile(supabase, user.id);
    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found. Please complete onboarding." },
        { status: 404 }
      );
    }

    // Historical feed queries (week/month only — "today" falls through to live feed)
    if (range && range !== "today") {
      const now = new Date();
      let since: Date;
      if (range === "week") { since = new Date(now); since.setDate(since.getDate() - 7); since.setHours(0, 0, 0, 0); }
      else if (range === "month") { since = new Date(now); since.setDate(since.getDate() - 30); since.setHours(0, 0, 0, 0); }
      else { return NextResponse.json({ error: "Invalid range" }, { status: 400 }); }

      const { data: feeds } = await supabase
        .from("news_feeds")
        .select("*")
        .eq("user_id", profile.id)
        .gte("generated_at", since.toISOString())
        .order("generated_at", { ascending: false });

      const seenUrls = new Set<string>();
      const allToolUpdates: Record<string, unknown>[] = [];
      const allAiTrends: Record<string, unknown>[] = [];
      const allLearning: Record<string, unknown>[] = [];
      let latestCompanyNews = null;

      for (const feed of feeds || []) {
        const fd = (feed.feed_data || feed.articles) as Record<string, unknown>;
        if (!fd) continue;
        if (fd.company_news && !latestCompanyNews) latestCompanyNews = fd.company_news;
        for (const item of (fd.tool_updates as Record<string, string>[]) || []) {
          if (item.url && !seenUrls.has(item.url)) { seenUrls.add(item.url); allToolUpdates.push(item); }
        }
        for (const item of (fd.ai_trends as Record<string, string>[]) || []) {
          if (item.url && !seenUrls.has(item.url)) { seenUrls.add(item.url); allAiTrends.push(item); }
        }
        for (const item of (fd.learning_skills as Record<string, string>[]) || []) {
          if (!seenUrls.has(item.title || "")) { seenUrls.add(item.title || ""); allLearning.push(item); }
        }
      }

      return NextResponse.json({
        feed: {
          company_news: latestCompanyNews,
          tool_updates: allToolUpdates,
          ai_trends: allAiTrends,
          learning_skills: allLearning.slice(0, 5),
          generated_at: new Date().toISOString(),
        },
        range,
        range_label: range === "week" ? "This Week's AI Update" : "This Month's AI Update",
        feed_count: (feeds || []).length,
        cached: true,
        status: "complete",
      });
    }

    // "today" range behaves like "current" — shows latest cached feed or generates fresh

    // Adaptive cache: check if most recent feed is still fresh enough
    const ttlHours = await getAdaptiveTtlHours(supabase, profile.id);
    const windowLabel = getWindowLabel();

    const { data: cachedFeed } = await supabase
      .from("news_feeds")
      .select("*")
      .eq("user_id", profile.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (cachedFeed) {
      const feedData = cachedFeed.feed_data || cachedFeed.articles;
      const ageMs = Date.now() - new Date(cachedFeed.generated_at).getTime();
      const ttlMs = ttlHours * 60 * 60 * 1000;
      const staleThresholdMs = 2 * 60 * 60 * 1000; // Show "stale" indicator after 2h

      if (ageMs < ttlMs) {
        // Cache is still fresh — serve it
        return NextResponse.json({
          feed: feedData,
          cached: true,
          stale: ageMs > staleThresholdMs,
          status: "complete",
          feed_window: windowLabel,
          generated_at: cachedFeed.generated_at,
          cache_ttl_hours: ttlHours,
        });
      }
      // Cache expired — fall through to regeneration
    }

    // No cache — generate feed
    const companyData = profile.company_domain
      ? await getCompanyData(supabase, profile.company_domain)
      : null;

    // Load individual downvotes + collective signals in parallel
    const industry = companyData?.summary
      ? companyData.summary.match(/(?:is a|is an)\s+([^.]+?)\s+company/i)?.[1] || "technology"
      : "technology";

    const [userPreferences, collectiveSignals, hubToolsRes, customSourcesRes] = await Promise.all([
      buildUserPreferences(supabase, user.id),
      getCollectiveSignals(supabase, user.id, profile.ai_interests || [], industry),
      supabase.from("hub_tools").select("name").eq("user_id", user.id),
      supabase.from("custom_sources").select("name, url").eq("user_id", user.id).eq("is_active", true),
    ]);

    const preferenceContext = formatPreferenceContext(userPreferences);
    const collectiveContext = formatCollectiveContext(collectiveSignals);

    // Build hub tools context — tools the user actively uses/tracks
    const hubToolNames = (hubToolsRes.data || []).map((t: { name: string }) => t.name);
    const hubToolsContext = hubToolNames.length > 0
      ? `\n\nUSER'S ACTIVE TOOLS (from their Tooling Hub — they actively use these, prioritize updates about them):\n${hubToolNames.join(", ")}`
      : "";

    // Build custom sources context — user's preferred blogs/sites
    const customSources = (customSourcesRes.data || []) as { name: string; url: string }[];
    const customSourcesContext = customSources.length > 0
      ? `\n\nUSER'S CUSTOM SOURCES (check these sites for relevant articles):\n${customSources.map(s => `${s.name}: ${s.url}`).join("\n")}`
      : "";

    console.log("[feed-route] Company data found:", !!companyData, "domain:", profile.company_domain);
    console.log("[feed-route] Preferences:", userPreferences.total_feedback, "signals |", userPreferences.preferred_sources.length, "pref sources |", collectiveSignals.totalSignalUsers, "community users");
    console.log("[feed-route] Hub tools:", hubToolNames.length, "| Custom sources:", customSources.length);
    console.log("[feed-route] Adaptive TTL:", ttlHours, "hours for this user");

    // Check shared company feed cache (within last 4 hours)
    let companyFeedCache = null;
    if (profile.company_domain) {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const { data: sharedFeed } = await supabase
        .from("company_feeds")
        .select("*")
        .eq("company_domain", profile.company_domain)
        .gte("generated_at", fourHoursAgo)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (sharedFeed) {
        companyFeedCache = {
          tool_updates: sharedFeed.tool_updates || [],
          company_news: sharedFeed.company_news,
        };
      }
    }

    const articleCount = profile.article_count || 8;
    const feed = await generateFeed(profile, companyData, companyFeedCache, preferenceContext + hubToolsContext + customSourcesContext, collectiveContext, articleCount);

    // Cache shared company feed if we generated it fresh
    if (!companyFeedCache && companyData && profile.company_domain) {
      await supabase.from("company_feeds").insert({
        company_domain: profile.company_domain,
        feed_window: windowLabel,
        tool_updates: feed.tool_updates,
        company_news: feed.company_news,
      });
    }

    // Store user's feed
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
    await supabase.from("news_feeds").insert({
      user_id: profile.id,
      company_domain: profile.company_domain,
      feed_data: feed,
      feed_window: windowLabel,
      generated_at: feed.generated_at,
      expires_at: expiresAt,
    });

    // Send Slack notification (fire-and-forget)
    if (profile.slack_notify_enabled && profile.slack_webhook_url) {
      sendSlackFeedHighlights(
        profile.slack_webhook_url,
        feed,
        profile.company_name || "Your Company"
      ).catch((e) => console.error("Slack notify failed:", e));
    }

    return NextResponse.json({
      feed,
      cached: false,
      stale: false,
      status: "complete",
      feed_window: windowLabel,
      generated_at: feed.generated_at,
      cache_ttl_hours: ttlHours,
    });
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (body.action === "refresh") {
      const profile = await getProfile(supabase, user.id);
      if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      const companyData = profile.company_domain
        ? await getCompanyData(supabase, profile.company_domain)
        : null;

      // Use shared company cache if available (within last 4 hours)
      let companyFeedCache = null;
      if (profile.company_domain) {
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
        const { data: sharedFeed } = await supabase
          .from("company_feeds")
          .select("*")
          .eq("company_domain", profile.company_domain)
          .gte("generated_at", fourHoursAgo)
          .order("generated_at", { ascending: false })
          .limit(1)
          .single();
        if (sharedFeed) {
          companyFeedCache = {
            tool_updates: sharedFeed.tool_updates || [],
            company_news: sharedFeed.company_news,
          };
        }
      }

      // Build fresh preferences + collective signals
      const refreshIndustry = companyData?.summary
        ? companyData.summary.match(/(?:is a|is an)\s+([^.]+?)\s+company/i)?.[1] || "technology"
        : "technology";

      const [refreshPrefs, refreshCollective, refreshHubTools, refreshCustomSources] = await Promise.all([
        buildUserPreferences(supabase, user.id),
        getCollectiveSignals(supabase, user.id, profile.ai_interests || [], refreshIndustry),
        supabase.from("hub_tools").select("name").eq("user_id", user.id),
        supabase.from("custom_sources").select("name, url").eq("user_id", user.id).eq("is_active", true),
      ]);

      const refreshPrefContext = formatPreferenceContext(refreshPrefs);
      const refreshCollectiveContext = formatCollectiveContext(refreshCollective);
      const refreshHubToolNames = (refreshHubTools.data || []).map((t: { name: string }) => t.name);
      const refreshHubToolsCtx = refreshHubToolNames.length > 0
        ? `\n\nUSER'S ACTIVE TOOLS (from their Tooling Hub):\n${refreshHubToolNames.join(", ")}`
        : "";
      const refreshCustomSrc = (refreshCustomSources.data || []) as { name: string; url: string }[];
      const refreshCustomCtx = refreshCustomSrc.length > 0
        ? `\n\nUSER'S CUSTOM SOURCES:\n${refreshCustomSrc.map(s => `${s.name}: ${s.url}`).join("\n")}`
        : "";
      const refreshArticleCount = profile.article_count || 8;
      const refreshWindowLabel = getWindowLabel();

      const feed = await generateFeed(profile, companyData, companyFeedCache, refreshPrefContext + refreshHubToolsCtx + refreshCustomCtx, refreshCollectiveContext, refreshArticleCount);

      const ttlHours = await getAdaptiveTtlHours(supabase, profile.id);
      const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

      await supabase.from("news_feeds").insert({
        user_id: profile.id,
        company_domain: profile.company_domain,
        feed_data: feed,
        feed_window: refreshWindowLabel,
        generated_at: feed.generated_at,
        expires_at: expiresAt,
      });

      return NextResponse.json({
        feed,
        cached: false,
        stale: false,
        status: "complete",
        feed_window: refreshWindowLabel,
        generated_at: feed.generated_at,
        cache_ttl_hours: ttlHours,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Feed refresh error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
