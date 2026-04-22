import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/posts/[id]/comments
 * Any signed-in user (any role) can comment on any post.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const text = body?.comment_text;
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "comment_text is required" }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "comment too long" }, { status: 400 });
  }

  // Ensure post exists
  const { data: exists } = await supabase
    .from("posts")
    .select("id")
    .eq("id", params.id)
    .single();
  if (!exists) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: params.id,
      user_id: auth.user.id,
      comment_text: text.trim(),
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}

/**
 * DELETE /api/posts/[id]/comments?id=<commentId>
 * Author of the comment or an admin can delete. Enforced by RLS too.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const commentId = req.nextUrl.searchParams.get("id");
  if (!commentId) {
    return NextResponse.json({ error: "comment id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("post_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
