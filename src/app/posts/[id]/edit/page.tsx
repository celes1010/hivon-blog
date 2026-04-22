import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostEditor from "@/components/PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, body, image_url, author_id")
    .eq("id", params.id)
    .single();

  if (!post) notFound();

  // Author of the post, or admin — anyone else is blocked.
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  const isAuthor = auth.user.id === post.author_id;
  const isAdmin = profile?.role === "admin";

  if (!isAuthor && !isAdmin) {
    return (
      <>
        <Navbar />
        <main className="min-h-[70vh] bg-paper noise">
          <div className="mx-auto max-w-[900px] px-6 py-24 md:px-10">
            <div className="font-mono text-xs uppercase tracking-widest text-ink/60">
              § Forbidden
            </div>
            <h1 className="mt-4 display text-5xl">
              You can't edit{" "}
              <span className="italic-serif text-accent">someone else's work.</span>
            </h1>
            <p className="mt-6 text-ink/70">
              Only the original author or an admin may edit this post.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] bg-paper noise">
        <div className="mx-auto max-w-[1100px] px-6 py-16 md:px-10">
          <div className="font-mono text-xs uppercase tracking-widest text-ink/60">
            § Editing {isAdmin && !isAuthor ? "(admin override)" : ""}
          </div>
          <h1 className="mt-4 display text-5xl md:text-6xl">
            Refine, <span className="italic-serif text-accent">rewrite, republish.</span>
          </h1>
          <div className="mt-12">
            <PostEditor
              initialPost={{
                id: post.id,
                title: post.title,
                body: post.body,
                image_url: post.image_url,
              }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
