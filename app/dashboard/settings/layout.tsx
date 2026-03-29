import Link from "next/link";

export default function DashboardSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="border-b border-foreground/10 px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <h2 className="text-lg font-bold">Settings</h2>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard/settings"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              Profile
            </Link>
            <Link
              href="/dashboard/settings/company"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              Company
            </Link>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">{children}</div>
    </div>
  );
}
