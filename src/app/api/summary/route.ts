import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSummary } from "@/lib/ai/summary";

/**
 * POST /api/summary   body: { postId }
 * Admin-only. Force-regenerates the Gemini summary for a given post.
 *
 * This is the ONLY code path besides post-create/update that calls the AI.
 * Everything else reads the stored column.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const postId = body?.postId;
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, body")
    .eq("id", postId)
    .single();
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const summary = await generateSummary(post.title, post.body);
  const { error } = await supabase
    .from("posts")
    .update({ summary })
    .eq("id", postId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, summary });
}
