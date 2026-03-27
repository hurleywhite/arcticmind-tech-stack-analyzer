/**
 * Collective Intelligence Module
 *
 * Aggregates signals across all users to improve feed quality:
 * - Popular articles (most upvoted in last 7 days)
 * - Trending topics (what similar users are engaging with)
 * - Avoid patterns (widely downvoted content)
 * - Peer signals (what users with matching profiles liked)
 */

import { SupabaseClient } from "@supabase/supabase-js";

export interface CollectiveSignals {
  // Articles that got the most upvotes across all users (last 7 days)
  popularArticles: { title: string; url: string; upvotes: number }[];
  // Topics/keywords that similar users upvoted
  trendingTopicsForPeers: string[];
  // Articles widely downvoted — avoid these patterns
  avoidPatterns: string[];
  // Summary stat: how many users contributed signals
  totalSignalUsers: number;
}

export async function getCollectiveSignals(
  supabase: SupabaseClient,
  userId: string,
  userInterests: string[],
  userIndustry: string
): Promise<CollectiveSignals> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since = sevenDaysAgo.toISOString();

  // Run all queries in parallel
  const [popularResult, downvotedResult, peerProfilesResult, signalCountResult] = await Promise.all([
    // 1. Most upvoted articles in last 7 days (across ALL users)
    supabase
      .from("article_feedback")
      .select("article_title, article_url, feedback")
      .eq("feedback", "up")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50),

    // 2. Most downvoted articles (patterns to avoid)
    supabase
      .from("article_feedback")
      .select("article_title, feedback")
      .eq("feedback", "down")
      .gte("created_at", since)
      .limit(50),

    // 3. Users with overlapping interests (peer group)
    supabase
      .from("user_profiles")
      .select("id, ai_interests, role, seniority")
      .neq("id", userId)
      .limit(100),

    // 4. Count unique signal contributors
    supabase
      .from("article_feedback")
      .select("user_id")
      .gte("created_at", since),
  ]);

  // Process popular articles — count upvotes per article
  const upvoteCounts = new Map<string, { title: string; url: string; count: number }>();
  for (const row of popularResult.data || []) {
    const key = row.article_url || row.article_title;
    if (!key) continue;
    const existing = upvoteCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      upvoteCounts.set(key, { title: row.article_title || "", url: row.article_url || "", count: 1 });
    }
  }
  const popularArticles = [...upvoteCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(a => ({ title: a.title, url: a.url, upvotes: a.count }));

  // Process downvoted patterns — extract keywords from titles
  const downvoteKeywords = new Map<string, number>();
  for (const row of downvotedResult.data || []) {
    if (!row.article_title) continue;
    // Extract meaningful words (3+ chars, lowercase)
    const words = row.article_title.toLowerCase()
      .split(/\s+/)
      .filter((w: string) => w.length > 3 && !["this", "that", "with", "from", "their", "about", "your", "what", "when", "will", "have", "been", "more", "than"].includes(w));
    for (const word of words) {
      downvoteKeywords.set(word, (downvoteKeywords.get(word) || 0) + 1);
    }
  }
  // Keywords that appear in 2+ downvoted articles = patterns to avoid
  const avoidPatterns = [...downvoteKeywords.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([keyword]) => keyword);

  // Process peer signals — find users with overlapping interests
  const peerIds: string[] = [];
  for (const peer of peerProfilesResult.data || []) {
    if (!peer.ai_interests) continue;
    const overlap = (peer.ai_interests as string[]).filter(
      (interest: string) => userInterests.includes(interest)
    );
    // At least 2 overlapping interests = peer
    if (overlap.length >= 2) {
      peerIds.push(peer.id);
    }
  }

  // Get what peers upvoted — these become trending topics
  let trendingTopicsForPeers: string[] = [];
  if (peerIds.length > 0) {
    const { data: peerUpvotes } = await supabase
      .from("article_feedback")
      .select("article_title")
      .in("user_id", peerIds.slice(0, 20))
      .eq("feedback", "up")
      .gte("created_at", since)
      .limit(20);

    // Extract topic keywords from peer-upvoted articles
    const topicCounts = new Map<string, number>();
    for (const row of peerUpvotes || []) {
      if (!row.article_title) continue;
      const words = row.article_title.toLowerCase()
        .split(/\s+/)
        .filter((w: string) => w.length > 3 && !["this", "that", "with", "from", "their", "about", "your", "what", "when", "will", "have", "been", "more", "than", "launches", "released", "update", "updates", "announces"].includes(w));
      for (const word of words) {
        topicCounts.set(word, (topicCounts.get(word) || 0) + 1);
      }
    }
    trendingTopicsForPeers = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([keyword]) => keyword);
  }

  // Count unique signal users
  const uniqueUsers = new Set((signalCountResult.data || []).map((r: { user_id: string }) => r.user_id));

  return {
    popularArticles,
    trendingTopicsForPeers,
    avoidPatterns,
    totalSignalUsers: uniqueUsers.size,
  };
}

/**
 * Format collective signals into a prompt block for Claude
 */
export function formatCollectiveContext(signals: CollectiveSignals): string {
  if (signals.totalSignalUsers === 0) return "";

  let context = `\nCOLLECTIVE INTELLIGENCE (${signals.totalSignalUsers} users contributing signals):`;

  if (signals.popularArticles.length > 0) {
    context += `\nPopular articles this week (upvoted by multiple users):`;
    for (const article of signals.popularArticles.slice(0, 5)) {
      context += `\n  - "${article.title}" (${article.upvotes} upvotes)`;
    }
    context += `\nSurface SIMILAR topics — these resonate with this user's peers.`;
  }

  if (signals.trendingTopicsForPeers.length > 0) {
    context += `\nTrending among similar professionals: ${signals.trendingTopicsForPeers.join(", ")}`;
  }

  if (signals.avoidPatterns.length > 0) {
    context += `\nWidely disliked content patterns (multiple users downvoted): ${signals.avoidPatterns.join(", ")}`;
  }

  return context;
}
