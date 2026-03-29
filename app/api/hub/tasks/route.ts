import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("hub_tasks")
    .select(`
      *,
      hub_task_tools(tool_id, hub_tools(id, name)),
      hub_task_prompts(prompt_id, hub_prompts(id, title))
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tasks = (data || []).map((t: Record<string, unknown>) => ({
    ...t,
    tools: ((t.hub_task_tools as Array<{ hub_tools: { id: string; name: string } }>) || []).map(
      (tt) => tt.hub_tools
    ),
    prompts: ((t.hub_task_prompts as Array<{ hub_prompts: { id: string; title: string } }>) || []).map(
      (tp) => tp.hub_prompts
    ),
    hub_task_tools: undefined,
    hub_task_prompts: undefined,
  }));

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, description, tool_ids, prompt_ids } = body;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("hub_tasks")
    .insert({
      user_id: user.id,
      title,
      description: description || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (tool_ids?.length > 0) {
    await supabase.from("hub_task_tools").insert(
      tool_ids.map((tool_id: string) => ({ task_id: data.id, tool_id }))
    );
  }
  if (prompt_ids?.length > 0) {
    await supabase.from("hub_task_prompts").insert(
      prompt_ids.map((prompt_id: string) => ({ task_id: data.id, prompt_id }))
    );
  }

  return NextResponse.json({ task: data });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, title, description, tool_ids, prompt_ids } = body;

  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("hub_tasks")
    .update({
      title,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (tool_ids !== undefined) {
    await supabase.from("hub_task_tools").delete().eq("task_id", id);
    if (tool_ids.length > 0) {
      await supabase.from("hub_task_tools").insert(
        tool_ids.map((tool_id: string) => ({ task_id: id, tool_id }))
      );
    }
  }
  if (prompt_ids !== undefined) {
    await supabase.from("hub_task_prompts").delete().eq("task_id", id);
    if (prompt_ids.length > 0) {
      await supabase.from("hub_task_prompts").insert(
        prompt_ids.map((prompt_id: string) => ({ task_id: id, prompt_id }))
      );
    }
  }

  return NextResponse.json({ task: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  const { error } = await supabase
    .from("hub_tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
