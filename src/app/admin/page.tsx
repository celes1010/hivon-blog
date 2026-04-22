import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminActions from "@/components/AdminActions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <>
        <Navbar />
        <main className="min-h-[70vh] bg-paper noise">
          <div className="mx-auto max-w-[900px] px-6 py-24 md:px-10">
            <div className="font-mono text-xs uppercase tracking-widest text-ink/60">
              § Forbidden
            </div>
            <h1 className="mt-4 display text-5xl">
              Admins <span className="italic-serif text-accent">only.</span>
            </h1>
            <p className="mt-6 text-ink/70">
              You don't have permission to view this page.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const [{ data: posts }, { data: comments }, { data: users }] =
    await Promise.all([
      supabase
        .from("posts")
        .select(
          "id, title, created_at, summary, author:users!posts_author_id_fkey(id, name, role)"
        )
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("comments")
        .select(
          "id, post_id, comment_text, created_at, user:users!comments_user_id_fkey(id, name, role)"
        )
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("users")
        .select("id, name, email, role, created_at")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  const stats = {
    posts: posts?.length ?? 0,
    comments: comments?.length ?? 0,
    users: users?.length ?? 0,
  };

  return (
    <>
      <Navbar />
      <main className="bg-paper noise min-h-screen">
        {/* Header */}
        <section className="border-b border-ink/10 bg-ink text-paper noise">
          <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-20">
            <div className="font-mono text-xs uppercase tracking-widest text-paper/50">
              § Admin console
            </div>
            <h1 className="mt-4 display text-6xl md:text-7xl">
              The editor's <span className="italic-serif text-accent">desk.</span>
            </h1>
            <div className="mt-10 grid grid-cols-3 gap-6 md:max-w-xl">
              <Stat label="Posts" value={stats.posts} />
              <Stat label="Comments" value={stats.comments} />
              <Stat label="Users" value={stats.users} />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10">
          {/* Posts */}
          <section className="mb-20">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="display text-4xl">All posts</h2>
              <Link
                href="/posts/new"
                className="font-mono text-xs uppercase tracking-widest hover:text-accent"
              >
                + New
              </Link>
            </div>

            <div className="border border-ink/10">
              <div className="hidden md:grid md:grid-cols-[1fr,160px,140px,180px] gap-4 border-b border-ink/10 bg-paper-warm px-5 py-3 font-mono text-xs uppercase tracking-widest text-ink/60">
                <div>Title</div>
                <div>Author</div>
                <div>Date</div>
                <div className="text-right">Actions</div>
              </div>
              {posts?.map((p: any) => (
                <div
                  key={p.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr,160px,140px,180px] gap-4 border-b border-ink/5 px-5 py-4 hover:bg-paper-warm"
                >
                  <div>
                    <Link
                      href={`/posts/${p.id}`}
                      className="display text-xl hover:text-accent"
                    >
                      {p.title}
                    </Link>
                    {p.summary && (
                      <div className="mt-1 text-xs text-ink/50 line-clamp-1">
                        {p.summary}
                      </div>
                    )}
                  </div>
                  <div className="font-mono text-xs text-ink/70">
                    {p.author?.name ?? "—"}
                  </div>
                  <div className="font-mono text-xs text-ink/60">
                    {new Date(p.created_at).toLocaleDateString("en-GB")}
                  </div>
                  <AdminActions postId={p.id} />
                </div>
              ))}
              {(!posts || posts.length === 0) && (
                <div className="p-6 text-center text-ink/50">No posts yet.</div>
              )}
            </div>
          </section>

          {/* Comments */}
          <section className="mb-20">
            <h2 className="display text-4xl mb-6">Recent comments</h2>
            <div className="border border-ink/10">
              {comments?.map((c: any) => (
                <div
                  key={c.id}
                  className="border-b border-ink/5 px-5 py-4 hover:bg-paper-warm"
                >
                  <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-ink/60">
                    <span>
                      {c.user?.name ?? "—"}
                      {c.user?.role === "admin" && (
                        <span className="ml-2 bg-ink text-paper px-2 py-0.5 text-[9px] normal-case">
                          admin
                        </span>
                      )}
                    </span>
                    <span>
                      {new Date(c.created_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink/80 line-clamp-2">
                    {c.comment_text}
                  </p>
                  <Link
                    href={`/posts/${c.post_id}`}
                    className="mt-1 inline-block font-mono text-[10px] uppercase tracking-widest text-ink/50 hover:text-accent"
                  >
                    View post →
                  </Link>
                </div>
              ))}
              {(!comments || comments.length === 0) && (
                <div className="p-6 text-center text-ink/50">
                  No comments yet.
                </div>
              )}
            </div>
          </section>

          {/* Users */}
          <section>
            <h2 className="display text-4xl mb-6">Users</h2>
            <div className="border border-ink/10">
              <div className="hidden md:grid md:grid-cols-4 gap-4 border-b border-ink/10 bg-paper-warm px-5 py-3 font-mono text-xs uppercase tracking-widest text-ink/60">
                <div>Name</div>
                <div>Email</div>
                <div>Role</div>
                <div>Joined</div>
              </div>
              {users?.map((u: any) => (
                <div
                  key={u.id}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-ink/5 px-5 py-3"
                >
                  <div className="text-sm">{u.name}</div>
                  <div className="font-mono text-xs text-ink/70">{u.email}</div>
                  <div>
                    <span className="font-mono text-xs uppercase border border-ink/20 px-2 py-0.5">
                      {u.role}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-ink/60">
                    {new Date(u.created_at).toLocaleDateString("en-GB")}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="display text-5xl md:text-6xl">{value}</div>
      <div className="mt-1 font-mono text-xs uppercase tracking-widest text-paper/50">
        {label}
      </div>
    </div>
  );
}
