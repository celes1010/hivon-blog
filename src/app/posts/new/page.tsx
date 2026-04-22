import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostEditor from "@/components/PostEditor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (!profile || (profile.role !== "author" && profile.role !== "admin")) {
    return (
      <>
        <Navbar />
        <main className="min-h-[70vh] bg-paper noise">
          <div className="mx-auto max-w-[900px] px-6 py-24 md:px-10">
            <div className="font-mono text-xs uppercase tracking-widest text-ink/60">
              § Access denied
            </div>
            <h1 className="mt-4 display text-5xl">
              Only authors can <span className="italic-serif text-accent">publish.</span>
            </h1>
            <p className="mt-6 text-ink/70 max-w-xl">
              Your current role is{" "}
              <span className="font-mono uppercase">{profile?.role ?? "viewer"}</span>.
              Contact an admin to be promoted to Author.
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
            § New piece
          </div>
          <h1 className="mt-4 display text-5xl md:text-6xl">
            Write something{" "}
            <span className="italic-serif text-accent">worth keeping.</span>
          </h1>
          <div className="mt-12">
            <PostEditor />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
