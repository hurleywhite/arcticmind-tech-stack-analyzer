import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Load latest cached feed
    const { data: latestFeed } = await supabase
      .from("news_feeds")
      .select("feed_data, generated_at")
      .eq("user_id", profile.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    // Load company data
    let companyContext = "";
    if (profile.company_domain) {
      const { data: companyData } = await supabase
        .from("company_intel_analyses")
        .select("company_name, tech_stack, summary")
        .eq("company_domain", profile.company_domain)
        .order("analyzed_at", { ascending: false })
        .limit(1)
        .single();

      if (companyData) {
        const techStack = companyData.tech_stack
          ? Object.values(companyData.tech_stack as Record<string, string[]>).flat().filter(Boolean).slice(0, 15)
          : [];
        companyContext = `
COMPANY CONTEXT:
- Name: ${companyData.company_name || profile.company_name || "Unknown"}
- Domain: ${profile.company_domain}
- Summary: ${companyData.summary || "No summary available"}
- Tech Stack: ${techStack.length > 0 ? techStack.join(", ") : "Not analyzed yet"}`;
      }
    }

    // Build article context
    let articleContext = "";
    if (latestFeed?.feed_data) {
      const fd = latestFeed.feed_data as Record<string, unknown>;
      const articles: { title: string; source?: string; date?: string; summary?: string; url?: string }[] = [];

      for (const item of (fd.tool_updates as Record<string, string>[]) || []) {
        articles.push(item);
      }
      for (const item of (fd.ai_trends as Record<string, string>[]) || []) {
        articles.push(item);
      }

      if (articles.length > 0) {
        articleContext = `
TODAY'S DIGEST (${articles.length} articles, generated ${new Date(latestFeed.generated_at).toLocaleString()}):
${articles.map((a, i) => `${i + 1}. "${a.title}" (${a.source || "unknown"}, ${a.date || "recent"}): ${a.summary || ""} ${a.url ? `[${a.url}]` : ""}`).join("\n")}`;
      }
    }

    // Build user profile context
    const profileContext = `
USER PROFILE:
- Name: ${profile.full_name || profile.email || "User"}
- Role: ${profile.role || "not set"}
- Seniority: ${profile.seniority || "not set"}
- AI Experience: ${profile.ai_experience_level || "not set"}
- Interests: ${(profile.ai_interests || []).join(", ") || "none set"}
- Goals: ${(profile.ai_goals || []).join(", ") || "none set"}
- Content Depth: ${profile.content_depth || "balanced"}
- Onboarding Completed: ${profile.onboarding_completed ? "yes" : "no"}`;

    // Determine mode
    const isOnboarding = !profile.onboarding_completed;
    const hasArticles = articleContext.length > 0;

    let systemPrompt: string;

    if (isOnboarding) {
      systemPrompt = `You are Pulse, ArcticPulse's setup assistant. Your job is to learn about this person so we can personalize their AI news feed.

Walk through these questions naturally — don't make it feel like a form:
1. What company do you work at? (get their company name or website domain)
2. What's your role? (e.g., Product Manager, Data Engineer, CEO)
3. What's your seniority level? Options: Executive, Founder, Director, Manager, Team Lead, Specialist
4. How experienced are you with AI? Options: beginner, intermediate, advanced, expert
5. What AI topics interest you most? Suggest: AI Coding & Dev Tools, AI Agents & Workflows, LLMs & Models, AI for Sales & Marketing, AI for Data & Analytics
6. What are you trying to do with AI? Suggest: Evaluate & compare AI tools, Automate internal workflows, Build AI-powered products, Train my team on AI, Stay current on AI trends
7. Do you prefer high-level strategy content, a balanced mix, or deep technical content?

After each answer, call the appropriate tool to save it. Confirm back what you heard before saving. When all fields are covered, call completeOnboarding().

Keep it conversational — 2-3 sentences max per turn. Be warm but efficient.`;
    } else {
      systemPrompt = `You are Pulse, the user's AI news briefing assistant for ArcticPulse.

${profileContext}
${companyContext}
${hasArticles ? articleContext : "\nNo articles loaded yet. Offer to help them refresh their feed or update their preferences."}

You can:
- Summarize today's digest highlights in 30 seconds
- Explain why specific articles matter for their role and company
- Answer questions about AI topics covered in today's articles
- Help them decide which articles to read first based on their priorities
- Give context on how news affects their tech stack or industry
- Save articles they like (call bookmarkArticle)
- Open articles for them (call openArticle)

Keep answers concise — 3-4 sentences for simple questions, more detail if they ask.
Reference specific articles by name when relevant.
Frame insights for their seniority level: ${profile.seniority || "professional"}.
If they ask about something not in the digest, say you'll note it for future feeds.
Don't make up information that's not in the digest.`;
    }

    return NextResponse.json({
      agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "",
      systemPrompt,
      mode: isOnboarding ? "onboarding" : "qa",
      hasArticles,
      userId: user.id,
      profile: {
        role: profile.role,
        seniority: profile.seniority,
        company_name: profile.company_name,
        company_domain: profile.company_domain,
        ai_experience_level: profile.ai_experience_level,
        ai_interests: profile.ai_interests,
        ai_goals: profile.ai_goals,
        content_depth: profile.content_depth,
        tooling_focus: profile.tooling_focus,
        onboarding_completed: profile.onboarding_completed,
      },
    });
  } catch (error) {
    console.error("Voice session error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create voice session" },
      { status: 500 }
    );
  }
}
