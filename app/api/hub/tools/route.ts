import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("hub_tools")
    .select("*, hub_prompt_tools(prompt_id, hub_prompts(id, title))")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tools = (data || []).map((t: Record<string, unknown>) => ({
    ...t,
    prompts: ((t.hub_prompt_tools as Array<{ hub_prompts: { id: string; title: string } }>) || []).map(
      (pt) => pt.hub_prompts
    ),
    hub_prompt_tools: undefined,
  }));

  return NextResponse.json({ tools });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, description, url, icon_url, notes } = body;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("hub_tools")
    .insert({
      user_id: user.id,
      name,
      description: description || null,
      url: url || null,
      icon_url: icon_url || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tool: data });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, name, description, url, icon_url, notes, shared } = body;

  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  const updateData: Record<string, unknown> = {
    name,
    description: description || null,
    url: url || null,
    icon_url: icon_url || null,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  };
  if (shared !== undefined) updateData.shared = shared;

  const { data, error } = await supabase
    .from("hub_tools")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tool: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  const { error } = await supabase
    .from("hub_tools")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
