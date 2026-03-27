"use client";

import { useState, useEffect, useRef } from "react";
import FeedHeader from "@/components/feed-header";
import Link from "next/link";
import { FeedData, FeedItem } from "@/lib/feed-types";

type FeedRange = "current" | "today" | "week" | "month";

const RANGE_LABELS: Record<FeedRange, string> = {
  current: "Latest",
  today: "Today's AI Update",
  week: "This Week's AI Update",
  month: "This Month's AI Update",
};

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-foreground/10 p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-5 w-16 rounded-full bg-foreground/10" />
        <div className="h-4 w-20 rounded bg-foreground/10" />
      </div>
      <div className="mb-2 h-5 w-4/5 rounded bg-foreground/10" />
      <div className="space-y-1.5">
        <div className="h-4 w-full rounded bg-foreground/8" />
        <div className="h-4 w-3/4 rounded bg-foreground/8" />
      </div>
    </div>
  );
}

function ThumbButton({
  type,
  active,
  onClick,
}: {
  type: "up" | "down";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded-full px-2 py-1 text-xs transition-all ${
        active
          ? type === "up"
            ? "bg-green-500/15 text-green-400"
            : "bg-red-500/15 text-red-400"
          : "text-foreground/25 hover:text-foreground/50 hover:bg-foreground/5"
      }`}
      title={type === "up" ? "Useful" : "Not useful"}
    >
      {type === "up" ? "👍" : "👎"}
    </button>
  );
}

function ArticleCard({
  item,
  feedback,
  onFeedback,
  isRead,
  onRead,
}: {
  item: FeedItem;
  feedback: string | null;
  onFeedback: (url: string, title: string, type: "up" | "down") => void;
  isRead?: boolean;
  onRead?: (url: string) => void;
}) {
  return (
    <article className={`group rounded-xl border p-5 transition-all hover:border-foreground/15 hover:bg-foreground/[0.04] ${
      isRead
        ? "border-foreground/5 bg-foreground/[0.01] opacity-60"
        : "border-foreground/8 bg-foreground/[0.02]"
    }`}>
      <div className="mb-2 flex items-center gap-2">
        {item.category && (
          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-blue-400">
            {item.category}
          </span>
        )}
        {item.date && (
          <span className="text-xs text-foreground/30">{item.date}</span>
        )}
        {isRead && (
          <span className="text-[10px] text-foreground/25">✓ read</span>
        )}
      </div>

      <h3 className={`mb-2 text-[15px] leading-snug ${isRead ? "font-medium text-foreground/60" : "font-semibold text-foreground/90"}`}>
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors"
            onClick={() => onRead?.(item.url!)}
          >
            {item.title}
          </a>
        ) : (
          item.title
        )}
      </h3>

      <p className="text-sm leading-relaxed text-foreground/55">
        {item.summary}
      </p>

      {item.relevance_note && (
        <p className="mt-2.5 rounded-lg bg-blue-500/8 px-3 py-1.5 text-xs text-blue-400 leading-relaxed">
          💡 {item.relevance_note}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        {item.url && item.source && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-foreground/30 hover:text-foreground/50 transition-colors"
          >
            {item.source} ↗
          </a>
        )}
        {item.url && (
          <div className="flex items-center gap-1">
            <ThumbButton
              type="up"
              active={feedback === "up"}
              onClick={() => onFeedback(item.url!, item.title, "up")}
            />
            <ThumbButton
              type="down"
              active={feedback === "down"}
              onClick={() => onFeedback(item.url!, item.title, "down")}
            />
          </div>
        )}
      </div>
    </article>
  );
}

function FeedSection({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/40">
        <span className="text-sm">{icon}</span>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

// ── Summary Digest ──
function DigestBanner({
  feed,
  feedWindow,
  range,
}: {
  feed: FeedData;
  feedWindow: string | null;
  range: FeedRange;
}) {
  const totalArticles =
    feed.tool_updates.length + feed.ai_trends.length;

  const companyName = feed.company_news?.company_name;
  const topTools = feed.company_news?.top_technologies?.slice(0, 3) || [];

  const timeLabel =
    range === "current" && feedWindow
      ? `${feedWindow} Edition`
      : range === "today"
        ? "Today's Digest"
        : range === "week"
          ? "Weekly Digest"
          : range === "month"
            ? "Monthly Digest"
            : "Latest Digest";

  // Build a quick summary sentence
  const toolCount = feed.tool_updates.length;
  const trendCount = feed.ai_trends.length;

  let summaryParts: string[] = [];
  if (toolCount > 0)
    summaryParts.push(`${toolCount} tool update${toolCount > 1 ? "s" : ""}`);
  if (trendCount > 0)
    summaryParts.push(
      `${trendCount} AI trend${trendCount > 1 ? "s" : ""}`
    );
  if (feed.learning_skills.length > 0)
    summaryParts.push(
      `${feed.learning_skills.length} learning recommendation${feed.learning_skills.length > 1 ? "s" : ""}`
    );

  if (totalArticles === 0) return null;

  return (
    <div className="mb-8 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          {timeLabel}
        </span>
        <span className="text-xs text-foreground/30">
          {totalArticles} article{totalArticles !== 1 ? "s" : ""}
        </span>
      </div>

      {companyName && (
        <p className="mt-2 text-sm text-foreground/70">
          <span className="font-semibold text-foreground/90">{companyName}</span>
          {topTools.length > 0 && (
            <span>
              {" "}· using {topTools.join(", ")}
              {(feed.company_news?.top_technologies?.length || 0) > 3 &&
                ` +${(feed.company_news?.top_technologies?.length || 0) - 3} more`}
            </span>
          )}
        </p>
      )}

      <p className="mt-2 text-sm text-foreground/50">
        We found {summaryParts.join(", ")} relevant to your company and
        interests.
      </p>
    </div>
  );
}

export default function FeedPage() {
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
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());

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

  // Load read articles + completed courses from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("arcticpulse_read");
      if (stored) setReadArticles(new Set(JSON.parse(stored)));
      const storedCourses = localStorage.getItem("arcticpulse_courses");
      if (storedCourses) setCompletedCourses(new Set(JSON.parse(storedCourses)));
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

  function toggleCourseComplete(courseTitle: string) {
    setCompletedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseTitle)) {
        next.delete(courseTitle);
      } else {
        next.add(courseTitle);
      }
      try { localStorage.setItem("arcticpulse_courses", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
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
    type: "up" | "down"
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

  const companyName = feed?.company_news?.company_name;

  // Filter articles by date based on active tab
  function filterByDate(items: FeedItem[]): FeedItem[] {
    if (activeRange === "current") return items; // Latest = no date filter

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return items.filter((item) => {
      if (!item.date) return true; // Keep items with no date
      try {
        const articleDate = new Date(item.date + "T23:59:59"); // End of that day
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

  // Apply date filter to feed sections
  const filteredFeed = feed ? {
    ...feed,
    tool_updates: filterByDate(feed.tool_updates),
    ai_trends: filterByDate(feed.ai_trends),
  } : null;

  return (
    <div className="min-h-screen bg-background">
      <FeedHeader
        companyName={companyName || undefined}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <main className="mx-auto max-w-2xl px-4 py-6 md:px-6">
        {/* Range Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-foreground/5 p-1">
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

            {/* Company Section */}
            {feed.company_news && (
              <FeedSection icon="📌" title="For Your Company">
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
                  />
                ))}
              </FeedSection>
            )}

            {/* Learning */}
            {feed.learning_skills.length > 0 && (
              <FeedSection icon="💡" title="Learning & Skills">
                {feed.learning_skills.map((item, i) => {
                  const courseKey = item.title;
                  const isCompleted = completedCourses.has(courseKey);
                  return (
                    <div
                      key={`learn-${i}`}
                      className={`rounded-xl border p-5 transition-all hover:border-foreground/15 ${
                        isCompleted
                          ? "border-green-500/20 bg-green-500/5 opacity-70"
                          : "border-foreground/8 bg-foreground/[0.02] hover:bg-foreground/[0.04]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${isCompleted ? "text-foreground/60 line-through" : "text-foreground/90"}`}>
                            {item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-400 transition-colors"
                              >
                                {item.title} ↗
                              </a>
                            ) : (
                              item.title
                            )}
                          </h3>
                          <p className="mt-1 text-sm text-foreground/55">
                            {item.summary}
                          </p>
                          {item.source && (
                            <p className="mt-2 text-xs text-foreground/30">
                              {item.source}
                            </p>
                          )}
                          {item.relevance_note && (
                            <p className="mt-1.5 text-xs text-blue-400 italic">
                              {item.relevance_note}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => toggleCourseComplete(courseKey)}
                          className={`mt-1 flex-shrink-0 rounded-full w-8 h-8 flex items-center justify-center text-sm transition-all ${
                            isCompleted
                              ? "bg-green-500/20 text-green-400 hover:bg-red-500/15 hover:text-red-400"
                              : "bg-foreground/5 text-foreground/30 hover:bg-green-500/15 hover:text-green-400"
                          }`}
                          title={isCompleted ? "Mark as not done" : "Mark as done"}
                        >
                          {isCompleted ? "✓" : "○"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-5 text-center">
                  <p className="text-sm font-medium text-blue-300">
                    Want structured AI training for your team?
                  </p>
                  <p className="mt-1 text-xs text-blue-400/60">
                    Explore ArcticMind Training →
                  </p>
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
                      href="/settings"
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
                  ? `${feedWindow} feed · ${new Date(generatedAt).toLocaleString()}`
                  : `Through ${new Date(generatedAt).toLocaleString()}`}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
