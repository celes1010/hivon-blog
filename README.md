# Hivon Journal

> A small, opinionated blogging platform built for the Hivon Automations full-stack
> internship assignment. Next.js + Supabase + Google Gemini, with role-based
> access and AI-generated post summaries.

**Live demo:** https://hivon-blog-murex.vercel.app
**Repository:** https://github.com/celes1010/hivon-blog

---

## What it does

Hivon is a three-role blogging platform:

- **Authors** publish posts. On publish, Google Gemini generates a ~200-word abstract, which is stored in the database and shown on the listing page.
- **Viewers** browse, read, and comment. They see the abstract first, then decide whether to open the full post.
- **Admins** oversee everything — edit any post, moderate comments, and manually regenerate a summary if needed.

Search, pagination, featured images, and comment threads are all included.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Auth | Supabase Auth with cookie-based SSR sessions |
| Database | Supabase Postgres + Row Level Security |
| Storage | Supabase Storage (for featured images) |
| AI | Google Gemini 2.5 Flash-Lite |
| Styling | Tailwind CSS + custom CSS variables |
| Animation | Framer Motion |
| Deployment | Vercel |

---

## Features (from the brief)

- Three user roles — `viewer`, `author`, `admin` — enforced in the UI, the API, and at the database via RLS.
- Required post fields — title, body, featured image, AI-generated summary, and comments.
- Search across titles and bodies.
- Pagination (6 posts per page).
- Edit permissions — the original author or any admin.
- AI summary — generated once on publish, stored in `posts.summary`, never regenerated except on explicit admin request.
- Comments — any signed-in user can post; users can delete their own, admins can delete any.

---

## Running locally

### 1. Prerequisites

- Node.js 18.17 or newer
- A free Supabase project — https://supabase.com
- A free Google AI Studio API key — https://aistudio.google.com/app/apikey

### 2. Clone and install

```bash
git clone https://github.com/celes1010/hivon-blog.git
cd hivon-blog
npm install
```

### 3. Set up Supabase

1. Create a new Supabase project.
2. Go to **SQL Editor → New Query**, paste everything in `supabase/schema.sql`, and run it. This creates the tables, triggers, RLS policies, and the `post-images` storage bucket.
3. Go to **Authentication → Providers → Email** and turn **off** "Confirm email" for local testing.

### 4. Environment variables

Create `.env.local` at the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
GOOGLE_AI_API_KEY=<from aistudio.google.com>
```

Both Supabase keys live under **Project Settings → API**. The service role key bypasses RLS and is only used server-side.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000.

### 6. Becoming an admin

Admin role can't be chosen at signup. Sign up normally, then go to Supabase → **Table Editor → users** and change your row's `role` column to `admin`.

---

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Go to https://vercel.com/new and import the repo. Framework is auto-detected as Next.js.
3. Under **Environment Variables**, add all four from `.env.local`.
4. Click **Deploy**. First build takes ~2 minutes.
5. Back in Supabase → **Authentication → URL Configuration**:
   - Set **Site URL** to your Vercel URL.
   - Add `https://<your-deployment>.vercel.app/**` and `http://localhost:3000/**` to **Redirect URLs**.
6. Save.

Every subsequent `git push` to `main` auto-deploys.

---

## Project structure

```
hivon-blog/
├── supabase/schema.sql          ← run once in Supabase SQL editor
├── src/
│   ├── app/
│   │   ├── page.tsx             ← landing page
│   │   ├── (auth)/login + signup
│   │   ├── posts/               ← list, [id], [id]/edit, new
│   │   ├── admin/               ← admin dashboard
│   │   └── api/                 ← POST/PATCH/DELETE routes
│   ├── components/              ← Navbar, Footer, PostEditor, etc.
│   ├── lib/
│   │   ├── supabase/{client,server}.ts
│   │   ├── ai/summary.ts        ← the only place the AI is called
│   │   └── types.ts
│   └── middleware.ts            ← refreshes Supabase session
└── package.json
```

---

## Architectural highlights

**AI is called exactly once per post.** `generateSummary()` lives in one file (`src/lib/ai/summary.ts`) and is invoked from three places only: post creation, post update (only if title or body actually changed), and admin-triggered regeneration. Every read path does a plain `SELECT` on the stored `summary` column.

**Role-based access is enforced three times.** Once in the UI (so unauthorised actions aren't visible), once in the API (for friendly 403 responses), and once at the database via Row Level Security (so RLS is the final floor even if the API is bypassed).

**Profile creation runs in a Postgres trigger.** When `auth.users` gets a new row, `handle_new_user` fires `AFTER INSERT` with `SECURITY DEFINER` and inserts the matching `public.users` row atomically — no race conditions, no client-side bootstrapping, and the role can't be self-escalated.

**The AI is optional, not load-bearing.** If `GOOGLE_AI_API_KEY` is missing or Gemini errors out, `generateSummary` falls back to a truncated snippet of the body. Post creation never fails because of the summariser.

---

## AI-assisted development

I used **Claude (Anthropic)** in the browser as a pair programmer throughout, with **VS Code** as my editor. Claude was particularly useful for drafting the Supabase schema and RLS policies, debugging the signup race condition described in my submission write-up, and iterating on UI polish. The visual design system — typography pairing, colour palette, grain noise, scroll-parallax animations — came from manual iteration in the browser.

See `SUBMISSION.md` for the full write-up covering AI tool usage, feature logic, cost optimisation, and development understanding.

