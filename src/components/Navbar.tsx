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

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center bg-ink text-paper font-display text-sm">
            H
          </div>
          <span className="font-display text-xl tracking-tight">Hivon</span>
          <span className="italic-serif text-xs text-ink/50">/ journal</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {isLandingPage && (
            <Link href="/#about" className="text-sm hover:text-accent transition-colors">
              About
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
              className="font-mono text-xs uppercase tracking-widest text-red-600 hover:text-red-800 transition-colors"
            >
              [ Admin ]
            </Link>
          )}

          {email ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-ink/15 bg-paper-warm px-3 py-1.5">
                <span className="text-sm text-ink">{name ?? email}</span>
                {role && (
                  <span
                    className={
                      role === "admin"
                        ? "font-mono text-[9px] uppercase tracking-widest text-red-600 border border-red-600 px-1.5 py-0.5"
                        : role === "author"
                        ? "font-mono text-[9px] uppercase tracking-widest text-ink border border-ink px-1.5 py-0.5"
                        : "font-mono text-[9px] uppercase tracking-widest text-ink/50 border border-ink/30 px-1.5 py-0.5"
                    }
                  >
                    {role}
                  </span>
                )}
              </div>
              <button
                onClick={signOut}
                className="border border-ink px-4 py-2 text-xs uppercase tracking-wider hover:bg-ink hover:text-paper transition-colors"
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
            {email && (role === "author" || role === "admin") && (
              <Link href="/posts/new" onClick={() => setOpen(false)}>Write</Link>
            )}
            {role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="font-mono text-xs uppercase tracking-widest text-red-600"
              >
                [ Admin ]
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