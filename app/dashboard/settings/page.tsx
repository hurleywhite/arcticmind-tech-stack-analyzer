"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const AI_INTERESTS = [
  "AI Coding Tools",
  "AI Agents & Automation",
  "Data & Analytics",
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

const AI_EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner", desc: "Just starting to explore AI tools" },
  { value: "intermediate", label: "Intermediate", desc: "Use AI tools regularly, learning more" },
  { value: "advanced", label: "Advanced", desc: "Build with AI APIs, fine-tune workflows" },
  { value: "expert", label: "Expert", desc: "Deep AI/ML experience, build AI systems" },
];

const CONTENT_DEPTH_OPTIONS = [
  { value: "high_level", label: "High-Level", desc: "Strategy, trends, what matters & why" },
  { value: "balanced", label: "Balanced", desc: "Mix of strategy and hands-on" },
  { value: "deep_technical", label: "Deep Technical", desc: "Code, architecture, implementation details" },
];

const TOOLING_FOCUS_OPTIONS = [
  { value: "strategy_first", label: "Strategy First", desc: "Business impact, ROI, adoption trends" },
  { value: "balanced", label: "Balanced", desc: "Both strategy and tooling" },
  { value: "tools_first", label: "Tools First", desc: "New tools, releases, integrations, how-tos" },
];

const AI_GOALS = [
  "Automate repetitive work",
  "Build AI-powered products",
  "Improve team productivity",
  "Stay ahead of AI trends",
  "Evaluate AI vendors/tools",
  "Upskill my team on AI",
  "AI governance & compliance",
  "Data pipeline automation",
];

export default function SettingsPage() {
  const [role, setRole] = useState("");
  const [seniority, setSeniority] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [learningFocus, setLearningFocus] = useState("");
  const [aiExperience, setAiExperience] = useState("");
  const [contentDepth, setContentDepth] = useState("");
  const [toolingFocus, setToolingFocus] = useState("");
  const [aiGoals, setAiGoals] = useState<string[]>([]);
  const [articleCount, setArticleCount] = useState(8);
  const [hubSharingEnabled, setHubSharingEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setRole(data.role || "");
        setSeniority(data.seniority || "");
        setInterests(data.ai_interests || []);
        setLearningFocus(data.custom_learning_focus || "");
        setAiExperience(data.ai_experience_level || "");
        setContentDepth(data.content_depth || "");
        setToolingFocus(data.tooling_focus || "");
        setAiGoals(data.ai_goals || []);
        setArticleCount(data.article_count || 8);
        setHubSharingEnabled(data.hub_sharing_enabled || false);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

  function toggleGoal(goal: string) {
    setAiGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal]
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("user_profiles")
      .update({
        role: role || null,
        seniority: seniority || null,
        ai_interests: interests,
        custom_learning_focus: learningFocus || null,
        ai_experience_level: aiExperience || null,
        content_depth: contentDepth || null,
        tooling_focus: toolingFocus || null,
        ai_goals: aiGoals,
        article_count: articleCount,
        hub_sharing_enabled: hubSharingEnabled,
      })
      .eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return <div className="text-center text-foreground/50">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">Profile Settings</h2>
        <p className="mt-1 text-sm text-foreground/60">
          The more we know about you, the better your news feed and learning recommendations get.
        </p>
      </div>

      {/* --- About You --- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/40">About You</h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/70">
            Your role
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Data Engineer, Product Manager"
            className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/70">
            Seniority
          </label>
          <select
            value={seniority}
            onChange={(e) => setSeniority(e.target.value)}
            className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-2.5 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Select...</option>
            {SENIORITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </section>

      {/* --- AI Experience --- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/40">Your AI Experience</h3>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/70">
            How advanced are you with AI?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {AI_EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setAiExperience(level.value)}
                className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                  aiExperience === level.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-foreground/15 text-foreground/70 hover:border-foreground/30"
                }`}
              >
                <div className="text-sm font-medium">{level.label}</div>
                <div className="mt-0.5 text-xs opacity-70">{level.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* --- Content Preferences --- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/40">Content Preferences</h3>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/70">
            What depth of content do you prefer?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CONTENT_DEPTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setContentDepth(opt.value)}
                className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                  contentDepth === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-foreground/15 text-foreground/70 hover:border-foreground/30"
                }`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="mt-0.5 text-xs opacity-70">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/70">
            Do you care more about tools or strategy?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TOOLING_FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setToolingFocus(opt.value)}
                className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                  toolingFocus === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-foreground/15 text-foreground/70 hover:border-foreground/30"
                }`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="mt-0.5 text-xs opacity-70">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* --- Daily Articles --- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/40">Daily Articles</h3>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/70">
            How many articles per feed refresh?
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={5}
              max={15}
              value={articleCount}
              onChange={(e) => setArticleCount(Number(e.target.value))}
              className="flex-1 accent-blue-600"
            />
            <span className="min-w-[3rem] rounded-lg border border-foreground/15 px-3 py-1.5 text-center text-sm font-semibold">
              {articleCount}
            </span>
          </div>
          <p className="mt-1 text-xs text-foreground/40">
            5 = quick scan &middot; 8 = balanced (default) &middot; 15 = deep dive
          </p>
        </div>

        {/* Team sharing toggle */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/70">
            Tooling Hub Sharing
          </label>
          <button
            type="button"
            onClick={() => setHubSharingEnabled(!hubSharingEnabled)}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors w-full text-left ${
              hubSharingEnabled
                ? "border-emerald-500/30 bg-emerald-500/5 text-foreground/80"
                : "border-foreground/15 text-foreground/50"
            }`}
          >
            <span className={`flex h-5 w-9 items-center rounded-full transition-colors ${hubSharingEnabled ? "bg-emerald-500" : "bg-foreground/20"}`}>
              <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${hubSharingEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </span>
            <span>Share my hub items with my team</span>
          </button>
          <p className="mt-1 text-xs text-foreground/40">
            When enabled, items you mark as shared will be visible to teammates at your company.
          </p>
        </div>
      </section>

      {/* --- AI Interests --- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/40">AI Topics</h3>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/70">
            What AI topics interest you?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {AI_INTERESTS.map((interest) => {
              const isSelected = interests.includes(interest);
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
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- AI Goals --- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/40">What are you trying to do with AI?</h3>

        <div className="grid grid-cols-2 gap-2">
          {AI_GOALS.map((goal) => {
            const isSelected = aiGoals.includes(goal);
            return (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-foreground/15 text-foreground/70 hover:border-foreground/30"
                }`}
              >
                {goal}
              </button>
            );
          })}
        </div>
      </section>

      {/* --- Free text --- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/40">Anything Else?</h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/70">
            What else would you like to learn about?
          </label>
          <p className="mb-2 text-xs text-foreground/40">
            Describe any specific AI topics, use cases, or skills you&apos;re curious about.
          </p>
          <textarea
            value={learningFocus}
            onChange={(e) => setLearningFocus(e.target.value)}
            placeholder="e.g. I want to learn how to use AI agents for automating data pipeline monitoring..."
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
          <p className="mt-1 text-right text-xs text-foreground/30">
            {learningFocus.length}/500
          </p>
        </div>
      </section>

      {/* --- Save --- */}
      <div className="flex items-center gap-3 border-t border-foreground/10 pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && (
          <span className="text-sm text-green-600">
            Saved! Your feed and learning recommendations will reflect these changes on next refresh.
          </span>
        )}
      </div>
    </div>
  );
}
