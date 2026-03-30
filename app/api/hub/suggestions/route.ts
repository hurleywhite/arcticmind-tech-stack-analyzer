import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getMatchedHubItems } from "@/lib/hub-catalog";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Load user profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, seniority, ai_interests, ai_goals, company_domain")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ tools: [], prompts: [], tasks: [] });

  // Load company tech stack + article feedback in parallel
  const [companyRes, feedbackRes] = await Promise.all([
    profile.company_domain
      ? supabase
          .from("company_intel_analyses")
          .select("tech_stack")
          .eq("company_domain", profile.company_domain)
          .order("analyzed_at", { ascending: false })
          .limit(1)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("article_feedback")
      .select("article_title, source, category, feedback")
      .eq("user_id", user.id)
      .eq("feedback", "up")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const techStack = companyRes.data?.tech_stack || null;

  // Extract feedback signals from upvoted articles
  const upvotedArticles = feedbackRes.data || [];
  const upvotedSources = [...new Set(upvotedArticles.map((a) => a.source).filter(Boolean))] as string[];
  const upvotedCategories = [...new Set(upvotedArticles.map((a) => a.category).filter(Boolean))] as string[];
  // Extract keywords from upvoted titles (words 4+ chars, lowercase)
  const upvotedKeywords = [...new Set(
    upvotedArticles
      .map((a) => a.article_title || "")
      .join(" ")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .filter((w) => !["this", "that", "with", "from", "about", "their", "your", "will", "have", "been", "more", "than", "into", "also", "they", "what", "when", "were", "which"].includes(w))
  )];

  const suggestions = getMatchedHubItems(
    profile.role,
    profile.seniority,
    profile.ai_interests || [],
    profile.ai_goals || [],
    techStack,
    8,
    { upvotedSources, upvotedCategories, upvotedKeywords }
  );

  return NextResponse.json(suggestions);
}
