import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-foreground/10 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.avif"
              alt="ArcticPulse"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="text-xl font-bold">ArcticPulse</span>
            <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-400">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-4">
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
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-blue-400">
            Your company. Your stack. Your feed.
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            One place to stay sharp{" "}
            <span className="text-blue-500">on AI</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/50 md:text-xl leading-relaxed">
            ArcticPulse scans your company&apos;s tech stack, then delivers a
            daily feed of news, tools, and learning paths matched to your role
            and goals. Not generic AI hype — actionable intelligence.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/analyzer"
              className="rounded-lg border border-foreground/15 px-8 py-3.5 text-base font-medium text-foreground/60 hover:bg-foreground/5 transition-colors"
            >
              Scan a Company
            </Link>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="border-t border-foreground/10 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-2xl font-bold md:text-3xl">
            Four modules, one workspace
          </h2>
          <p className="mx-auto mb-14 max-w-xl text-center text-foreground/45">
            Each one learns from the others. Upvote a news article — your
            tooling suggestions sharpen. Add a tool — your feed adapts.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-blue-500/15 bg-blue-500/[0.03] p-7">
              <div className="mb-3 text-2xl">📰</div>
              <h3 className="mb-2 text-lg font-semibold">News Feed</h3>
              <p className="text-sm leading-relaxed text-foreground/55">
                Daily AI news filtered by your company, tech stack, role, and
                seniority. Executives get strategy. Engineers get implementation.
                Everyone gets signal, not noise.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-7">
              <div className="mb-3 text-2xl">💡</div>
              <h3 className="mb-2 text-lg font-semibold">Learning Hub</h3>
              <p className="text-sm leading-relaxed text-foreground/55">
                Courses and resources matched to where you actually are — not
                where a generic quiz says you are. Track progress, pick up where
                you left off.
              </p>
            </div>
            <div className="rounded-xl border border-purple-500/15 bg-purple-500/[0.03] p-7">
              <div className="mb-3 text-2xl">🛠️</div>
              <h3 className="mb-2 text-lg font-semibold">Tooling Hub</h3>
              <p className="text-sm leading-relaxed text-foreground/55">
                Prompts, tools, and workflows suggested based on your stack and
                goals. Save what works, share with your team, build a library
                that compounds.
              </p>
            </div>
            <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.03] p-7">
              <div className="mb-3 text-2xl">🔍</div>
              <h3 className="mb-2 text-lg font-semibold">Company Analyzer</h3>
              <p className="text-sm leading-relaxed text-foreground/55">
                Enter any company — get their tech stack, AI adoption signals,
                competitors, and actionable insights. Works for Fortune 500s
                and 10-person startups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-foreground/10 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-10 text-2xl font-bold">Set up in under a minute</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold text-blue-400">
                1
              </div>
              <h3 className="mb-1 font-semibold">Enter your company</h3>
              <p className="text-sm text-foreground/45">
                Domain or name. We detect the rest.
              </p>
            </div>
            <div>
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold text-blue-400">
                2
              </div>
              <h3 className="mb-1 font-semibold">Pick your interests</h3>
              <p className="text-sm text-foreground/45">
                Role, AI experience, and what you care about. Takes 15 seconds.
              </p>
            </div>
            <div>
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold text-blue-400">
                3
              </div>
              <h3 className="mb-1 font-semibold">Open your feed</h3>
              <p className="text-sm text-foreground/45">
                News, learning, and tools — all tailored. Gets smarter the more
                you use it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-foreground/10 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">
            Stop scrolling generic AI newsletters
          </h2>
          <p className="mb-8 text-foreground/45">
            Get a feed that knows your company, your role, and your goals.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-lg bg-blue-600 px-10 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-foreground/10 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-sm text-foreground/30">
          <span>Built by ArcticMind</span>
          <div className="flex gap-4">
            <Link href="/analyzer" className="hover:text-foreground/50">
              Company Analyzer
            </Link>
            <Link href="/pathfinder" className="hover:text-foreground/50">
              Pathfinder
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
