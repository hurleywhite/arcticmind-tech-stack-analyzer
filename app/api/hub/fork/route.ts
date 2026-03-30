import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, id } = body;

  if (!type || !id) {
    return NextResponse.json({ error: "type and id are required" }, { status: 400 });
  }

  if (type === "prompt") {
    const { data: source } = await supabase
      .from("hub_prompts")
      .select("*")
      .eq("id", id)
      .eq("shared", true)
      .single();

    if (!source) return NextResponse.json({ error: "Prompt not found or not shared" }, { status: 404 });

    const { data, error } = await supabase
      .from("hub_prompts")
      .insert({
        user_id: user.id,
        title: source.title,
        description: source.description,
        content: source.content,
        status: "draft",
        tags: source.tags || [],
        forked_from: source.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ prompt: data });
  }

  if (type === "tool") {
    const { data: source } = await supabase
      .from("hub_tools")
      .select("*")
      .eq("id", id)
      .eq("shared", true)
      .single();

    if (!source) return NextResponse.json({ error: "Tool not found or not shared" }, { status: 404 });

    const { data, error } = await supabase
      .from("hub_tools")
      .insert({
        user_id: user.id,
        name: source.name,
        description: source.description,
        url: source.url,
        icon_url: source.icon_url,
        notes: source.notes,
        forked_from: source.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tool: data });
  }

  if (type === "task") {
    const { data: source } = await supabase
      .from("hub_tasks")
      .select("*")
      .eq("id", id)
      .eq("shared", true)
      .single();

    if (!source) return NextResponse.json({ error: "Task not found or not shared" }, { status: 404 });

    const { data, error } = await supabase
      .from("hub_tasks")
      .insert({
        user_id: user.id,
        title: source.title,
        description: source.description,
        forked_from: source.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ task: data });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
