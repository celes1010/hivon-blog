import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-paper">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="font-display text-5xl md:text-6xl leading-none">
              Words,
              <br />
              <span className="italic-serif">quietly amplified.</span>
            </div>
            <p className="mt-6 max-w-md text-paper/60">
              A publishing surface designed for clarity of thought — where every
              article gets a considered, AI-written abstract the moment it&apos;s
              published.
            </p>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs uppercase tracking-widest text-paper/40 mb-4">
              Write
            </div>
            <ul className="space-y-2 text-sm">
              <li><Link href="/signup" className="hover:text-accent">Become an author</Link></li>
              <li><Link href="/login" className="hover:text-accent">Sign in</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs uppercase tracking-widest text-paper/40 mb-4">
              Colophon
            </div>
            <p className="text-sm text-paper/60">
              Built with Next.js, Supabase and Google Gemini. Designed &amp;
              developed for the Hivon Automations full-stack assignment.
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-paper/10 pt-6 md:flex-row md:items-center">
          <div className="font-mono text-xs text-paper/40">
            © {new Date().getFullYear()} Hivon Blog · New Delhi
          </div>
          <div className="flex gap-6 text-xs text-paper/40">
            <span>v1.0</span>
            <span>Next 14 · Supabase · Gemini 2.5</span>
          </div>
        </div>
      </div>
    </footer>
  );
}