import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { PostRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 6;

export default async function PostsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const supabase = createClient();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const q = (searchParams.q ?? "").trim();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("posts")
    .select("id, title, body, image_url, summary, created_at, author:users!posts_author_id_fkey(id, name, role)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    // Basic ILIKE search on title + body
    query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
  }

  const { data: posts, count, error } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <>
      <Navbar />
      <main className="bg-paper noise min-h-screen">
        {/* Header */}
        <section className="border-b border-ink/10 bg-paper-warm">
          <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-24">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-ink/60">
              <span>The archive</span>
              <span>·</span>
              <span>{count ?? 0} pieces</span>
              {q && (
                <>
                  <span>·</span>
                  <span className="italic-serif normal-case text-accent">matching "{q}"</span>
                </>
              )}
            </div>
            <h1 className="mt-6 display text-6xl md:text-8xl">
              Articles,
              <br />
              <span className="italic-serif">lately.</span>
            </h1>

            {/* Search */}
            <form action="/posts" method="get" className="mt-10 flex max-w-xl border-b border-ink">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search titles and bodies…"
                className="flex-1 bg-transparent py-3 text-lg placeholder:text-ink/40 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 font-mono text-xs uppercase tracking-widest hover:text-accent"
              >
                Search →
              </button>
            </form>
          </div>
        </section>

        {/* Grid */}
        <section className="mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-24">
          {error && (
            <div className="border border-accent p-6 text-accent">
              Failed to load posts. {error.message}
            </div>
          )}

          {posts && posts.length === 0 && (
            <div className="py-24 text-center">
              <div className="display text-4xl">Nothing yet.</div>
              <p className="mt-4 text-ink/60">
                {q
                  ? "No articles matched your search."
                  : "Be the first to publish."}
              </p>
              <Link
                href="/posts/new"
                className="mt-8 inline-block border border-ink px-6 py-3 text-sm uppercase tracking-widest hover:bg-ink hover:text-paper"
              >
                Write something →
              </Link>
            </div>
          )}

          {posts && posts.length > 0 && (
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {(posts as unknown as PostRow[]).map((p, i) => (
                <PostCard key={p.id} post={p} index={i} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-20 flex items-center justify-between border-t border-ink/10 pt-8">
              <PagerLink
                page={page - 1}
                disabled={page <= 1}
                q={q}
                label="← Previous"
              />
              <div className="font-mono text-xs uppercase tracking-widest text-ink/60">
                Page {page} / {totalPages}
              </div>
              <PagerLink
                page={page + 1}
                disabled={page >= totalPages}
                q={q}
                label="Next →"
              />
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function PagerLink({
  page,
  disabled,
  q,
  label,
}: {
  page: number;
  disabled: boolean;
  q: string;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="font-mono text-xs uppercase tracking-widest text-ink/30">
        {label}
      </span>
    );
  }
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  if (q) qs.set("q", q);
  return (
    <Link
      href={`/posts?${qs.toString()}`}
      className="font-mono text-xs uppercase tracking-widest hover:text-accent"
    >
      {label}
    </Link>
  );
}

function PostCard({ post, index }: { post: PostRow; index: number }) {
  const date = new Date(post.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <Link
      href={`/posts/${post.id}`}
      className="group block"
    >
      <article>
        <div className="relative aspect-[4/3] overflow-hidden bg-ink/5">
          {post.image_url ? (
            <Image
              src={post.image_url}
              alt={post.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-ink text-paper">
              <span className="display text-6xl opacity-30">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
          )}
          <div className="absolute left-3 top-3 bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-widest">
            {date}
          </div>
        </div>
        <h2 className="mt-5 display text-3xl leading-tight group-hover:text-accent transition-colors">
          {post.title}
        </h2>
        {post.summary && (
          <p className="mt-3 text-ink/70 leading-relaxed line-clamp-4">
            {post.summary}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-ink/50">
          <span>by {post.author?.name ?? "—"}</span>
          <span className="transition-transform group-hover:translate-x-1">
            read →
          </span>
        </div>
      </article>
    </Link>
  );
}
