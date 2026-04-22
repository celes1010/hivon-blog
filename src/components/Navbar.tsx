"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (data.user) {
        setEmail(data.user.email ?? null);
        const { data: profile } = await supabase
          .from("users")
          .select("name, role")
          .eq("id", data.user.id)
          .single();
        setName(profile?.name ?? null);
        setRole((profile?.role as Role) ?? "viewer");
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
      if (!session) {
        setName(null);
        setRole(null);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // Get first name / initial
  const displayName = name?.split(" ")[0] ?? email?.split("@")[0] ?? "";
  const initial = (name?.[0] ?? email?.[0] ?? "?").toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-10">
        {/* ===== LOGO — "hivon · blog" wordmark ===== */}
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-tight leading-none">
            hivon
          </span>
          <span className="text-ink/30 leading-none">·</span>
          <span className="italic-serif text-ink/60 text-lg leading-none group-hover:text-accent transition-colors">
            blog
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {isLandingPage && (
            <Link href="/#about" className="text-sm hover:text-accent transition-colors">
              About
            </Link>
          )}

          {email && role !== "admin" && (
            <Link
              href="/posts"
              className="text-sm hover:text-accent transition-colors"
            >
              Articles
            </Link>
          )}

          {email && (role === "author" || role === "admin") && (
            <Link
              href="/posts/new"
              className="text-sm hover:text-accent transition-colors"
            >
              Write
            </Link>
          )}

          {role === "admin" && (
            <Link
              href="/admin"
              className="font-mono text-[11px] uppercase tracking-widest text-accent hover:opacity-70 transition-opacity"
            >
              Admin
            </Link>
          )}

          {email ? (
            <div className="flex items-center gap-3">
              {/* ===== Clean profile pill with avatar initial ===== */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper font-display text-sm">
                  {initial}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm text-ink">{displayName}</span>
                  {role && (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-ink/50">
                      {role}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={signOut}
                className="text-xs uppercase tracking-wider text-ink/60 hover:text-accent transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm hover:text-accent">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="bg-ink text-paper px-4 py-2 text-xs uppercase tracking-wider hover:bg-accent transition-colors"
              >
                Join
              </Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <div className="h-0.5 w-6 bg-ink" />
          <div className="mt-1.5 h-0.5 w-6 bg-ink" />
          <div className="mt-1.5 h-0.5 w-6 bg-ink" />
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink/10 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {isLandingPage && (
              <Link href="/#about" onClick={() => setOpen(false)}>About</Link>
            )}
            {email && role !== "admin" && (
              <Link href="/posts" onClick={() => setOpen(false)}>Articles</Link>
            )}
            {email && (role === "author" || role === "admin") && (
              <Link href="/posts/new" onClick={() => setOpen(false)}>Write</Link>
            )}
            {role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="font-mono text-xs uppercase tracking-widest text-accent"
              >
                Admin
              </Link>
            )}
            {email ? (
              <button onClick={signOut} className="text-left">Sign out</button>
            ) : (
              <>
                <Link href="/login">Sign in</Link>
                <Link href="/signup">Join</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}