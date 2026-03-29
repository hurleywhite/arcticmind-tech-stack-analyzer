"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TechStack } from "@/lib/types";

const AI_INTERESTS = [
  "AI Coding Tools",
  "AI Agents & Automation",
  "Data & Analytics",
  "AI in {industry}",
  "LLMs & Prompting",
  "AI Governance & Ethics",
  "Computer Vision",
  "AI for Business/GTM",
];

const SENIORITY_OPTIONS = [
  "Executive",
  "Founder",
  "Director",
  "Manager",
  "Team Lead",
  "Specialist",
];

const CATEGORY_LABELS: Record<string, string> = {
  cloud_infrastructure: "Cloud",
  data_engineering: "Data",
  backend: "Backend",
  frontend: "Frontend",
  mobile: "Mobile",
  devops_ci_cd: "DevOps",
  databases: "Databases",
  marketing_sales: "Marketing",
  design: "Design",
  project_management: "PM",
  ai_ml: "AI/ML",
  security: "Security",
  communication: "Comms",
  other: "Other",
};

interface CompanyAnalysis {
  company: string;
  domain: string;
  tech_stack: TechStack;
  summary: string;
  jobs_analyzed: number;
  confidence: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = checking, 1 = signup, 2 = company, 3 = interests
  const [existingUser, setExistingUser] = useState(false);

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyInput, setCompanyInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Step 2: Company confirmation
  const [companyData, setCompanyData] = useState<CompanyAnalysis | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  // Step 3: Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [role, setRole] = useState("");
  const [seniority, setSeniority] = useState("");
  const [learningFocus, setLearningFocus] = useState("");
  const [saving, setSaving] = useState(false);

  // Derived industry
  const industry = companyData?.summary
    ? extractIndustry(companyData.summary)
    : "";

  function extractIndustry(summary: string): string {
    const patterns = [
      /(?:is a|is an)\s+([^.]+?)\s+company/i,
      /(?:in the|in)\s+([^.]+?)\s+(?:industry|sector|space)/i,
    ];
    for (const pattern of patterns) {
      const match = summary.match(pattern);
      if (match) return match[1].trim();
    }
    return "Your Industry";
  }

  // On mount: check if user is already logged in
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Already logged in — check if they have a profile
        setExistingUser(true);
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile?.onboarding_completed) {
          // Fully onboarded — go to feed
          router.push("/dashboard/news");
          return;
        }

        if (profile?.company_domain) {
          // Has profile with company — skip to step 2 or 3
          setCompanyInput(profile.company_name || profile.company_domain);
          // Try to load company analysis
          analyzeCompany(profile.company_domain);
          setStep(2);
        } else {
          // Has account but no company — show company input
          setStep(1);
        }
      } else {
        // Not logged in — show signup
        setStep(1);
      }
    }
    checkAuth();
  }, [router]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const supabase = createClient();

    let domain = companyInput.trim();
    domain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
    domain = domain.split("/")[0].split("?")[0];
    if (!domain.includes(".")) {
      domain = domain.toLowerCase().replace(/\s+/g, "") + ".com";
    }

    if (existingUser) {
      // Already logged in — just update profile with company
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("user_profiles")
          .update({
            company_domain: domain,
            company_name: companyInput.trim(),
          })
          .eq("id", user.id);

        setAuthLoading(false);
        setStep(2);
        analyzeCompany(domain);
        return;
      }
    }

    // New user signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // If user already exists, try to sign in instead
      if (error.message.includes("already registered")) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setAuthError(signInError.message);
          setAuthLoading(false);
          return;
        }
        // Signed in — update profile
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("user_profiles")
            .upsert(
              {
                id: user.id,
                email,
                company_domain: domain,
                company_name: companyInput.trim(),
              },
              { onConflict: "id" }
            );

          setExistingUser(true);
          setAuthLoading(false);
          setStep(2);
          analyzeCompany(domain);
          return;
        }
      }
      setAuthError(error.message);
      setAuthLoading(false);
      return;
    }

    if (!data.user) {
      setAuthError("Signup failed. Please try again.");
      setAuthLoading(false);
      return;
    }

    // Create user profile — id column IS the auth user id
    await supabase.from("user_profiles").upsert(
      {
        id: data.user.id,
        email,
        company_domain: domain,
        company_name: companyInput.trim(),
      },
      { onConflict: "id" }
    );

    setAuthLoading(false);
    setStep(2);
    analyzeCompany(domain);
  }

  async function analyzeCompany(domain: string) {
    setCompanyLoading(true);
    setCompanyError(null);

    try {
      const response = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyUrl: domain }),
      });

      if (!response.ok) {
        const data = await response.json();
        setCompanyError(
          data.error || "Could not analyze company. You can skip this step."
        );
        setCompanyLoading(false);
        return;
      }

      const data = await response.json();
      setCompanyData(data);
    } catch {
      setCompanyError(
        "Analysis failed. You can continue — we'll try again later."
      );
    } finally {
      setCompanyLoading(false);
    }
  }

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

  async function completeOnboarding() {
    setSaving(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const resolvedInterests = selectedInterests.map((i) =>
      i === "AI in {industry}" ? `AI in ${industry || "Your Industry"}` : i
    );

    await supabase
      .from("user_profiles")
      .update({
        ai_interests: resolvedInterests,
        role: role || null,
        seniority: seniority || null,
        custom_learning_focus: learningFocus || null,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    setSaving(false);
    router.push("/dashboard/news");
    router.refresh();
  }

  // Get techs for display
  const allTechs = companyData
    ? Object.entries(companyData.tech_stack)
        .flatMap(([, techs]) => techs as string[])
        .filter((t) => t)
    : [];
  const topTechs = allTechs.slice(0, 12);
  const extraCount = allTechs.length - topTechs.length;
  const techCategories = companyData
    ? (
        Object.entries(companyData.tech_stack) as [keyof TechStack, string[]][]
      ).filter(([, techs]) => techs.length > 0)
    : [];

  // Loading check on mount
  if (step === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-foreground/50">Checking your account...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold">
            ArcticPulse
          </Link>
          <div className="mt-4 flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-12 rounded-full transition-colors ${
                  s <= step ? "bg-blue-600" : "bg-foreground/10"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-foreground/40">Step {step} of 3</p>
        </div>

        {/* Step 1: Account Creation (or company input for existing users) */}
        {step === 1 && (
          <form onSubmit={handleSignup} className="space-y-4">
            <h2 className="text-xl font-bold">
              {existingUser ? "Set up your feed" : "Create your account"}
            </h2>
            <p className="text-sm text-foreground/60">
              {existingUser
                ? "Enter your company to get personalized AI news."
                : "Enter your email and company to get started."}
            </p>

            {!existingUser && (
              <>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium text-foreground/70"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1 block text-sm font-medium text-foreground/70"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="company"
                className="mb-1 block text-sm font-medium text-foreground/70"
              >
                What company do you work at?
              </label>
              <input
                id="company"
                type="text"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                placeholder="e.g. snowflake.com or Snowflake"
                required
                className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="mt-1 text-xs text-foreground/40">
                Company name or website URL
              </p>
            </div>

            {authError && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {authLoading
                ? "Setting up..."
                : existingUser
                  ? "Continue"
                  : "Get Started"}
            </button>

            {!existingUser && (
              <p className="text-center text-sm text-foreground/50">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Log in
                </Link>
              </p>
            )}
          </form>
        )}

        {/* Step 2: Company Confirmation */}
        {step === 2 && (
          <div className="space-y-4">
            {companyLoading ? (
              <div className="rounded-xl border border-foreground/10 p-8 text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <p className="font-medium">Analyzing your company...</p>
                <p className="mt-1 text-sm text-foreground/50">
                  Scanning job listings and detecting tech stack
                </p>
              </div>
            ) : companyData ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-green-200 bg-green-50 p-1">
                  <div className="rounded-lg bg-white p-5">
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-green-700">
                      <span>✓</span> We found your company
                    </div>
                    <h3 className="text-xl font-bold">{companyData.company}</h3>
                    <p className="mt-1 text-sm text-foreground/50">
                      {companyData.domain}
                    </p>
                    <p className="mt-3 text-sm text-foreground/70">
                      {companyData.summary}
                    </p>

                    {topTechs.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/40">
                          Tech we detected
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {topTechs.map((tech) => (
                            <span
                              key={tech}
                              className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                            >
                              {tech}
                            </span>
                          ))}
                          {extraCount > 0 && (
                            <span className="rounded-md bg-foreground/5 px-2 py-0.5 text-xs text-foreground/40">
                              +{extraCount} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {techCategories.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
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
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setStep(3)}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Looks right →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-center">
                  <p className="font-medium text-yellow-800">
                    {companyError ||
                      "We couldn't find detailed data for this company."}
                  </p>
                  <p className="mt-1 text-sm text-yellow-700">
                    No worries — your feed will still work. We&apos;ll use what
                    we know.
                  </p>
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Interests & Role */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Quick interests</h2>
              <p className="mt-1 text-sm text-foreground/60">
                What AI topics interest you? Pick any that apply.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {AI_INTERESTS.map((interest) => {
                const label =
                  interest === "AI in {industry}"
                    ? `AI in ${industry || "Your Industry"}`
                    : interest;
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-foreground/15 text-foreground/70 hover:border-foreground/30"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div>
              <label
                htmlFor="role"
                className="mb-1 block text-sm font-medium text-foreground/70"
              >
                Your role (optional)
              </label>
              <input
                id="role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Data Engineer, Product Manager"
                className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="seniority"
                className="mb-1 block text-sm font-medium text-foreground/70"
              >
                Seniority (optional)
              </label>
              <select
                id="seniority"
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-2.5 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select...</option>
                {SENIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="learningFocus"
                className="mb-1 block text-sm font-medium text-foreground/70"
              >
                Anything specific you want to learn about? (optional)
              </label>
              <textarea
                id="learningFocus"
                value={learningFocus}
                onChange={(e) => setLearningFocus(e.target.value)}
                placeholder="e.g. How to use AI agents for automating data pipelines, or how LLMs can help with compliance..."
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={completeOnboarding}
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Start reading →"}
              </button>
              <button
                onClick={completeOnboarding}
                disabled={saving}
                className="rounded-lg border border-foreground/20 px-4 py-3 text-sm text-foreground/60 transition-colors hover:bg-foreground/5"
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
