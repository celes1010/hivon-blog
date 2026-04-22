import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CommentsSection from "@/components/CommentsSection";
import type { PostRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, body, image_url, summary, author_id, created_at, updated_at, author:users!posts_author_id_fkey(id, name, role)")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const post = data as unknown as PostRow;

  // Check if current user can edit (author or admin)
  const { data: auth } = await supabase.auth.getUser();
  let canEdit = false;
  if (auth.user) {
    if (auth.user.id === post.author_id) {
      canEdit = true;
    } else {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", auth.user.id)
        .single();
      if (profile?.role === "admin") canEdit = true;
    }
  }

  const date = new Date(post.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Split body into paragraphs
  const paragraphs = post.body.split(/\n\n+/).filter((p) => p.trim());

  return (
    <>
      <Navbar />
      <main className="bg-paper noise">
        <article>
          {/* Header */}
          <header className="border-b border-ink/10 bg-paper-warm">
            <div className="mx-auto max-w-[1000px] px-6 py-16 md:px-10 md:py-24">
              <Link
                href="/posts"
                className="font-mono text-xs uppercase tracking-widest text-ink/60 hover:text-accent"
              >
                ← Back to archive
              </Link>
              <h1 className="mt-8 display text-5xl md:text-7xl leading-[1]">
                {post.title}
              </h1>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 font-mono text-xs uppercase tracking-widest text-ink/60">
                <div>
                  By <span className="text-ink">{post.author?.name ?? "—"}</span>
                  {post.author?.role && (
                    <span className="ml-2 border border-ink/30 px-2 py-0.5 text-[9px]">
                      {post.author.role}
                    </span>
                  )}
                </div>
                <div>{date}</div>
              </div>
              {canEdit && (
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="mt-6 inline-block border border-ink px-4 py-2 text-xs uppercase tracking-widest hover:bg-ink hover:text-paper"
                >
                  Edit this post
                </Link>
              )}
            </div>
          </header>

          {/* Featured image */}
          {post.image_url && (
            <div className="relative aspect-[16/9] w-full bg-ink/5">
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          )}

          {/* AI Summary */}
          {post.summary && (
            <div className="mx-auto max-w-[1000px] px-6 py-12 md:px-10">
              <div className="border-l-4 border-accent bg-paper-warm p-6 md:p-8">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink/60 mb-3">
                  <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                  Abstract, written by Gemini 2.5
                </div>
                <p className="italic-serif text-xl leading-relaxed text-ink/90">
                  {post.summary}
                </p>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="mx-auto max-w-[780px] px-6 pb-20 md:px-10">
            <div className="prose-editorial">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <CommentsSection postId={post.id} postAuthorId={post.author_id} />
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
