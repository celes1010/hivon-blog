"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Reveal-on-scroll using IntersectionObserver
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <Navbar />

      {/* ============ HERO ============ */}
      <section
        ref={heroRef}
        className="relative min-h-[100svh] overflow-hidden bg-paper noise"
      >
        {/* Decorative grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
          <div className="h-full w-full" style={{
            backgroundImage:
              "linear-gradient(to right, #0a0a0a 1px, transparent 1px), linear-gradient(to bottom, #0a0a0a 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }} />
        </div>

        {/* Rotating orange disk */}
        <motion.div
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{
            scale: { duration: 1.4, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 },
            rotate: { duration: 40, ease: "linear", repeat: Infinity },
          }}
          className="pointer-events-none absolute -right-32 -top-20 h-[280px] w-[280px] md:-right-40 md:top-32 md:h-[520px] md:w-[520px] rounded-full bg-accent opacity-60 md:opacity-80 blur-[2px]"
        />
        <motion.div
          initial={{ scale: 0, y: 40 }}
          animate={{ scale: 1, y: [0, -20, 0] }}
          transition={{
            scale: { duration: 1, delay: 1.2 },
            y: { duration: 5, ease: "easeInOut", repeat: Infinity, delay: 2 },
          }}
          className="pointer-events-none absolute -left-10 bottom-64 h-24 w-24 md:left-10 md:bottom-32 md:h-40 md:w-40 rounded-full bg-accent-lime opacity-80 md:opacity-90"
        />
        {/* Small floating accent dot */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, y: [0, 15, 0] }}
          transition={{
            scale: { duration: 0.8, delay: 1.5 },
            y: { duration: 4, ease: "easeInOut", repeat: Infinity },
          }}
          className="pointer-events-none absolute right-8 top-[30%] h-4 w-4 md:right-[20%] md:top-[45%] md:h-6 md:w-6 rounded-full bg-ink"
        />
        <motion.div
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
          className="relative mx-auto max-w-[1400px] px-6 pt-24 pb-32 md:px-10 md:pt-36 md:pb-20"
        >
          {/* Top meta bar */}
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-ink/60">
            <span>Vol. 01 / Issue 2026</span>
            <span className="hidden md:inline">New Delhi — The Internet</span>
            <span>Summaries by Gemini ↗</span>
          </div>

          <div className="mt-14 grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-10">
              <h1 className="display text-[15vw] md:text-[11vw] leading-[0.88]">
                <motion.span
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
                  className="inline-block"
                >
                  Writing,
                </motion.span>
                <br />
                <motion.span
                  initial={{ opacity: 0, y: 60, rotate: -3 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1], delay: 0.35 }}
                  className="italic-serif text-accent inline-block"
                >
                  reimagined
                </motion.span>{" "}
                <motion.span
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.5 }}
                  className="inline-block"
                >
                  for
                </motion.span>
                <br />
                <motion.span
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.7 }}
                  className="inline-block"
                >
                  the reader who
                </motion.span>{" "}
                <motion.span
                  initial={{ opacity: 0, y: 60, rotate: 3 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1], delay: 0.9 }}
                  className="italic-serif inline-block"
                >
                  scrolls.
                </motion.span>
              </h1>
            </div>
          </div>

          {/* ===== BOTTOM BLOCK — paragraph + CTA + scroll cue, all aligned, no overlap ===== */}
          <div className="mt-16 grid grid-cols-12 gap-6 items-end">
            {/* Scroll cue on the far left, aligned with baseline */}
            <div className="col-span-12 md:col-span-2 hidden md:flex items-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="flex items-center gap-3"
              >
                <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
                  Scroll
                </span>
                <div className="h-[1px] w-10 bg-ink animate-pulse-slow" />
              </motion.div>
            </div>

            {/* Paragraph in the middle, with its own safe column */}
            <div className="col-span-12 md:col-span-6">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg leading-relaxed text-ink/75"
              >
                Hivon is a small, opinionated journal. Authors publish; readers
                comment; a language model sits quietly in the background, turning
                every post into a precise two-hundred-word abstract so your
                audience can decide — instantly — whether to stay.
              </motion.p>
            </div>

            {/* CTAs on the right */}
            <div className="col-span-12 md:col-span-4 flex md:justify-end items-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col items-start gap-4 md:items-end"
              >
                <Link
                  href="/posts"
                  className="group relative inline-flex items-center gap-3 bg-ink px-8 py-4 text-paper text-sm uppercase tracking-widest hover:bg-accent transition-all hover:gap-5 hover:shadow-[4px_4px_0_0_#ff5722]"
                >
                  Read the Journal
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  href="/signup"
                  className="text-sm underline underline-offset-4 hover:text-accent"
                >
                  or start writing →
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ MARQUEE ============ */}
      <section className="border-y border-ink overflow-hidden bg-ink py-6 text-paper">
        <div className="marquee-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-16 pr-16 font-display text-5xl md:text-7xl">
              <span>ESSAYS</span>
              <span className="text-accent">✦</span>
              <span className="italic-serif">criticism</span>
              <span className="text-accent">✦</span>
              <span>NOTES</span>
              <span className="text-accent">✦</span>
              <span className="italic-serif">dispatches</span>
              <span className="text-accent">✦</span>
              <span>INTERVIEWS</span>
              <span className="text-accent">✦</span>
              <span className="italic-serif">reading</span>
              <span className="text-accent">✦</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============ ABOUT / MANIFESTO ============ */}
      <section id="about" className="relative bg-paper py-32">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-2">
              <div className="reveal font-mono text-xs uppercase tracking-widest text-ink/50">
                § 01 — Manifesto
              </div>
            </div>
            <div className="col-span-12 md:col-span-10">
              <h2 className="reveal display text-5xl md:text-8xl">
                Every post deserves a
                <br />
                <span className="italic-serif text-accent">second voice</span> —
                one
                <br />
                that summarises, not shouts.
              </h2>
              <p className="reveal mt-12 max-w-2xl text-lg leading-relaxed text-ink/70">
                We live in an attention economy that pretends length is a virtue.
                Hivon disagrees. Authors write freely; the platform, powered by
                Google&apos;s Gemini 2.5 model, generates a calm, ~200-word abstract the moment a piece is
                published. Readers get the gist in seconds and
                commit only when earned.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="relative bg-ink py-32 text-paper noise">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="reveal font-mono text-xs uppercase tracking-widest text-paper/40 mb-8">
            § 02 — The Ritual
          </div>
          <h2 className="reveal display text-5xl md:text-7xl mb-20">
            Three roles. <span className="italic-serif">One loop.</span>
          </h2>

          <div className="grid gap-px bg-paper/10 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "The Author",
                copy: "Writes. Publishes. Edits their own work at will. Gemini does the abstract in the background — never to be regenerated unless the author explicitly asks.",
                role: "author",
              },
              {
                n: "02",
                title: "The Viewer",
                copy: "Skims summaries, opens what moves them, leaves comments. No pressure, no endless feed — just thoughtful pieces and a reply box.",
                role: "viewer",
              },
              {
                n: "03",
                title: "The Admin",
                copy: "Has oversight of every post and every comment. Edits, moderates, promotes, removes — the quiet editor-in-chief of the publication.",
                role: "admin",
              },
            ].map((r, i) => (
              <div
                key={i}
                className="reveal bg-ink p-10 transition-colors hover:bg-accent hover:text-ink"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="font-mono text-xs">{r.n}</div>
                <div className="display mt-8 text-4xl">{r.title}</div>
                <p className="mt-6 text-paper/70 leading-relaxed hover:text-ink/80">
                  {r.copy}
                </p>
                <div className="mt-10 font-mono text-xs uppercase tracking-widest">
                  role: {r.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ============ PULL QUOTE ============ */}
      <section className="bg-paper py-40">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10 text-center">
          <div className="reveal font-mono text-xs uppercase tracking-widest text-ink/50 mb-8">
            § 04 — A note on machines
          </div>
          <blockquote className="reveal display text-4xl md:text-6xl leading-[1.05]">
            &ldquo;The summary is never the story.{" "}
            <span className="italic-serif text-accent">It&apos;s the door.&rdquo;</span>
          </blockquote>
          <p className="reveal mt-10 font-mono text-xs uppercase tracking-widest text-ink/50">
            — Hivon
          </p>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="border-y border-ink bg-paper-warm py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            {[
              ["~200", "words, per abstract"],
              ["1", "API call per post, ever"],
              ["3", "roles, strictly enforced"],
              ["∞", "words you still get to write"],
            ].map(([n, l], i) => (
              <div key={i} className="reveal">
                <div className="display text-6xl md:text-8xl">{n}</div>
                <div className="mt-3 font-mono text-xs uppercase tracking-widest text-ink/60">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative bg-ink py-40 text-paper overflow-hidden">
        <div className="pointer-events-none absolute -left-32 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-accent opacity-30 blur-3xl" />
        <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-8">
              <h2 className="reveal display text-5xl md:text-8xl leading-[0.9]">
                Start reading.
                <br />
                <span className="italic-serif text-accent">Or start writing.</span>
                <br />
                Both take thirty seconds.
              </h2>
            </div>
            <div className="col-span-12 md:col-span-4 flex flex-col justify-end gap-4">
              <Link
                href="/posts"
                className="reveal group flex items-center justify-between border border-paper px-6 py-5 text-sm uppercase tracking-widest hover:bg-accent hover:border-accent hover:text-ink transition-all"
              >
                Read articles
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/signup"
                className="reveal group flex items-center justify-between bg-paper text-ink px-6 py-5 text-sm uppercase tracking-widest hover:bg-accent transition-all"
              >
                Create account
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}