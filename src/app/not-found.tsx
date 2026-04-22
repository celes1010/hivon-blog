import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-paper noise">
        <div className="mx-auto max-w-[900px] px-6 py-24 md:px-10">
          <div className="font-mono text-xs uppercase tracking-widest text-ink/60">
            § 404
          </div>
          <h1 className="mt-4 display text-6xl md:text-8xl">
            This page is <span className="italic-serif text-accent">missing.</span>
          </h1>
          <p className="mt-6 text-ink/70 max-w-md">
            The piece you're looking for has been moved, unpublished, or never
            existed. Try the archive instead.
          </p>
          <Link
            href="/posts"
            className="mt-8 inline-flex border border-ink px-6 py-3 text-sm uppercase tracking-widest hover:bg-ink hover:text-paper"
          >
            Go to articles →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
