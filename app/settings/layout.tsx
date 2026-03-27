import Link from "next/link";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/feed"
              className="text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              ← Back to Feed
            </Link>
            <h1 className="text-lg font-bold">Settings</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/settings"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              Profile
            </Link>
            <Link
              href="/settings/company"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              Company
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}
