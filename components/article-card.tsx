"use client";

import { FeedItem } from "@/lib/feed-types";
import ThumbButton from "./thumb-button";

export default function ArticleCard({
  item,
  feedback,
  onFeedback,
  isRead,
  onRead,
  isBookmarked,
  onBookmark,
}: {
  item: FeedItem;
  feedback: string | null;
  onFeedback: (url: string, title: string, type: "up" | "down", source?: string, category?: string) => void;
  isRead?: boolean;
  onRead?: (url: string) => void;
  isBookmarked?: boolean;
  onBookmark?: (item: FeedItem) => void;
}) {
  return (
    <article className={`group rounded-xl border p-5 transition-all hover:border-foreground/20 hover:bg-foreground/[0.04] ${
      isRead
        ? "border-foreground/10 bg-foreground/[0.01] opacity-80"
        : "border-foreground/15 bg-foreground/[0.02]"
    }`}>
      <div className="mb-2 flex items-center gap-2">
        {item.category && (
          <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-blue-500">
            {item.category}
          </span>
        )}
        {item.date && (
          <span className="text-xs text-foreground/60">{item.date}</span>
        )}
        {isRead && (
          <span className="text-[10px] text-foreground/40">{"\u2713"} read</span>
        )}
      </div>

      <h3 className={`mb-2 text-[15px] leading-snug ${isRead ? "font-medium text-foreground/80" : "font-semibold text-foreground"}`}>
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 transition-colors"
            onClick={() => onRead?.(item.url!)}
          >
            {item.title}
          </a>
        ) : (
          item.title
        )}
      </h3>

      <p className="text-sm leading-relaxed text-foreground/85">
        {item.summary}
      </p>

      {item.relevance_note && (
        <p className="mt-2.5 rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-500 leading-relaxed">
          {"\ud83d\udca1"} {item.relevance_note}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        {item.url && item.source && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-foreground/60 hover:text-foreground/80 transition-colors"
          >
            {item.source} ↗
          </a>
        )}
        {item.url && (
          <div className="flex items-center gap-1">
            {onBookmark && (
              <button
                onClick={() => onBookmark(item)}
                className={`rounded-md px-2 py-1 text-sm transition-colors ${
                  isBookmarked
                    ? "text-amber-400"
                    : "text-foreground/25 hover:text-amber-400/70"
                }`}
                title={isBookmarked ? "Remove bookmark" : "Save for later"}
              >
                {isBookmarked ? "\u2605" : "\u2606"}
              </button>
            )}
            <ThumbButton
              type="up"
              active={feedback === "up"}
              onClick={() => onFeedback(item.url!, item.title, "up", item.source, item.category)}
            />
            <ThumbButton
              type="down"
              active={feedback === "down"}
              onClick={() => onFeedback(item.url!, item.title, "down", item.source, item.category)}
            />
          </div>
        )}
      </div>
    </article>
  );
}
