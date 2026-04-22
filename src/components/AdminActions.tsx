"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminActions({ postId }: { postId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Delete this post permanently?")) return;
    setBusy(true);
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("Could not delete.");
  }

  async function regen() {
    setBusy(true);
    const res = await fetch("/api/summary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    setBusy(false);
    if (res.ok) {
      alert("Summary regenerated.");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      alert(`Failed: ${j.error ?? "unknown"}`);
    }
  }

  return (
    <div className="flex flex-wrap justify-start md:justify-end gap-2 font-mono text-[10px] uppercase tracking-widest">
      <Link
        href={`/posts/${postId}/edit`}
        className="border border-ink/20 px-2 py-1 hover:border-ink"
      >
        Edit
      </Link>
      <button
        onClick={regen}
        disabled={busy}
        className="border border-ink/20 px-2 py-1 hover:border-ink disabled:opacity-50"
        title="Regenerate AI summary"
      >
        ↻ Summary
      </button>
      <button
        onClick={remove}
        disabled={busy}
        className="border border-accent text-accent px-2 py-1 hover:bg-accent hover:text-paper disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
