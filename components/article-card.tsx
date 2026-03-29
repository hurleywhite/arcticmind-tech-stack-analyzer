"use client";

import { FeedItem } from "@/lib/feed-types";
import ThumbButton from "./thumb-button";

export default function ArticleCard({
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
          <span className="text-[10px] text-foreground/25">&check; read</span>
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
          {"\ud83d\udca1"} {item.relevance_note}
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
            {item.source} &nearr;
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
