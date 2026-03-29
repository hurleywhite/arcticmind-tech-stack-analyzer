import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: feedbackRows } = await supabase
      .from("article_feedback")
      .select("article_url, feedback")
      .eq("user_id", user.id);

    const feedback: Record<string, string> = {};
    for (const row of feedbackRows || []) {
      feedback[row.article_url] = row.feedback;
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Feedback GET error:", error);
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
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
    const { article_url, article_title, feedback, source, category } = body;

    if (!article_url || !feedback || !["up", "down"].includes(feedback)) {
      return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
    }

    // Upsert — update if exists, insert if new
    const { data: existing } = await supabase
      .from("article_feedback")
      .select("id, feedback")
      .eq("user_id", user.id)
      .eq("article_url", article_url)
      .single();

    if (existing) {
      if (existing.feedback === feedback) {
        // Same feedback = toggle off (delete)
        await supabase
          .from("article_feedback")
          .delete()
          .eq("id", existing.id);
      } else {
        // Different feedback = update
        await supabase
          .from("article_feedback")
          .update({
            feedback,
            article_title,
            source: source || null,
            category: category || null,
          })
          .eq("id", existing.id);
      }
    } else {
      // New feedback
      await supabase
        .from("article_feedback")
        .insert({
          user_id: user.id,
          article_url,
          article_title: article_title || null,
          feedback,
          source: source || null,
          category: category || null,
        });
    }

    // Invalidate preference cache so next feed generation recomputes
    await supabase
      .from("user_profiles")
      .update({ preferences_cache: null, preferences_updated_at: null })
      .eq("id", user.id);

    return NextResponse.json({
      status: existing?.feedback === feedback ? "removed" : existing ? "updated" : "created",
      feedback: existing?.feedback === feedback ? null : feedback,
    });
  } catch (error) {
    console.error("Feedback POST error:", error);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
