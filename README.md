# Hivon Journal

A full-stack blogging platform with role-based access and AI-generated post summaries.
Built with Next.js, Supabase, and Google Gemini.

**Live:** https://hivon-blog-murex.vercel.app

---

## Tech stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** — Auth, Postgres, Storage, Row Level Security
- **Google Gemini 2.5 Flash-Lite** — ~200-word post summaries
- **Tailwind CSS** + Framer Motion
- **Vercel** — deployment

---

## Features

- Three roles: `viewer`, `author`, `admin`
- Post creation with featured image, title, body, and auto-generated AI summary
- Comments, search, and pagination
- Role-based edit and moderation
- Row Level Security enforcing role rules at the database level

---

## Running locally

### Prerequisites

- Node.js 18.17+
- A Supabase project
- A Google AI Studio API key

### Setup

```bash
git clone https://github.com/celes1010/hivon-blog.git
cd hivon-blog
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
GOOGLE_AI_API_KEY=<from aistudio.google.com>
```

In Supabase, run `supabase/schema.sql` in the SQL editor. Then:

```bash
npm run dev
```

Open http://localhost:3000.

Admin role is assigned manually via the Supabase `users` table.

---

## Deployment

1. Push to GitHub.
2. Import the repo at https://vercel.com/new.
3. Add the four environment variables.
4. Deploy.
5. In Supabase → **Authentication → URL Configuration**, set the **Site URL** and add the deployed URL to **Redirect URLs**.

---

*Built by Celestine Leslin · 2026*