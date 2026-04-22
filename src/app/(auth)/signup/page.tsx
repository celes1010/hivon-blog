"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import type { Role } from "@/lib/types";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    // NOTE: Admin role cannot be chosen at signup — promote via SQL.
    const pickedRole: Role = role === "admin" ? "viewer" : role;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: pickedRole },
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push("/posts");
      router.refresh();
    } else {
      setInfo(
        "Account created. Check your inbox for a confirmation link — then sign in."
      );
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[90vh] bg-paper noise">
        <div className="mx-auto grid min-h-[85vh] max-w-[1400px] grid-cols-1 md:grid-cols-2">
          <div className="flex items-center justify-center p-10 order-2 md:order-1">
            <form onSubmit={handleSubmit} className="w-full max-w-sm">
              <div className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-4">
                § Create account
              </div>
              <h2 className="display text-4xl mb-10 md:hidden">
                Join the <span className="italic-serif">journal.</span>
              </h2>

              <label className="block mb-5">
                <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
                  Name
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 block w-full border-0 border-b border-ink bg-transparent py-3 text-lg focus:border-accent focus:outline-none"
                />
              </label>

              <label className="block mb-5">
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

              <label className="block mb-6">
                <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
                  Password
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 block w-full border-0 border-b border-ink bg-transparent py-3 text-lg focus:border-accent focus:outline-none"
                />
              </label>

              <div className="mb-8">
                <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
                  Role
                </span>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(["viewer", "author"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`border px-4 py-3 text-sm uppercase tracking-widest transition-colors ${
                        role === r
                          ? "bg-ink text-paper border-ink"
                          : "border-ink/20 text-ink/60 hover:border-ink"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-ink/40">
                  Admin is granted manually via database.
                </p>
              </div>

              {error && (
                <div className="mb-6 border border-accent bg-accent/5 px-4 py-3 text-sm text-accent">
                  {error}
                </div>
              )}
              {info && (
                <div className="mb-6 border border-ink/30 bg-paper-warm px-4 py-3 text-sm">
                  {info}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-between bg-ink px-6 py-4 text-paper text-sm uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Create account"}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>

              <p className="mt-6 text-sm text-ink/60">
                Already have an account?{" "}
                <Link href="/login" className="underline underline-offset-4 hover:text-accent">
                  Sign in
                </Link>
              </p>
            </form>
          </div>

          <div className="relative hidden border-l border-ink/10 bg-ink p-10 text-paper md:flex md:flex-col md:justify-between order-1 md:order-2 noise">
            <div className="font-mono text-xs uppercase tracking-widest text-paper/50">
              § Join the journal
            </div>
            <div>
              <h1 className="display text-6xl leading-none">
                Start a<br />
                <span className="italic-serif text-accent">new chapter.</span>
              </h1>
              <p className="mt-8 max-w-sm text-paper/70">
                Pick Author to publish. Pick Viewer to read and comment. You can
                always graduate later.
              </p>
            </div>
            <div className="font-mono text-xs text-paper/40">
              Free forever / no credit card
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
