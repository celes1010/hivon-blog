# Hivon Journal — Full-Stack Blogging Platform

> An editorial-first blogging platform built for the Hivon Automations full-stack
> internship assignment. Next.js + Supabase + Google Gemini, with role-based
> access, AI-generated abstracts, and a deliberately un-AI-slop UI.

**Live demo:** `https://<your-deployment>.vercel.app` _(replace after deploying)_
**Repository:** `https://github.com/<your-username>/hivon-blog` _(replace after pushing)_

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Single codebase for UI, server components, and API routes — matches the assignment's "Frontend + Backend: Next.js" requirement exactly. |
| Language | **TypeScript** | Catches role/schema mistakes at build time. |
| Auth | **Supabase Auth** (email + password, cookie sessions via `@supabase/ssr`) | Assignment requirement. SSR helpers make server components "auth-aware" with zero boilerplate. |
| Database | **Supabase Postgres** with **Row Level Security** | The three required tables (`users`, `posts`, `comments`) plus air-tight RLS policies that enforce role rules at the database level, not just in the UI. |
| File storage | **Supabase Storage** (`post-images` public bucket) | Featured image uploads. |
| AI | **Google Gemini 1.5 Flash** (`@google/generative-ai`) | Free tier, lowest latency of Google's models, sufficient quality for ~200-word summaries. |
| Styling | **Tailwind CSS** + custom CSS vars | Fast iteration with a designed colour/type system, not a default theme. |
| Animation | **Framer Motion** + IntersectionObserver | Scroll-parallax hero and reveal-on-scroll for section entries. |
| Fonts | **Fraunces** (display/italic), **Geist** (sans), **JetBrains Mono** (micro) | Editorial tone; avoids the generic "Inter everywhere" AI look. |
| Deploy | **Vercel** (or Netlify) | One-click Next.js deploy, env-var UI, preview branches. |

---

## Features (mapped to the brief)

- **Three user roles** — `viewer`, `author`, `admin` — enforced in UI, API, and RLS.
- **Required post fields** — `title`, `body`, featured `image_url`, `summary`, plus a comments section.
- **Search posts** — ILIKE search over title + body, on the listing page.
- **Pagination** — 6 posts per page, numbered previous/next.
- **Edit functionality** — author of the post OR any admin. Non-authors are blocked in the UI, the API, AND at the database level.
- **AI summary** — generated once on create via Gemini 1.5, stored in `posts.summary`, displayed on the listing and on the post page. Admins can force-regenerate.
- **Comments** — any signed-in user can comment; authors and admins can see them; user can delete their own, admins can delete any.
- **Deployment** — Vercel-ready.
- **Clean README** — this file.

---

## Project structure

```
hivon-blog/
├── supabase/schema.sql          ← run this once in Supabase SQL editor
├── src/
│   ├── app/
│   │   ├── page.tsx             ← landing page (scroll story)
│   │   ├── (auth)/login/
│   │   ├── (auth)/signup/
│   │   ├── posts/               ← list, [id], [id]/edit, new
│   │   ├── admin/               ← admin console
│   │   └── api/
│   │       ├── posts/           ← POST, PATCH, DELETE
│   │       ├── posts/[id]/comments/
│   │       └── summary/         ← admin-only re-summarise
│   ├── components/              ← Navbar, Footer, PostEditor, etc.
│   ├── lib/
│   │   ├── supabase/{client,server}.ts
│   │   ├── ai/summary.ts        ← single place the AI is called
│   │   └── types.ts
│   └── middleware.ts            ← refreshes Supabase session
├── tailwind.config.js
├── next.config.js
└── package.json
```

---

## Running locally

### 1. Prerequisites

- Node.js 18.17+ (20+ recommended)
- A free Supabase project — https://supabase.com
- A free Google AI Studio API key — https://aistudio.google.com/app/apikey

### 2. Clone & install

```bash
git clone https://github.com/<your-username>/hivon-blog.git
cd hivon-blog
npm install
```

### 3. Set up Supabase

1. Create a new Supabase project.
2. Open **SQL Editor → New Query**, paste the entire contents of `supabase/schema.sql`, and run it. This creates the tables, RLS policies, the auto-profile trigger, and the `post-images` storage bucket.
3. Open **Authentication → Providers → Email** and (for local testing) disable "Confirm email" so signups work immediately. Re-enable in production.

### 4. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
GOOGLE_AI_API_KEY=<from aistudio.google.com>
```

Both Supabase keys are under **Project Settings → API**. The service role key bypasses RLS and is used only server-side.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000.

### 6. Promoting an admin

Admin role cannot be claimed at signup. After a user registers normally, go to Supabase → **Table Editor → users** and change their `role` column to `admin`.

---

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Go to https://vercel.com/new, import the repo.
3. Framework preset is auto-detected as **Next.js**.
4. Under **Environment Variables**, add all four from `.env.local`.
5. Deploy. First build takes ~2 minutes.
6. In Supabase → **Authentication → URL Configuration**, add your Vercel URL to **Site URL** and **Redirect URLs**.

### Deploying to Netlify instead

Same idea: connect the GitHub repo, set the four env vars, use the `@netlify/plugin-nextjs` build plugin (auto-detected). Build command `npm run build`, publish directory `.next`.

---

## Architectural decisions

### Why generate the summary at create time (and only then)?

The assignment explicitly requires "Token reduction strategies · Generating summary only once · Storing summaries to avoid repeated API calls". So the summariser lives in exactly **one** place on the write path (`POST /api/posts`), writes to `posts.summary`, and is never called again unless:

- The **body or title actually changes** on `PATCH /api/posts/[id]` (tracked with a simple diff check), or
- An admin **explicitly** clicks "regenerate" from the admin console.

Every read — the listing page, the post page — just selects the stored `summary` column. Zero AI calls on the read path, ever.

### Why RLS, when the API already checks auth?

Defence in depth. The API routes enforce role rules, but so does the database. If someone bypasses the API (say, hits the Supabase URL directly with the anon key), RLS policies in `schema.sql` still prevent a viewer from updating someone else's post. The `is_admin()` Postgres function keeps these policies readable.

### Why not Markdown/rich text for the body?

Kept it plain text with paragraph splitting on blank lines. Scope was tight, and a rich editor (Tiptap / Lexical) would've doubled the UI surface without earning evaluation points on the rubric.

### Why Fraunces + Geist rather than Inter?

The brief asked for an "attractive UI". Default AI-generated sites tend to look the same — Inter on white, purple gradient, rounded cards. Committing to a real editorial type pairing (Fraunces display italics for emphasis, Geist for body, JetBrains Mono for micro-metadata) gets the project out of that trap.

---

## See also

- **SUBMISSION.md** — the four written explanations requested in §9 of the brief (AI tools, feature logic, cost optimisation, development understanding).
