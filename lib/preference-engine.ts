/**
 * Preference Engine
 *
 * Analyzes a user's feedback history to build a structured preference profile.
 * This replaces the naive "pass raw titles to Claude" approach with scored
 * source, category, and topic preferences that Claude can act on precisely.
 */

import { SupabaseClient } from "@supabase/supabase-js";

export interface UserPreferences {
  preferred_sources: { source: string; score: number }[];
  avoided_sources: { source: string; score: number }[];
  preferred_categories: { category: string; score: number }[];
  avoided_categories: { category: string; score: number }[];
  preferred_topics: string[];
  avoided_topics: string[];
  total_feedback: number;
  last_updated: string;
}

// Common stop words to filter out when extracting topic keywords
const STOP_WORDS = new Set([
  "this", "that", "with", "from", "their", "about", "your", "what", "when",
  "will", "have", "been", "more", "than", "into", "also", "just", "like",
  "they", "could", "would", "should", "does", "says", "said", "gets",
  "launches", "released", "update", "updates", "announces", "announced",
  "report", "reports", "shows", "gets", "makes", "takes", "adds", "over",
  "first", "after", "before", "here", "there", "these", "those", "being",
  "each", "which", "most", "some", "other", "many", "much", "even",
  "only", "very", "still", "already", "while", "where", "using", "used",
]);

/**
 * Build a structured preference profile from a user's feedback history.
 * Returns cached version if available and not invalidated.
 */
export async function buildUserPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<UserPreferences> {
  // Check cache first
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("preferences_cache, preferences_updated_at")
    .eq("id", userId)
    .single();

  if (profile?.preferences_cache && profile?.preferences_updated_at) {
    return profile.preferences_cache as UserPreferences;
  }

  // Build fresh preferences from feedback
  const { data: allFeedback } = await supabase
    .from("article_feedback")
    .select("article_title, article_url, feedback, source, category, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const rows = allFeedback || [];

  if (rows.length === 0) {
    const empty: UserPreferences = {
      preferred_sources: [],
      avoided_sources: [],
      preferred_categories: [],
      avoided_categories: [],
      preferred_topics: [],
      avoided_topics: [],
      total_feedback: 0,
      last_updated: new Date().toISOString(),
    };
    return empty;
  }

  // Score sources: +1 for upvote, -1 for downvote
  const sourceScores = new Map<string, number>();
  const categoryScores = new Map<string, number>();
  const upvotedKeywords = new Map<string, number>();
  const downvotedKeywords = new Map<string, number>();

  for (const row of rows) {
    const delta = row.feedback === "up" ? 1 : -1;

    // Score sources
    if (row.source) {
      const src = row.source.trim();
      if (src) {
        sourceScores.set(src, (sourceScores.get(src) || 0) + delta);
      }
    }

    // Score categories
    if (row.category) {
      const cat = row.category.trim().toLowerCase();
      if (cat) {
        categoryScores.set(cat, (categoryScores.get(cat) || 0) + delta);
      }
    }

    // Extract topic keywords from titles
    if (row.article_title) {
      const words = extractKeywords(row.article_title);
      const targetMap = row.feedback === "up" ? upvotedKeywords : downvotedKeywords;
      for (const word of words) {
        targetMap.set(word, (targetMap.get(word) || 0) + 1);
      }
    }
  }

  // Rank sources
  const preferred_sources = [...sourceScores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([source, score]) => ({ source, score }));

  const avoided_sources = [...sourceScores.entries()]
    .filter(([, score]) => score < 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5)
    .map(([source, score]) => ({ source, score }));

  // Rank categories
  const preferred_categories = [...categoryScores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category, score]) => ({ category, score }));

  const avoided_categories = [...categoryScores.entries()]
    .filter(([, score]) => score < 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5)
    .map(([category, score]) => ({ category, score }));

  // Topic keywords — only include those appearing 2+ times
  const preferred_topics = [...upvotedKeywords.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([keyword]) => keyword);

  const avoided_topics = [...downvotedKeywords.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword);

  const prefs: UserPreferences = {
    preferred_sources,
    avoided_sources,
    preferred_categories,
    avoided_categories,
    preferred_topics,
    avoided_topics,
    total_feedback: rows.length,
    last_updated: new Date().toISOString(),
  };

  // Cache in user profile
  await supabase
    .from("user_profiles")
    .update({
      preferences_cache: prefs,
      preferences_updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return prefs;
}

/**
 * Format preferences into a Claude-friendly prompt block
 */
export function formatPreferenceContext(prefs: UserPreferences): string {
  if (prefs.total_feedback === 0) return "";

  let context = `\nUSER PREFERENCES (learned from ${prefs.total_feedback} feedback signals):`;

  if (prefs.preferred_sources.length > 0) {
    const srcs = prefs.preferred_sources.map(s => `${s.source} (+${s.score})`).join(", ");
    context += `\nPREFERRED SOURCES: ${srcs}`;
    context += `\nSearch these sources FIRST when looking for articles.`;
  }

  if (prefs.avoided_sources.length > 0) {
    const srcs = prefs.avoided_sources.map(s => s.source).join(", ");
    context += `\nAVOIDED SOURCES: ${srcs}`;
    context += `\nDo NOT include articles from these sources.`;
  }

  if (prefs.preferred_categories.length > 0) {
    const cats = prefs.preferred_categories.map(c => `${c.category} (+${c.score})`).join(", ");
    context += `\nPREFERRED CATEGORIES: ${cats}`;
    context += `\nWeight results toward these content types.`;
  }

  if (prefs.avoided_categories.length > 0) {
    const cats = prefs.avoided_categories.map(c => c.category).join(", ");
    context += `\nAVOIDED CATEGORIES: ${cats}`;
  }

  if (prefs.preferred_topics.length > 0) {
    context += `\nPREFERRED TOPICS: ${prefs.preferred_topics.join(", ")}`;
    context += `\nFind more articles about these specific topics.`;
  }

  if (prefs.avoided_topics.length > 0) {
    context += `\nAVOIDED TOPICS: ${prefs.avoided_topics.join(", ")}`;
    context += `\nDo not include articles about these topics.`;
  }

  return context;
}

/**
 * Extract meaningful keywords from an article title
 */
function extractKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
}
