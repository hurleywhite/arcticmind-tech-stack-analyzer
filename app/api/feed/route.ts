import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFeed } from "@/lib/feed-generator";
import { adaptCompanyData } from "@/lib/db-adapters";
import { getCollectiveSignals, formatCollectiveContext } from "@/lib/collective-intel";
import { buildUserPreferences, formatPreferenceContext } from "@/lib/preference-engine";

export const maxDuration = 60;

const FEED_WINDOWS = [
  { label: "7am", hour: 7 },
  { label: "12pm", hour: 12 },
  { label: "5pm", hour: 17 },
  { label: "9pm", hour: 21 },
];

function getCurrentWindow() {
  const now = new Date();
  const hour = now.getHours();
  let currentIdx = -1;
  for (let i = FEED_WINDOWS.length - 1; i >= 0; i--) {
    if (hour >= FEED_WINDOWS[i].hour) { currentIdx = i; break; }
  }
  if (currentIdx === -1) {
    const ws = new Date(now); ws.setDate(ws.getDate() - 1); ws.setHours(21, 0, 0, 0);
    const we = new Date(now); we.setHours(7, 0, 0, 0);
    return { label: "9pm", windowStart: ws, windowEnd: we };
  }
  const current = FEED_WINDOWS[currentIdx];
  const ws = new Date(now); ws.setHours(current.hour, 0, 0, 0);
  const we = new Date(now);
  if (currentIdx < FEED_WINDOWS.length - 1) {
    we.setHours(FEED_WINDOWS[currentIdx + 1].hour, 0, 0, 0);
  } else {
    we.setDate(we.getDate() + 1); we.setHours(7, 0, 0, 0);
  }
  return { label: current.label, windowStart: ws, windowEnd: we };
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

    // Historical feed queries
    if (range) {
      const now = new Date();
      let since: Date;
      if (range === "today") { since = new Date(now); since.setHours(0, 0, 0, 0); }
      else if (range === "week") { since = new Date(now); since.setDate(since.getDate() - 7); since.setHours(0, 0, 0, 0); }
      else if (range === "month") { since = new Date(now); since.setDate(since.getDate() - 30); since.setHours(0, 0, 0, 0); }
      else { return NextResponse.json({ error: "Invalid range" }, { status: 400 }); }

      const { data: feeds } = await supabase
        .from("news_feeds")
        .select("*")
        .eq("user_id", profile.id)  // Use profile.id (auto UUID), not auth user id
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
        range_label: range === "today" ? "Today's AI Update" : range === "week" ? "This Week's AI Update" : "This Month's AI Update",
        feed_count: (feeds || []).length,
        cached: true,
        status: "complete",
      });
    }

    // Current window feed
    const window = getCurrentWindow();

    // Check cache (use profile.id for user_id)
    const { data: cachedFeed } = await supabase
      .from("news_feeds")
      .select("*")
      .eq("user_id", profile.id)
      .eq("feed_window", window.label)
      .gte("generated_at", window.windowStart.toISOString())
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (cachedFeed) {
      const feedData = cachedFeed.feed_data || cachedFeed.articles;
      const ageMs = Date.now() - new Date(cachedFeed.generated_at).getTime();
      return NextResponse.json({
        feed: feedData,
        cached: true,
        stale: ageMs > 2 * 60 * 60 * 1000,
        status: "complete",
        feed_window: window.label,
        generated_at: cachedFeed.generated_at,
      });
    }

    // No cache — generate feed
    const companyData = profile.company_domain
      ? await getCompanyData(supabase, profile.company_domain)
      : null;

    // Load individual downvotes + collective signals in parallel
    const industry = companyData?.summary
      ? companyData.summary.match(/(?:is a|is an)\s+([^.]+?)\s+company/i)?.[1] || "technology"
      : "technology";

    const [userPreferences, collectiveSignals] = await Promise.all([
      buildUserPreferences(supabase, user.id),
      getCollectiveSignals(supabase, user.id, profile.ai_interests || [], industry),
    ]);

    const preferenceContext = formatPreferenceContext(userPreferences);
    const collectiveContext = formatCollectiveContext(collectiveSignals);

    console.log("[feed-route] Company data found:", !!companyData, "domain:", profile.company_domain);
    console.log("[feed-route] Preferences:", userPreferences.total_feedback, "signals |", userPreferences.preferred_sources.length, "pref sources |", collectiveSignals.totalSignalUsers, "community users");

    // Check shared company feed cache
    let companyFeedCache = null;
    if (profile.company_domain) {
      const { data: sharedFeed } = await supabase
        .from("company_feeds")
        .select("*")
        .eq("company_domain", profile.company_domain)
        .eq("feed_window", window.label)
        .gte("generated_at", window.windowStart.toISOString())
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
    const feed = await generateFeed(profile, companyData, companyFeedCache, preferenceContext, collectiveContext, articleCount);

    // Cache shared company feed if we generated it fresh
    if (!companyFeedCache && companyData && profile.company_domain) {
      await supabase.from("company_feeds").insert({
        company_domain: profile.company_domain,
        feed_window: window.label,
        tool_updates: feed.tool_updates,
        company_news: feed.company_news,
      });
    }

    // Store user's feed (use profile.id as user_id)
    await supabase.from("news_feeds").insert({
      user_id: profile.id,
      company_domain: profile.company_domain,
      feed_data: feed,
      feed_window: window.label,
      window_start: window.windowStart.toISOString(),
      window_end: window.windowEnd.toISOString(),
      generated_at: feed.generated_at,
      expires_at: window.windowEnd.toISOString(),
    });

    return NextResponse.json({
      feed,
      cached: false,
      stale: false,
      status: "complete",
      feed_window: window.label,
      generated_at: feed.generated_at,
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
      const window = getCurrentWindow();
      const profile = await getProfile(supabase, user.id);
      if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      // Delete current window's feed
      await supabase
        .from("news_feeds")
        .delete()
        .eq("user_id", profile.id)
        .eq("feed_window", window.label)
        .gte("generated_at", window.windowStart.toISOString());

      const companyData = profile.company_domain
        ? await getCompanyData(supabase, profile.company_domain)
        : null;

      // Use shared company cache if available
      let companyFeedCache = null;
      if (profile.company_domain) {
        const { data: sharedFeed } = await supabase
          .from("company_feeds")
          .select("*")
          .eq("company_domain", profile.company_domain)
          .eq("feed_window", window.label)
          .gte("generated_at", window.windowStart.toISOString())
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

      // Build fresh preferences + collective signals for the refresh
      const refreshIndustry = companyData?.summary
        ? companyData.summary.match(/(?:is a|is an)\s+([^.]+?)\s+company/i)?.[1] || "technology"
        : "technology";

      const [refreshPrefs, refreshCollective] = await Promise.all([
        buildUserPreferences(supabase, user.id),
        getCollectiveSignals(supabase, user.id, profile.ai_interests || [], refreshIndustry),
      ]);

      const refreshPrefContext = formatPreferenceContext(refreshPrefs);
      const refreshCollectiveContext = formatCollectiveContext(refreshCollective);
      const refreshArticleCount = profile.article_count || 8;

      const feed = await generateFeed(profile, companyData, companyFeedCache, refreshPrefContext, refreshCollectiveContext, refreshArticleCount);

      await supabase.from("news_feeds").insert({
        user_id: profile.id,
        company_domain: profile.company_domain,
        feed_data: feed,
        feed_window: window.label,
        window_start: window.windowStart.toISOString(),
        window_end: window.windowEnd.toISOString(),
        generated_at: feed.generated_at,
        expires_at: window.windowEnd.toISOString(),
      });

      return NextResponse.json({
        feed,
        cached: false,
        stale: false,
        status: "complete",
        feed_window: window.label,
        generated_at: feed.generated_at,
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
