"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CommentRow, Role } from "@/lib/types";

export default function CommentsSection({
  postId,
  postAuthorId,
}: {
  postId: string;
  postAuthorId: string;
}) {
  const supabase = createClient();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("comments")
      .select("id, post_id, user_id, comment_text, created_at, user:users!comments_user_id_fkey(id, name, role)")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    setComments((data as unknown as CommentRow[]) ?? []);
  }

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        setUserId(auth.user.id);
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", auth.user.id)
          .single();
        setRole((profile?.role as Role) ?? "viewer");
      }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ comment_text: text }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Could not post comment.");
      return;
    }
    setText("");
    await load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/posts/${postId}/comments?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) load();
  }

  const canModerate = role === "admin";
  // Author of the post can see the section highlighted as "their" comments
  const isAuthor = userId === postAuthorId;

  return (
    <section className="border-t border-ink/10 mt-16 pt-16">
      <div className="flex items-baseline justify-between mb-10">
        <h3 className="display text-4xl">
          Comments{" "}
          <span className="italic-serif text-ink/40">({comments.length})</span>
        </h3>
        {isAuthor && (
          <span className="font-mono text-xs uppercase tracking-widest text-ink/50">
            You are the author of this piece
          </span>
        )}
      </div>

      {userId ? (
        <form onSubmit={submit} className="mb-12">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Leave a thought…"
            rows={4}
            required
            className="w-full border border-ink/20 bg-paper p-4 text-base focus:border-ink focus:outline-none"
          />
          {error && (
            <div className="mt-2 text-sm text-accent">{error}</div>
          )}
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="bg-ink text-paper px-6 py-3 text-xs uppercase tracking-widest hover:bg-accent disabled:opacity-60"
            >
              {submitting ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-12 border border-ink/10 bg-paper-warm p-6">
          <p className="text-ink/70">
            <a href="/login" className="underline underline-offset-4 hover:text-accent">
              Sign in
            </a>{" "}
            to join the conversation.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {comments.length === 0 && (
          <div className="font-mono text-xs uppercase tracking-widest text-ink/40">
            — No comments yet —
          </div>
        )}

        {comments.map((c) => {
          const canDelete = canModerate || c.user_id === userId;
          return (
            <article key={c.id} className="border-l-2 border-ink/10 pl-5 hover:border-accent transition-colors">
              <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-ink/50">
                <div className="flex items-center gap-2">
                  <span className="text-ink">{c.user?.name ?? "Someone"}</span>
                  {c.user?.role === "admin" && (
                    <span className="bg-ink text-paper px-2 py-0.5 text-[9px]">Admin</span>
                  )}
                  {c.user?.role === "author" && (
                    <span className="border border-ink px-2 py-0.5 text-[9px]">Author</span>
                  )}
                </div>
                <span>
                  {new Date(c.created_at).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <p className="mt-2 text-ink/85 leading-relaxed whitespace-pre-wrap">
                {c.comment_text}
              </p>
              {canDelete && (
                <button
                  onClick={() => remove(c.id)}
                  className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink/40 hover:text-accent"
                >
                  Delete
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
