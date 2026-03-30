import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, item } = body;

  if (!type || !item) {
    return NextResponse.json({ error: "type and item are required" }, { status: 400 });
  }

  if (type === "tool") {
    const { data, error } = await supabase
      .from("hub_tools")
      .insert({
        user_id: user.id,
        name: item.name,
        description: item.description || null,
        url: item.url || null,
        icon_url: item.icon_url || null,
        notes: `Suggested by ArcticPulse based on your profile.`,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tool: data });
  }

  if (type === "prompt") {
    const { data, error } = await supabase
      .from("hub_prompts")
      .insert({
        user_id: user.id,
        title: item.title,
        description: item.description || null,
        content: item.content || null,
        status: "draft",
        tags: item.tags || [],
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ prompt: data });
  }

  if (type === "task") {
    const { data, error } = await supabase
      .from("hub_tasks")
      .insert({
        user_id: user.id,
        title: item.title,
        description: item.description || null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ task: data });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
