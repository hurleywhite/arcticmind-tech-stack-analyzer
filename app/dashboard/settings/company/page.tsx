"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TechStack } from "@/lib/types";

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

interface CompanyData {
  company_name: string;
  company_domain: string;
  tech_stack: TechStack;
  summary: string;
  jobs_analyzed: number;
  confidence: string;
}

export default function CompanySettingsPage() {
  const [companyDomain, setCompanyDomain] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("company_domain, company_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        setCompanyDomain(profile.company_domain || "");
        setCompanyName(profile.company_name || "");

        if (profile.company_domain) {
          const res = await fetch(
            `/api/company?domain=${encodeURIComponent(profile.company_domain)}`
          );
          if (res.ok) {
            const data = await res.json();
            setCompanyData(data);
          }
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleReanalyze() {
    if (!companyDomain) return;
    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyUrl: companyDomain }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await response.json();
      setCompanyData(data);
      setCompanyName(data.company || companyName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleChangeCompany() {
    const newDomain = prompt("Enter new company domain (e.g. snowflake.com):");
    if (!newDomain) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("user_profiles")
      .update({
        company_domain: newDomain.trim(),
        company_name: newDomain.trim(),
      })
      .eq("id", user.id);

    setCompanyDomain(newDomain.trim());
    setCompanyName(newDomain.trim());
    setCompanyData(null);

    setAnalyzing(true);
    try {
      const response = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyUrl: newDomain.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setCompanyData(data);
        setCompanyName(data.company || newDomain.trim());

        await supabase
          .from("user_profiles")
          .update({ company_name: data.company || newDomain.trim() })
          .eq("id", user.id);
      }
    } catch {
      // Non-blocking
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return <div className="text-center text-foreground/50">Loading...</div>;
  }

  const nonEmptyCategories = companyData
    ? (
        Object.entries(companyData.tech_stack) as [keyof TechStack, string[]][]
      ).filter(([, techs]) => techs.length > 0)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Company Settings</h2>
        <p className="mt-1 text-sm text-foreground/60">
          View and manage your company profile. This data drives your
          personalized feed.
        </p>
      </div>

      {/* Current company */}
      <div className="rounded-lg border border-foreground/10 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {companyName || companyDomain || "No company set"}
            </h3>
            {companyDomain && (
              <p className="text-sm text-foreground/50">{companyDomain}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReanalyze}
              disabled={analyzing || !companyDomain}
              className="rounded-md bg-foreground/5 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-foreground/10 disabled:opacity-50"
            >
              {analyzing ? "Analyzing..." : "Re-analyze"}
            </button>
            <button
              onClick={handleChangeCompany}
              className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm transition-colors hover:bg-foreground/5"
            >
              Change company
            </button>
          </div>
        </div>

        {companyData && (
          <>
            <p className="mt-3 text-sm text-foreground/70">
              {companyData.summary}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  companyData.confidence === "high"
                    ? "bg-green-100 text-green-700"
                    : companyData.confidence === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {companyData.confidence} confidence
              </span>
              <span className="text-xs text-foreground/40">
                {companyData.jobs_analyzed} jobs analyzed
              </span>
            </div>
          </>
        )}
      </div>

      {/* Tech stack grid */}
      {nonEmptyCategories.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground/50">
            Detected Tech Stack
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {nonEmptyCategories.map(([category, techs]) => (
              <div
                key={category}
                className="rounded-lg border border-foreground/10 p-3"
              >
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/40">
                  {CATEGORY_LABELS[category] || category}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {techs.map((tech) => (
                    <span
                      key={tech}
                      className="rounded bg-foreground/5 px-2 py-0.5 text-xs font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
