"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface FeedHeaderProps {
  companyName?: string;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function FeedHeader({
  companyName,
  onRefresh,
  refreshing,
}: FeedHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-foreground/10 bg-background/95 backdrop-blur-sm px-4 py-3 md:px-6">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">ArcticPulse</h1>
          {companyName && (
            <span className="rounded-md bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground/60">
              {companyName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
            title="Refresh feed"
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
          <Link
            href="/settings"
            className="rounded-md px-3 py-1.5 text-sm text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-md px-3 py-1.5 text-sm text-foreground/50 transition-colors hover:text-foreground/70"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
