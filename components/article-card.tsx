"use client";

import { FeedItem } from "@/lib/feed-types";
import ThumbButton from "./thumb-button";

function getCategoryColor(category: string): string {
  const cat = category.toLowerCase();

  // Breaking news / major announcements
  if (cat.includes("breaking") || cat.includes("announcement") || cat.includes("launch") || cat.includes("release"))
    return "bg-red-500/15 text-red-500";

  // Regulation, policy, governance, compliance
  if (cat.includes("regulat") || cat.includes("policy") || cat.includes("governance") || cat.includes("compliance") || cat.includes("ethics"))
    return "bg-amber-500/15 text-amber-500";

  // Tool updates, product updates
  if (cat.includes("tool") || cat.includes("update") || cat.includes("product") || cat.includes("integration"))
    return "bg-cyan-500/15 text-cyan-500";

  // Adoption, transformation, enterprise, case study
  if (cat.includes("adoption") || cat.includes("transformation") || cat.includes("enterprise") || cat.includes("case stud") || cat.includes("deployment"))
    return "bg-emerald-500/15 text-emerald-500";

  // Research, reports, data, statistics
  if (cat.includes("research") || cat.includes("report") || cat.includes("statistic") || cat.includes("survey") || cat.includes("study"))
    return "bg-violet-500/15 text-violet-500";

  // Strategy, leadership, business
  if (cat.includes("strateg") || cat.includes("leadership") || cat.includes("business") || cat.includes("investment") || cat.includes("funding"))
    return "bg-orange-500/15 text-orange-500";

  // Agentic AI, agents, automation
  if (cat.includes("agent") || cat.includes("automat") || cat.includes("workflow"))
    return "bg-pink-500/15 text-pink-500";

  // Industry-specific (AI in X)
  if (cat.includes("ai in ") || cat.includes("industry") || cat.includes("sector") || cat.includes("healthcare") || cat.includes("finance"))
    return "bg-teal-500/15 text-teal-500";

  // Tutorial, how-to, guide, implementation
  if (cat.includes("tutorial") || cat.includes("how-to") || cat.includes("guide") || cat.includes("implement") || cat.includes("practical"))
    return "bg-indigo-500/15 text-indigo-500";

  // Technology (general AI/ML/LLM)
  if (cat.includes("technolog") || cat.includes("ai ") || cat.includes("model") || cat.includes("llm") || cat.includes("machine learning"))
    return "bg-blue-500/15 text-blue-500";

  // Default
  return "bg-blue-500/15 text-blue-500";
}

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
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${getCategoryColor(item.category)}`}>
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

      <h3 className={`mb-2 text-[15px] font-semibold leading-snug ${isRead ? "text-foreground/80" : "text-foreground"}`}>
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
