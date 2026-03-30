"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FeedData, FeedItem } from "@/lib/feed-types";
import SkeletonCard from "@/components/skeleton-card";
import ArticleCard from "@/components/article-card";
import FeedSection from "@/components/feed-section";
import DigestBanner from "@/components/digest-banner";

type FeedRange = "current" | "today" | "week" | "month";

const RANGE_LABELS: Record<FeedRange, string> = {
  current: "Latest",
  today: "Today's AI Update",
  week: "This Week's AI Update",
  month: "This Month's AI Update",
};

export default function NewsPage() {
  const [feed, setFeed] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [feedWindow, setFeedWindow] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [activeRange, setActiveRange] = useState<FeedRange>("current");
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());
  const [bookmarkedUrls, setBookmarkedUrls] = useState<Set<string>>(new Set());

  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // Load read articles from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("arcticpulse_read");
      if (stored) setReadArticles(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  function markAsRead(url: string) {
    setReadArticles((prev) => {
      const next = new Set(prev);
      next.add(url);
      try { localStorage.setItem("arcticpulse_read", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  // Load bookmarks
  useEffect(() => {
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((data) => {
        if (data.bookmarks) {
          setBookmarkedUrls(new Set(data.bookmarks.map((b: { article_url: string }) => b.article_url)));
        }
      })
      .catch(() => {});
  }, []);

  async function toggleBookmark(item: FeedItem) {
    if (!item.url) return;
    const isCurrentlyBookmarked = bookmarkedUrls.has(item.url);

    // Optimistic update
    setBookmarkedUrls((prev) => {
      const next = new Set(prev);
      if (isCurrentlyBookmarked) next.delete(item.url!);
      else next.add(item.url!);
      return next;
    });

    try {
      if (isCurrentlyBookmarked) {
        await fetch(`/api/bookmarks?url=${encodeURIComponent(item.url)}`, { method: "DELETE" });
      } else {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            article_url: item.url,
            article_title: item.title,
            article_summary: item.summary,
            article_source: item.source,
            article_category: item.category,
            article_date: item.date,
          }),
        });
      }
    } catch {
      // Revert on error
      setBookmarkedUrls((prev) => {
        const next = new Set(prev);
        if (isCurrentlyBookmarked) next.add(item.url!);
        else next.delete(item.url!);
        return next;
      });
    }
  }

  useEffect(() => {
    async function loadFeedback() {
      try {
        const res = await fetch("/api/feedback");
        if (res.ok && mountedRef.current) {
          const data = await res.json();
          setFeedbackMap(data.feedback || {});
        }
      } catch {
        // Silent
      }
    }
    loadFeedback();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function doFetch() {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setLoading(true);
      setError(null);
      setStale(false);

      try {
        const url =
          activeRange === "current"
            ? "/api/feed"
            : `/api/feed?range=${activeRange}`;

        const response = await fetch(url);
        if (cancelled) return;

        if (!response.ok) {
          let data;
          try {
            data = await response.json();
          } catch {
            data = {};
          }

          if (
            response.status === 404 &&
            data.error?.includes("Profile not found")
          ) {
            if (!cancelled) {
              setError(
                "Your profile isn't set up yet. Please complete onboarding to get your personalized feed."
              );
              setLoading(false);
            }
            fetchingRef.current = false;
            return;
          }
          throw new Error(data.error || "Failed to load feed");
        }

        const data = await response.json();
        if (cancelled) return;

        if (data.status === "generating") {
          fetchingRef.current = false;
          if (pollCountRef.current < 12) {
            pollCountRef.current++;
            pollTimerRef.current = setTimeout(() => {
              if (!cancelled) doFetch();
            }, 5000);
          } else {
            setError(
              "Feed generation is taking longer than expected. Please try refreshing."
            );
            setLoading(false);
          }
          return;
        }
        pollCountRef.current = 0;

        setFeed(data.feed);
        setGeneratedAt(data.generated_at);
        setFeedWindow(data.feed_window || null);
        setStale(data.stale || false);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
        fetchingRef.current = false;
      }
    }

    doFetch();

    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [activeRange]);

  async function handleRefresh() {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to refresh feed");
      }

      const data = await response.json();
      if (mountedRef.current) {
        setFeed(data.feed);
        setGeneratedAt(data.generated_at);
        setFeedWindow(data.feed_window || null);
        setStale(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Refresh failed");
      }
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
      fetchingRef.current = false;
    }
  }

  async function handleFeedback(
    articleUrl: string,
    articleTitle: string,
    type: "up" | "down",
    source?: string,
    category?: string
  ) {
    const prev = feedbackMap[articleUrl];
    const newMap = { ...feedbackMap };
    if (prev === type) {
      delete newMap[articleUrl];
    } else {
      newMap[articleUrl] = type;
    }
    setFeedbackMap(newMap);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_url: articleUrl,
          article_title: articleTitle,
          feedback: type,
          source: source || null,
          category: category || null,
        }),
      });
      if (!res.ok && prev) {
        setFeedbackMap((m) => ({ ...m, [articleUrl]: prev }));
      }
    } catch {
      if (prev) {
        setFeedbackMap((m) => ({ ...m, [articleUrl]: prev }));
      }
    }
  }

  // Filter articles by date based on active tab
  function filterByDate(items: FeedItem[]): FeedItem[] {
    if (activeRange === "current") return items;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return items.filter((item) => {
      if (!item.date) return true;
      try {
        const articleDate = new Date(item.date + "T23:59:59");
        if (activeRange === "today") {
          return articleDate >= todayStart;
        } else if (activeRange === "week") {
          const weekAgo = new Date(todayStart);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return articleDate >= weekAgo;
        } else if (activeRange === "month") {
          const monthAgo = new Date(todayStart);
          monthAgo.setDate(monthAgo.getDate() - 30);
          return articleDate >= monthAgo;
        }
      } catch {
        return true;
      }
      return true;
    });
  }

  const filteredFeed = feed ? {
    ...feed,
    tool_updates: filterByDate(feed.tool_updates),
    ai_trends: filterByDate(feed.ai_trends),
  } : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      {/* Range Tabs + Refresh */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex flex-1 gap-1 rounded-xl bg-foreground/5 p-1">
          {(
            [
              ["current", "Latest"],
              ["today", "Today"],
              ["week", "This Week"],
              ["month", "This Month"],
            ] as [FeedRange, string][]
          ).map(([range, label]) => (
            <button
              key={range}
              onClick={() => {
                if (range !== activeRange && !fetchingRef.current) {
                  setActiveRange(range);
                }
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeRange === range
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground/40 hover:text-foreground/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="rounded-lg bg-foreground/5 px-3 py-2 text-sm font-medium text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-50"
          title="Refresh feed"
        >
          {refreshing ? "..." : "\u21BB"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div>
          <div className="mb-8 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
            <p className="font-medium text-blue-300">
              {activeRange === "current"
                ? "Building your personalized feed..."
                : `Loading ${RANGE_LABELS[activeRange].toLowerCase()}...`}
            </p>
            {activeRange === "current" && (
              <p className="mt-1 text-sm text-blue-400/60">
                Searching for news about your company, tools, and AI trends.
                This may take 15-30 seconds on first load.
              </p>
            )}
          </div>
          <FeedSection icon="📌" title="For Your Company">
            <SkeletonCard />
          </FeedSection>
          <FeedSection icon="🔧" title="Your Tools">
            <SkeletonCard />
            <SkeletonCard />
          </FeedSection>
          <FeedSection icon="🤖" title="AI Trends">
            <SkeletonCard />
            <SkeletonCard />
          </FeedSection>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-center">
          <p className="font-medium text-red-300">{error}</p>
          {error.includes("onboarding") ? (
            <Link
              href="/signup"
              className="mt-3 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Complete Setup
            </Link>
          ) : (
            <button
              onClick={() => {
                setError(null);
                pollCountRef.current = 0;
                fetchingRef.current = false;
                setActiveRange("current");
              }}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Feed content */}
      {feed && !loading && !error && (
        <>
          {refreshing && (
            <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-center text-sm text-blue-400">
              Refreshing your feed...
            </div>
          )}

          {stale && !refreshing && activeRange === "current" && (
            <div className="mb-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-center">
              <p className="text-sm text-yellow-300">
                This feed is over 2 hours old. Newer AI news may be available.
              </p>
              <button
                onClick={handleRefresh}
                className="mt-2 rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700"
              >
                Get fresh news
              </button>
            </div>
          )}

          {/* Summary Digest Banner */}
          <DigestBanner
            feed={filteredFeed!}
            feedWindow={feedWindow}
            range={activeRange}
          />

          {/* Tool Updates */}
          {filteredFeed!.tool_updates.length > 0 && (
            <FeedSection icon="🔧" title="Your Tools">
              {filteredFeed!.tool_updates.map((item, i) => (
                <ArticleCard
                  key={`tool-${i}`}
                  item={item}
                  feedback={item.url ? feedbackMap[item.url] || null : null}
                  onFeedback={handleFeedback}
                  isRead={item.url ? readArticles.has(item.url) : false}
                  onRead={markAsRead}
                  isBookmarked={item.url ? bookmarkedUrls.has(item.url) : false}
                  onBookmark={toggleBookmark}
                />
              ))}
            </FeedSection>
          )}

          {/* AI Trends */}
          {filteredFeed!.ai_trends.length > 0 && (
            <FeedSection icon="🤖" title="AI Trends">
              {filteredFeed!.ai_trends.map((item, i) => (
                <ArticleCard
                  key={`trend-${i}`}
                  item={item}
                  feedback={item.url ? feedbackMap[item.url] || null : null}
                  onFeedback={handleFeedback}
                  isRead={item.url ? readArticles.has(item.url) : false}
                  onRead={markAsRead}
                  isBookmarked={item.url ? bookmarkedUrls.has(item.url) : false}
                  onBookmark={toggleBookmark}
                />
              ))}
            </FeedSection>
          )}

          {/* Company Section — at bottom for context */}
          {feed.company_news && (
            <FeedSection icon="📌" title="Your Company Profile">
              <div className="rounded-xl border border-foreground/8 bg-foreground/[0.02] p-5">
                <h3 className="text-lg font-bold text-foreground/90">
                  {feed.company_news.company_name}
                </h3>
                <p className="mt-1 text-xs text-foreground/30">
                  {feed.company_news.domain}
                </p>
                <p className="mt-3 text-sm text-foreground/55 leading-relaxed">
                  {feed.company_news.summary}
                </p>
                {feed.company_news.top_technologies.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {feed.company_news.top_technologies
                      .slice(0, 12)
                      .map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full bg-foreground/5 px-2.5 py-0.5 text-xs font-medium text-foreground/50"
                        >
                          {tech}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </FeedSection>
          )}

          {/* Empty */}
          {filteredFeed!.tool_updates.length === 0 &&
            filteredFeed!.ai_trends.length === 0 &&
            !feed.company_news && (
              <div className="rounded-xl border border-foreground/10 p-8 text-center">
                <p className="text-foreground/40">
                  {activeRange === "current"
                    ? "No feed items yet. Try refreshing or updating your interests in "
                    : "No articles found for this period. Check back later or try "}
                  <Link
                    href="/dashboard/settings"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Settings
                  </Link>
                  .
                </p>
              </div>
            )}

          {/* Timestamp */}
          {generatedAt && (
            <p className="mt-6 text-center text-xs text-foreground/20">
              {activeRange === "current" && feedWindow
                ? `${feedWindow} feed \u00b7 ${new Date(generatedAt).toLocaleString()}`
                : `Through ${new Date(generatedAt).toLocaleString()}`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
