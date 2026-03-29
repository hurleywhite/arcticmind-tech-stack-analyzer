"use client";

export default function SkeletonCard() {
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
