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
    .select(
      "id, title, body, image_url, summary, created_at, author:users!posts_author_id_fkey(id, name, role)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
  }

  const { data: posts, count, error } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  // Stats for the tiles
  const { count: totalAuthors } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .in("role", ["author", "admin"]);

  const { count: totalComments } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true });

  return (
    <>
      <Navbar />
      <main className="bg-paper noise min-h-screen">
        {/* ===== HEADER ===== */}
        <section className="relative overflow-hidden border-b border-ink/10 bg-paper-warm">
          {/* Decorative color splash behind title */}
          <div className="pointer-events-none absolute -left-20 top-1/3 h-80 w-80 rounded-full bg-accent-lime opacity-60 blur-3xl" />
          <div className="pointer-events-none absolute right-[15%] top-10 h-48 w-48 rounded-full bg-accent opacity-20 blur-3xl" />

          <div className="relative mx-auto max-w-[1400px] px-6 py-12 md:px-10 md:py-16">
            <div className="grid grid-cols-12 gap-6 items-end">
              {/* Title block */}
              <div className="col-span-12 md:col-span-7">
                <div className="inline-flex items-center gap-3 border border-ink/20 bg-paper px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-ink/70">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  <span>The archive</span>
                  <span className="text-ink/30">·</span>
                  <span>{count ?? 0} {count === 1 ? "piece" : "pieces"}</span>
                  {q && (
                    <>
                      <span className="text-ink/30">·</span>
                      <span className="italic-serif normal-case text-accent">
                        &ldquo;{q}&rdquo;
                      </span>
                    </>
                  )}
                </div>
                <h1 className="mt-5 display text-5xl md:text-7xl leading-[0.95]">
                  Articles,
                  <br />
                  <span className="italic-serif text-accent">lately.</span>
                </h1>
                <p className="mt-6 max-w-lg text-ink/70 leading-relaxed">
                  Every piece here comes with a two-hundred-word abstract,
                  written the moment it was published. Skim, or dive in.
                </p>
              </div>

              {/* ===== Color-coded stat tiles ===== */}
              <div className="col-span-12 md:col-span-5">
                <div className="grid grid-cols-3 gap-3">
                  {/* Ink tile */}
                  <div className="group relative overflow-hidden bg-ink text-paper p-5 transition-transform hover:-translate-y-1 noise">
                    <div className="display text-5xl md:text-6xl leading-none">
                      {count ?? 0}
                    </div>
                    <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-paper/60">
                      Pieces
                    </div>
                    <div className="absolute -right-3 -top-3 h-10 w-10 rounded-full bg-accent" />
                  </div>

                  {/* Accent orange tile */}
                  <div className="group relative overflow-hidden bg-accent text-paper p-5 transition-transform hover:-translate-y-1 noise">
                    <div className="display text-5xl md:text-6xl leading-none">
                      {totalAuthors ?? 0}
                    </div>
                    <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-paper/80">
                      Authors
                    </div>
                    <div className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full border-2 border-paper/40" />
                  </div>

                  {/* Lime tile */}
                  <div className="group relative overflow-hidden bg-accent-lime text-ink p-5 transition-transform hover:-translate-y-1">
                    <div className="display text-5xl md:text-6xl leading-none">
                      {totalComments ?? 0}
                    </div>
                    <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink/70">
                      Comments
                    </div>
                    <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-ink" />
                  </div>
                </div>
              </div>
            </div>

            {/* ===== SEARCH BAR — darker, punchier ===== */}
            <form
              action="/posts"
              method="get"
              className="mt-10 flex items-center gap-3 border-2 border-ink bg-paper px-5 py-2 focus-within:border-accent transition-colors max-w-2xl"
            >
              <span className="font-mono text-xs uppercase tracking-widest text-ink/50">
                Find
              </span>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search titles and bodies…"
                className="flex-1 bg-transparent py-2 text-base placeholder:text-ink/40 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-accent px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-paper hover:bg-ink transition-colors"
              >
                Search →
              </button>
            </form>

          
          </div>
        </section>

        {/* ===== GRID ===== */}
        <section className="mx-auto max-w-[1400px] px-6 py-14 md:px-10 md:py-20">
          {error && (
            <div className="border-2 border-accent bg-accent/5 p-6 text-accent">
              Failed to load posts. {error.message}
            </div>
          )}

          {posts && posts.length === 0 && (
            <div className="relative overflow-hidden border-2 border-dashed border-ink/20 bg-paper-warm py-24 text-center">
              <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-accent-lime opacity-40 blur-2xl" />
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-accent opacity-30 blur-2xl" />
              <div className="relative">
                <div className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-4">
                  § Empty shelf
                </div>
                <div className="display text-5xl">
                  Nothing <span className="italic-serif text-accent">yet.</span>
                </div>
                <p className="mt-4 text-ink/60 max-w-sm mx-auto">
                  {q
                    ? "No articles matched your search. Try a different phrase."
                    : "Be the first to publish. The shelf is waiting."}
                </p>
                <Link
                  href="/posts/new"
                  className="mt-8 inline-block bg-ink text-paper px-6 py-3 text-sm uppercase tracking-widest hover:bg-accent"
                >
                  Write something →
                </Link>
              </div>
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
  // Rotate accent colors on fallback cards
  const fallbackBg = ["bg-ink", "bg-accent", "bg-accent-lime"][index % 3];
  const fallbackText = fallbackBg === "bg-accent-lime" ? "text-ink" : "text-paper";

  return (
    <Link href={`/posts/${post.id}`} className="group block">
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
            <div className={`flex h-full w-full items-center justify-center ${fallbackBg} ${fallbackText}`}>
              <span className="display text-7xl opacity-40">
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
          <span className="text-accent transition-transform group-hover:translate-x-1">
            read →
          </span>
        </div>
      </article>
    </Link>
  );
}