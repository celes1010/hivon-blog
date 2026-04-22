import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSummary } from "@/lib/ai/summary";

/**
 * POST /api/posts
 * Creates a new post.
 *
 * Cost-optimisation principle: the Gemini summary is generated EXACTLY ONCE
 * here, at creation time, and persisted to the `summary` column. The listing
 * and single-post pages read this stored value — they never call the AI again.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();

  // 1. Authn
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // 2. Authz — must be author or admin
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (!profile || (profile.role !== "author" && profile.role !== "admin")) {
    return NextResponse.json(
      { error: "Only authors and admins can create posts." },
      { status: 403 }
    );
  }

  // 3. Validate
  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string" || typeof body.body !== "string") {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 });
  }
  const title = body.title.trim();
  const content = body.body.trim();
  const image_url = typeof body.image_url === "string" ? body.image_url : null;

  if (title.length === 0 || content.length === 0) {
    return NextResponse.json({ error: "title and body must be non-empty" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "title must be ≤ 200 chars" }, { status: 400 });
  }

  // 4. Generate summary ONCE before insert. Fallback handled inside generateSummary.
  const summary = await generateSummary(title, content);

  // 5. Insert
  const { data: inserted, error } = await supabase
    .from("posts")
    .insert({
      title,
      body: content,
      image_url,
      summary,
      author_id: auth.user.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[POST /api/posts] insert failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: inserted.id, summary });
}
