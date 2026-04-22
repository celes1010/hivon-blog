import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSummary } from "@/lib/ai/summary";

/**
 * PATCH /api/posts/[id]
 * Edit a post. Author of the post OR admin only.
 *
 * Cost-optimisation: we re-run the Gemini summariser ONLY if the `body`
 * (or `title`) actually changed. If the author just fixes a typo in the image
 * URL, we skip the API call entirely and keep the stored summary.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Fetch existing post + requester's role
  const [{ data: existing }, { data: profile }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, body, image_url, author_id")
      .eq("id", params.id)
      .single(),
    supabase.from("users").select("role").eq("id", auth.user.id).single(),
  ]);

  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const isAuthor = existing.author_id === auth.user.id;
  const isAdmin = profile?.role === "admin";
  if (!isAuthor && !isAdmin) {
    return NextResponse.json(
      { error: "Forbidden. You can only edit your own posts." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nextTitle =
    typeof body.title === "string" ? body.title.trim() : existing.title;
  const nextBody =
    typeof body.body === "string" ? body.body.trim() : existing.body;
  const nextImage =
    body.image_url === null || typeof body.image_url === "string"
      ? body.image_url
      : existing.image_url;

  if (!nextTitle || !nextBody) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }

  // Regenerate summary ONLY if content actually changed.
  const contentChanged =
    nextTitle !== existing.title || nextBody !== existing.body;
  const update: Record<string, unknown> = {
    title: nextTitle,
    body: nextBody,
    image_url: nextImage,
  };
  if (contentChanged) {
    update.summary = await generateSummary(nextTitle, nextBody);
  }

  const { data: updated, error } = await supabase
    .from("posts")
    .update(update)
    .eq("id", params.id)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: updated.id, summaryRegenerated: contentChanged });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  // RLS enforces author-or-admin in DB too.
  const { error } = await supabase.from("posts").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
