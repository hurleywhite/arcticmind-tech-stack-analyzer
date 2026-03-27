import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-foreground/10 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">ArcticPulse</span>
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-700">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/analyzer"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              Company Analyzer
            </Link>
            <Link
              href="/login"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            AI news that actually matters{" "}
            <span className="text-blue-600">for your work</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/60 md:text-xl">
            Enter your company, get a personalized AI news feed in 30 seconds.
            No questionnaires. No setup. Just intelligence tailored to your
            company&apos;s tech stack, industry, and AI maturity.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/analyzer"
              className="rounded-lg border border-foreground/20 px-8 py-3 text-base font-medium text-foreground/70 hover:bg-foreground/5 transition-colors"
            >
              Try Analyzer
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-foreground/10 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-bold md:text-3xl">
            Your feed. Your company. Your stack.
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-foreground/10 p-6">
              <div className="mb-3 text-2xl">📌</div>
              <h3 className="mb-2 font-semibold">Company Intel</h3>
              <p className="text-sm text-foreground/60">
                News specifically about or directly affecting your company.
                Partnerships, investments, and AI initiatives.
              </p>
            </div>
            <div className="rounded-xl border border-foreground/10 p-6">
              <div className="mb-3 text-2xl">🔧</div>
              <h3 className="mb-2 font-semibold">Tool Updates</h3>
              <p className="text-sm text-foreground/60">
                Updates about technologies your company actually uses. Snowflake
                update? You&apos;ll see it if your stack includes Snowflake.
              </p>
            </div>
            <div className="rounded-xl border border-foreground/10 p-6">
              <div className="mb-3 text-2xl">🤖</div>
              <h3 className="mb-2 font-semibold">AI Trends</h3>
              <p className="text-sm text-foreground/60">
                Broader AI news filtered by your interests and role. Framed for
                your seniority level — strategic, tactical, or hands-on.
              </p>
            </div>
            <div className="rounded-xl border border-foreground/10 p-6">
              <div className="mb-3 text-2xl">💡</div>
              <h3 className="mb-2 font-semibold">Learning & Skills</h3>
              <p className="text-sm text-foreground/60">
                AI training recommendations based on your company&apos;s AI
                readiness score. Relevant courses, not generic content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-foreground/10 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-8 text-2xl font-bold">Two-tap onboarding</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                1
              </div>
              <h3 className="mb-1 font-semibold">Enter your company</h3>
              <p className="text-sm text-foreground/60">
                Company name or URL. That&apos;s the only required field.
              </p>
            </div>
            <div>
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                2
              </div>
              <h3 className="mb-1 font-semibold">We analyze your company</h3>
              <p className="text-sm text-foreground/60">
                Tech stack, industry, AI tools, readiness score — all automatic.
              </p>
            </div>
            <div>
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                3
              </div>
              <h3 className="mb-1 font-semibold">Get your feed</h3>
              <p className="text-sm text-foreground/60">
                Personalized AI news refreshed every 8 hours. No noise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-foreground/10 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-sm text-foreground/40">
          <span>Powered by ArcticMind</span>
          <div className="flex gap-4">
            <Link href="/analyzer" className="hover:text-foreground/60">
              Company Analyzer
            </Link>
            <Link href="/pathfinder" className="hover:text-foreground/60">
              Pathfinder
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
