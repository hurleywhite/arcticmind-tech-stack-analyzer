"use client";

import { FeedData } from "@/lib/feed-types";

type FeedRange = "current" | "today" | "week" | "month";

export default function DigestBanner({
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
              {" "}&middot; using {topTools.join(", ")}
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
