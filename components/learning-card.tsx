"use client";

import { FeedItem } from "@/lib/feed-types";

export default function LearningCard({
  item,
  isCompleted,
  onToggle,
}: {
  item: FeedItem;
  isCompleted: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-xl border p-5 transition-all hover:border-foreground/15 ${
        isCompleted
          ? "border-green-500/20 bg-green-500/5 opacity-70"
          : "border-foreground/8 bg-foreground/[0.02] hover:bg-foreground/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3
            className={`font-semibold ${
              isCompleted
                ? "text-foreground/60 line-through"
                : "text-foreground/90"
            }`}
          >
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                {item.title} &nearr;
              </a>
            ) : (
              item.title
            )}
          </h3>
          <p className="mt-1 text-sm text-foreground/55">{item.summary}</p>
          {item.source && (
            <p className="mt-2 text-xs text-foreground/30">{item.source}</p>
          )}
          {item.relevance_note && (
            <p className="mt-1.5 text-xs text-blue-400 italic">
              {item.relevance_note}
            </p>
          )}
        </div>
        <button
          onClick={onToggle}
          className={`mt-1 flex-shrink-0 rounded-full w-8 h-8 flex items-center justify-center text-sm transition-all ${
            isCompleted
              ? "bg-green-500/20 text-green-400 hover:bg-red-500/15 hover:text-red-400"
              : "bg-foreground/5 text-foreground/30 hover:bg-green-500/15 hover:text-green-400"
          }`}
          title={isCompleted ? "Mark as not done" : "Mark as done"}
        >
          {isCompleted ? "\u2713" : "\u25CB"}
        </button>
      </div>
    </div>
  );
}
