"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { label: "News Feed", href: "/dashboard/news", icon: "📰" },
  { label: "Learning", href: "/dashboard/learn", icon: "💡" },
  { label: "Tooling Hub", href: "/dashboard/hub", icon: "🛠️" },
  { label: "Analyzer", href: "/dashboard/analyzer", icon: "🔍" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙️" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompanyName() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("company_name")
        .eq("id", user.id)
        .single();

      if (profile?.company_name) {
        setCompanyName(profile.company_name);
      }
    }
    loadCompanyName();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-foreground/10 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
          {/* Left: Logo + company badge */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard/news" className="text-lg font-bold">
              ArcticPulse
            </Link>
            {companyName && (
              <span className="rounded-md bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground/60">
                {companyName}
              </span>
            )}
          </div>

          {/* Center: Tabs */}
          <nav className="flex items-center gap-1 rounded-xl bg-foreground/5 p-1">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive(tab.href)
                    ? "bg-background text-foreground shadow-sm"
                    : "text-foreground/40 hover:text-foreground/60"
                }`}
              >
                <span className="text-xs">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right: Sign out */}
          <button
            onClick={handleSignOut}
            className="rounded-md px-3 py-1.5 text-sm text-foreground/50 transition-colors hover:text-foreground/70"
          >
            Sign out
          </button>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
