import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user's company domain
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("company_domain")
    .eq("id", user.id)
    .single();

  if (!profile?.company_domain) {
    return NextResponse.json({ prompts: [], tools: [], tasks: [] });
  }

  // RLS handles the filtering — shared=true, same company, hub_sharing_enabled
  // We just need to exclude our own items and join owner names
  const [promptsRes, toolsRes, tasksRes] = await Promise.all([
    supabase
      .from("hub_prompts")
      .select("*, user_profiles!hub_prompts_user_id_fkey(full_name, email)")
      .eq("shared", true)
      .neq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("hub_tools")
      .select("*, user_profiles!hub_tools_user_id_fkey(full_name, email)")
      .eq("shared", true)
      .neq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("hub_tasks")
      .select("*, user_profiles!hub_tasks_user_id_fkey(full_name, email)")
      .eq("shared", true)
      .neq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

  // Add owner_name from join
  const mapOwner = (items: Record<string, unknown>[]) =>
    (items || []).map((item) => {
      const profile = item.user_profiles as { full_name?: string; email?: string } | null;
      return {
        ...item,
        owner_name: profile?.full_name || profile?.email || "Teammate",
        user_profiles: undefined,
      };
    });

  return NextResponse.json({
    prompts: mapOwner(promptsRes.data || []),
    tools: mapOwner(toolsRes.data || []),
    tasks: mapOwner(tasksRes.data || []),
  });
}
