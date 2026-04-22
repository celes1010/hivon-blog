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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/posts");
    router.refresh();
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[90vh] bg-paper noise">
        <div className="mx-auto grid min-h-[85vh] max-w-[1400px] grid-cols-1 md:grid-cols-2">
          {/* Left — editorial */}
          <div className="relative hidden border-r border-ink/10 bg-paper-warm p-10 md:flex md:flex-col md:justify-between">
            <div className="font-mono text-xs uppercase tracking-widest text-ink/50">
              § Sign in
            </div>
            <div>
              <h1 className="display text-6xl leading-none">
                Welcome
                <br />
                <span className="italic-serif text-accent">back.</span>
              </h1>
              <p className="mt-8 max-w-sm text-ink/70">
                Pick up where you left off — your drafts, your comments, your
                unfinished thoughts are exactly where you parked them.
              </p>
            </div>
            <div className="font-mono text-xs text-ink/40">
              Hivon Journal / Vol. 01
            </div>
          </div>

          {/* Right — form */}
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
