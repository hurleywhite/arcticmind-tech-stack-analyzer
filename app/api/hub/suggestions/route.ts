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

  // Load company tech stack
  let techStack = null;
  if (profile.company_domain) {
    const { data: company } = await supabase
      .from("company_intel_analyses")
      .select("tech_stack")
      .eq("company_domain", profile.company_domain)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .single();
    if (company?.tech_stack) techStack = company.tech_stack;
  }

  const suggestions = getMatchedHubItems(
    profile.role,
    profile.seniority,
    profile.ai_interests || [],
    profile.ai_goals || [],
    techStack,
    8
  );

  return NextResponse.json(suggestions);
}
