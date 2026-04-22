"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Check role — admins go to the dashboard, everyone else to /posts
    let destination = "/posts";
    if (data.user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();
      if (profile?.role === "admin") {
        destination = "/admin";
      }
    }

    setLoading(false);
    router.push(destination);
    router.refresh();
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[90vh] bg-paper noise">
        <div className="mx-auto grid min-h-[85vh] max-w-[1400px] grid-cols-1 md:grid-cols-2">
          {/* ===== LEFT — editorial, now with actual character ===== */}
          <div className="relative hidden overflow-hidden border-r border-ink/10 bg-ink text-paper p-12 md:flex md:flex-col md:justify-between noise">
            {/* Decorative floating shape */}
            <div className="pointer-events-none absolute -right-20 top-1/3 h-64 w-64 rounded-full bg-accent opacity-90 blur-[1px]" />
            <div className="pointer-events-none absolute left-10 bottom-1/3 h-3 w-3 rounded-full bg-accent-lime" />

            {/* Decorative grid */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #fafaf7 1px, transparent 1px), linear-gradient(to bottom, #fafaf7 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />

            {/* Top */}
            <div className="relative flex items-center justify-between">
              <div className="font-mono text-xs uppercase tracking-widest text-paper/50">
                § Sign in
              </div>
              <div className="font-mono text-xs text-paper/40">No. 01</div>
            </div>

            {/* Middle — big typography */}
            <div className="relative">
              <h1 className="display text-7xl leading-[0.9]">
                Welcome
                <br />
                <span className="italic-serif text-accent">back.</span>
              </h1>
              <p className="mt-8 max-w-sm text-paper/70 leading-relaxed">
                Pick up where you left off — your drafts, your comments, your
                unfinished thoughts are exactly where you parked them.
              </p>

              {/* Quote */}
              <blockquote className="mt-10 max-w-sm border-l-2 border-accent pl-5">
                <p className="italic-serif text-xl leading-snug text-paper/85">
                  &ldquo;The summary is never the story.{" "}
                  <span className="text-accent">It&apos;s the door.&rdquo;</span>
                </p>
                <footer className="mt-2 font-mono text-[10px] uppercase tracking-widest text-paper/40">
                  — Hivon
                </footer>
              </blockquote>
            </div>

            {/* Bottom meta */}
            <div className="relative flex items-center justify-between font-mono text-xs text-paper/40">
              <span>Hivon Journal / Vol. 01</span>
              <span>2026</span>
            </div>
          </div>

          {/* ===== RIGHT — form ===== */}
          <div className="flex items-center justify-center p-10">
            <form onSubmit={handleSubmit} className="w-full max-w-sm">
              <div className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-4 md:hidden">
                § Sign in
              </div>
              <h2 className="display text-4xl mb-10 md:hidden">
                Welcome <span className="italic-serif">back.</span>
              </h2>

              <label className="block mb-6">
                <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 block w-full border-0 border-b border-ink bg-transparent py-3 text-lg focus:border-accent focus:outline-none"
                />
              </label>

              <label className="block mb-8">
                <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
                  Password
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 block w-full border-0 border-b border-ink bg-transparent py-3 text-lg focus:border-accent focus:outline-none"
                />
              </label>

              {error && (
                <div className="mb-6 border border-accent bg-accent/5 px-4 py-3 text-sm text-accent">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-between bg-ink px-6 py-4 text-paper text-sm uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>

              <p className="mt-6 text-sm text-ink/60">
                No account?{" "}
                <Link href="/signup" className="underline underline-offset-4 hover:text-accent">
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}