import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("hub_prompts")
    .select("*, hub_prompt_tools(tool_id, hub_tools(id, name))")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten the tool joins
  const prompts = (data || []).map((p: Record<string, unknown>) => ({
    ...p,
    tools: ((p.hub_prompt_tools as Array<{ hub_tools: { id: string; name: string } }>) || []).map(
      (pt) => pt.hub_tools
    ),
    hub_prompt_tools: undefined,
  }));

  return NextResponse.json({ prompts });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, description, content, status, tags, tool_ids } = body;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("hub_prompts")
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      content: content || null,
      status: status || "draft",
      tags: tags || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Link tools if provided
  if (tool_ids?.length > 0) {
    await supabase.from("hub_prompt_tools").insert(
      tool_ids.map((tool_id: string) => ({ prompt_id: data.id, tool_id }))
    );
  }

  return NextResponse.json({ prompt: data });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, title, description, content, status, tags, tool_ids } = body;

  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("hub_prompts")
    .update({
      title,
      description: description || null,
      content: content || null,
      status: status || "draft",
      tags: tags || [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Re-link tools
  if (tool_ids !== undefined) {
    await supabase.from("hub_prompt_tools").delete().eq("prompt_id", id);
    if (tool_ids.length > 0) {
      await supabase.from("hub_prompt_tools").insert(
        tool_ids.map((tool_id: string) => ({ prompt_id: id, tool_id }))
      );
    }
  }

  return NextResponse.json({ prompt: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  const { error } = await supabase
    .from("hub_prompts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
