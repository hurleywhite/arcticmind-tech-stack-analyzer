import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("saved_articles")
      .select("*")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ bookmarks: data || [] });
  } catch (error) {
    console.error("Bookmarks GET error:", error);
    return NextResponse.json({ error: "Failed to load bookmarks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { article_url, article_title, article_summary, article_source, article_category, article_date } = body;

    if (!article_url) {
      return NextResponse.json({ error: "article_url required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("saved_articles")
      .upsert({
        user_id: user.id,
        article_url,
        article_title: article_title || "",
        article_summary: article_summary || "",
        article_source: article_source || "",
        article_category: article_category || "",
        article_date: article_date || "",
      }, { onConflict: "user_id,article_url" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ bookmark: data });
  } catch (error) {
    console.error("Bookmarks POST error:", error);
    return NextResponse.json({ error: "Failed to save bookmark" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const articleUrl = searchParams.get("url");
    if (!articleUrl) {
      return NextResponse.json({ error: "url param required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("saved_articles")
      .delete()
      .eq("user_id", user.id)
      .eq("article_url", articleUrl);

    if (error) throw error;
    return NextResponse.json({ removed: true });
  } catch (error) {
    console.error("Bookmarks DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 });
  }
}
