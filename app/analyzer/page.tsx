"use client";

import { useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  cloud_infrastructure: "Cloud & Infrastructure",
  data_engineering: "Data Engineering",
  backend: "Backend",
  frontend: "Frontend",
  mobile: "Mobile",
  devops_ci_cd: "DevOps & CI/CD",
  databases: "Databases",
  marketing_sales: "Marketing & Sales",
  design: "Design",
  project_management: "Project Management",
  ai_ml: "AI & ML",
  security: "Security",
  communication: "Communication",
  other: "Other",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-red-100 text-red-800",
};

interface AnalysisResult {
  company: string;
  domain: string;
  tech_stack: Record<string, string[]>;
  summary: string;
  jobs_analyzed: number;
  confidence: string;
  cached: boolean;
  enrichment_source?: string;
  products?: string[];
  services?: string[];
  industry?: string;
  competitors?: string[];
  recent_news?: string[];
  ai_adoption?: string;
  actionable_insights?: string[];
  employee_count_estimate?: string;
  founded_year?: string | null;
  headquarters?: string | null;
}

export default function AnalyzerPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyUrl: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Analysis failed");
        return;
      }

      setResult(data);
    } catch {
      setError("Failed to connect to the analysis API. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyJson() {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const nonEmptyCategories = result
    ? Object.entries(result.tech_stack).filter(
        ([, techs]) => techs.length > 0
      )
    : [];

  const totalTechs = nonEmptyCategories.reduce(
    (sum, [, techs]) => sum + techs.length,
    0
  );

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Company Analyzer
          </h1>
          <p className="mt-2 text-foreground/60">
            Enter a company name or URL to get a full company digest — tech
            stack, products, AI adoption, and actionable insights
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. snowflake.com or Cassidy AI"
              className="flex-1 rounded-lg border border-foreground/20 bg-background px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="mb-8 rounded-lg border border-foreground/10 p-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-foreground/60">
              Researching company profile, tech stack, and products...
            </p>
            <p className="mt-1 text-sm text-foreground/40">
              This typically takes 15-30 seconds
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-8 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Company Header */}
            <div className="rounded-lg border border-foreground/10 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{result.company}</h2>
                  <p className="text-sm text-foreground/50">{result.domain}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${CONFIDENCE_COLORS[result.confidence] || CONFIDENCE_COLORS.low}`}
                  >
                    {result.confidence} confidence
                  </span>
                  {result.enrichment_source && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                      {result.enrichment_source === "web_scrape"
                        ? "Web Research"
                        : "Jobs + Web"}
                    </span>
                  )}
                  {result.jobs_analyzed > 0 && (
                    <span className="text-sm text-foreground/50">
                      {result.jobs_analyzed} jobs analyzed
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-4 text-foreground/70 leading-relaxed">
                {result.summary}
              </p>

              {/* Quick Facts */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-foreground/50">
                {result.industry && (
                  <span>
                    🏢 {result.industry}
                  </span>
                )}
                {result.headquarters && (
                  <span>
                    📍 {result.headquarters}
                  </span>
                )}
                {result.founded_year && (
                  <span>
                    📅 Founded {result.founded_year}
                  </span>
                )}
                {result.employee_count_estimate &&
                  result.employee_count_estimate !== "unknown" && (
                    <span>
                      👥 {result.employee_count_estimate} employees
                    </span>
                  )}
              </div>
            </div>

            {/* AI Adoption */}
            {result.ai_adoption && result.ai_adoption !== "Unknown" && (
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-purple-400">
                  AI Adoption
                </h3>
                <p className="text-foreground/70">{result.ai_adoption}</p>
              </div>
            )}

            {/* Products & Services */}
            {((result.products && result.products.length > 0) ||
              (result.services && result.services.length > 0)) && (
              <div className="rounded-lg border border-foreground/10 p-5">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/50">
                  Products & Services
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.products?.map((p, i) => (
                    <span
                      key={`p-${i}`}
                      className="rounded-md bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-400"
                    >
                      {p}
                    </span>
                  ))}
                  {result.services?.map((s, i) => (
                    <span
                      key={`s-${i}`}
                      className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable Insights */}
            {result.actionable_insights &&
              result.actionable_insights.length > 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-400">
                    Actionable Insights
                  </h3>
                  <ul className="space-y-2">
                    {result.actionable_insights.map((insight, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-foreground/70"
                      >
                        <span className="mt-0.5 text-amber-400">→</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Recent News */}
            {result.recent_news && result.recent_news.length > 0 && (
              <div className="rounded-lg border border-foreground/10 p-5">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/50">
                  Recent News
                </h3>
                <ul className="space-y-2">
                  {result.recent_news.map((news, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground/60"
                    >
                      <span className="mt-0.5">📰</span>
                      {news}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Competitors */}
            {result.competitors && result.competitors.length > 0 && (
              <div className="rounded-lg border border-foreground/10 p-5">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/50">
                  Key Competitors
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.competitors.map((c, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-foreground/5 px-3 py-1.5 text-sm font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tech Stack Categories */}
            {nonEmptyCategories.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Tech Stack</h3>
                  <p className="text-sm text-foreground/40">
                    {totalTechs} technologies across{" "}
                    {nonEmptyCategories.length} categories
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {nonEmptyCategories.map(([category, techs]) => (
                    <div
                      key={category}
                      className="rounded-lg border border-foreground/10 p-4"
                    >
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/50">
                        {CATEGORY_LABELS[category] || category}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {techs.map((tech: string) => (
                          <span
                            key={tech}
                            className="rounded-md bg-foreground/5 px-2.5 py-1 text-sm font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* JSON Toggle + Copy */}
            <div className="rounded-lg border border-foreground/10 p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowJson(!showJson)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {showJson ? "Hide" : "Show"} Raw JSON
                </button>
                <button
                  onClick={copyJson}
                  className="rounded-md bg-foreground/5 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-foreground/10"
                >
                  {copied ? "Copied!" : "Copy JSON"}
                </button>
              </div>
              {showJson && (
                <pre className="mt-4 max-h-96 overflow-auto rounded-md bg-foreground/5 p-4 font-mono text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
