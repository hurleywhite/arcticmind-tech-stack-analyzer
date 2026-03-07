"use client";

import { useState } from "react";
import { TechStackResult, TechStack } from "@/lib/types";

const CATEGORY_LABELS: Record<keyof TechStack, string> = {
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

const CONFIDENCE_COLORS = {
  high: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-red-100 text-red-800",
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TechStackResult | null>(null);
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
      const response = await fetch("/api/analyze-stack", {
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
    ? (Object.entries(result.tech_stack) as [keyof TechStack, string[]][]).filter(
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
            ArcticMind Tech Stack Analyzer
          </h1>
          <p className="mt-2 text-foreground/60">
            Enter a company URL to infer their tech stack from public job
            listings
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. snowflake.com"
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
              Fetching job listings and analyzing tech stack...
            </p>
            <p className="mt-1 text-sm text-foreground/40">
              This typically takes 10-15 seconds
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
            {/* Summary Header */}
            <div className="rounded-lg border border-foreground/10 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{result.company}</h2>
                  <p className="text-sm text-foreground/50">{result.domain}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${CONFIDENCE_COLORS[result.confidence]}`}
                  >
                    {result.confidence} confidence
                  </span>
                  <span className="text-sm text-foreground/50">
                    {result.jobs_analyzed} jobs analyzed
                  </span>
                </div>
              </div>
              <p className="mt-4 text-foreground/70">{result.summary}</p>
              <p className="mt-2 text-sm text-foreground/40">
                {totalTechs} technologies identified across{" "}
                {nonEmptyCategories.length} categories
              </p>
            </div>

            {/* Tech Stack Categories */}
            <div className="grid gap-4 md:grid-cols-2">
              {nonEmptyCategories.map(([category, techs]) => (
                <div
                  key={category}
                  className="rounded-lg border border-foreground/10 p-4"
                >
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/50">
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {techs.map((tech) => (
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

            {/* Job Titles Sampled */}
            {result.job_titles_sampled.length > 0 && (
              <div className="rounded-lg border border-foreground/10 p-4">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/50">
                  Job Titles Sampled
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.job_titles_sampled.map((title, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-foreground/5 px-2.5 py-1 text-xs"
                    >
                      {title}
                    </span>
                  ))}
                </div>
              </div>
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

            {/* Timestamp */}
            <p className="text-center text-xs text-foreground/30">
              Analyzed at {new Date(result.last_analyzed).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
