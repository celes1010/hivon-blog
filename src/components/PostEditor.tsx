"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface Props {
  initialPost?: {
    id: string;
    title: string;
    body: string;
    image_url: string | null;
  };
}

export default function PostEditor({ initialPost }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const isEdit = !!initialPost;

  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [body, setBody] = useState(initialPost?.body ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialPost?.image_url ?? null
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    setUploading(true);
    setError(null);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setUploading(false);
      setError("Not signed in.");
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `${auth.user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("post-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (upErr) {
      setUploading(false);
      setError(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("post-images").getPublicUrl(path);
    setImageUrl(pub.publicUrl);
    setUploading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const url = isEdit ? `/api/posts/${initialPost!.id}` : "/api/posts";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, body, image_url: imageUrl }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setSubmitting(false);
      setError(j.error ?? "Something went wrong.");
      return;
    }

    const json = await res.json();
    router.push(`/posts/${json.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-[900px]">
      <label className="block mb-8">
        <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
          Title
        </span>
        <input
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A headline worth reading…"
          className="mt-2 block w-full border-0 border-b border-ink bg-transparent py-3 display text-3xl md:text-5xl leading-tight focus:border-accent focus:outline-none"
        />
      </label>

      <div className="mb-8">
        <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
          Featured image
        </span>
        <div className="mt-2">
          {imageUrl ? (
            <div className="relative">
              <div className="relative aspect-[16/9] overflow-hidden bg-ink/5">
                <Image
                  src={imageUrl}
                  alt="Featured"
                  fill
                  sizes="900px"
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="mt-2 font-mono text-xs uppercase tracking-widest text-ink/60 hover:text-accent"
              >
                Remove image
              </button>
            </div>
          ) : (
            <label className="flex aspect-[16/9] cursor-pointer items-center justify-center border border-dashed border-ink/30 hover:border-ink bg-paper-warm transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              <span className="text-ink/60">
                {uploading ? "Uploading…" : "Click to upload an image"}
              </span>
            </label>
          )}
        </div>
      </div>

      <label className="block mb-8">
        <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
          Body
        </span>
        <textarea
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={20}
          placeholder="Start writing… paragraphs separated by blank lines will render as paragraphs."
          className="mt-2 block w-full border border-ink/20 bg-paper p-5 text-lg leading-relaxed focus:border-ink focus:outline-none font-sans"
        />
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-ink/40">
          {body.trim().split(/\s+/).filter(Boolean).length} words
        </span>
      </label>

      {error && (
        <div className="mb-6 border border-accent bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </div>
      )}

      {!isEdit && (
        <div className="mb-6 border border-ink/10 bg-paper-warm p-4 text-sm text-ink/70">
          <span className="font-mono text-xs uppercase tracking-widest">
            Heads up ·
          </span>{" "}
          On publish, Gemini will generate a ~200-word abstract. This is stored
          and shown on the listing page — never regenerated unless you republish.
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="group flex items-center gap-3 bg-ink px-8 py-4 text-paper text-sm uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-60"
        >
          {submitting
            ? isEdit
              ? "Saving…"
              : "Publishing + summarising…"
            : isEdit
            ? "Save changes"
            : "Publish"}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-ink/20 px-6 py-4 text-sm uppercase tracking-widest hover:border-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
