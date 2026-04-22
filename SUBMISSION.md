# Submission · Hivon Journal

This document covers the four written-explanation areas requested in §9 of the
assignment brief.

---

## 1. AI Tools

**Tool used during development: Cursor** (with Claude Sonnet 4.5 as the model).

### Why Cursor

- Full-repo context. Cursor indexes the whole project, so when I ask it to "add role-based access to the admin page", it already knows the shape of `users.role`, the existing `is_admin()` SQL function, and the `PostRow` type — no copy-pasting between tabs.
- Inline diffs. Changes land as reviewable diffs inside the editor rather than as a wall of text I have to splice in manually. This mattered most when writing the `supabase/schema.sql` RLS policies, which had to be edited iteratively after I tested them.
- Chat + agent. Most of the scaffolding (Next.js routes, Tailwind config, TypeScript setup) was done in agent mode. The hand-crafted pieces — the landing page's scroll story, the Gemini summariser's prompt — were done in regular chat mode so I could argue with the model turn by turn.

### How it helped, concretely

- **Schema first.** I described the three tables + three roles in plain English; Cursor generated a first draft of `schema.sql` including the auto-profile trigger on signup. I then asked it to add RLS, then to tighten the policies so the `users` table's `role` column couldn't be self-escalated. That's a bug I would have missed if I'd written the schema free-hand.
- **Auth-aware components.** The Navbar's role-gated links (`Write`, `Admin`) were a one-shot generation — Cursor pattern-matched off the existing `CommentsSection.tsx` which already did the "fetch user, fetch role" dance.
- **Landing page prose.** I wrote the section structure and the tone I wanted ("editorial, a little dry, not SaaS-ad-copy"). Cursor drafted the microcopy; I rewrote ~60% of it by hand to match my own voice.

---

## 2. Feature Logic

### Authentication flow

1. User signs up at `/signup`. Form posts `email + password + name + role` (role can only be `viewer` or `author`).
2. `supabase.auth.signUp` creates a row in `auth.users`.
3. A Postgres trigger (`handle_new_user` in `schema.sql`) fires `AFTER INSERT` on `auth.users` and inserts a matching row into `public.users` with the chosen name/email/role. This is the single source of truth for role.
4. On sign-in, `@supabase/ssr` stores the session as an HTTP-only cookie. `src/middleware.ts` refreshes the session on every request so both server components and API routes can read `supabase.auth.getUser()`.
5. Sign-out clears the cookie.

### Role-based access

Three independent layers, each mirroring the brief's role table:

| Where | How |
|---|---|
| **UI** | `Navbar.tsx` reads the role and conditionally renders `Write` / `Admin` links. The `Edit this post` button on a post page only appears for the author or an admin. |
| **API** | Every mutating route (`POST /api/posts`, `PATCH /api/posts/[id]`, `DELETE`, `POST /api/summary`) fetches the requester's role from `public.users` and rejects with `403` if the rule fails. |
| **Database (RLS)** | Even if the API is bypassed, RLS policies in `schema.sql` enforce: `posts_insert_author` requires `role IN ('author','admin')`; `posts_update_author_or_admin` requires `auth.uid() = author_id OR is_admin()`. Admin status is checked via a `SECURITY DEFINER` function so the policy can read `public.users` safely. |

### Post creation logic

1. User (role ∈ {author, admin}) lands on `/posts/new`.
2. Server component checks role → if viewer, shows a "not authorised" page.
3. User fills in title + body, optionally uploads an image (stored at `post-images/<user-id>/<timestamp>.<ext>` via `supabase.storage`).
4. Submit → `POST /api/posts`:
   - Re-verifies auth + role server-side.
   - Validates title (≤200 chars) and body (non-empty).
   - Calls `generateSummary(title, body)` ONCE (see next section).
   - Inserts the row with `author_id = auth.user.id` and the returned `summary`.
5. Client redirects to `/posts/[id]`.

### AI summary generation flow

- Lives exclusively in `src/lib/ai/summary.ts`, exported as `generateSummary(title, body)`.
- Truncates the body to 4,000 characters before prompting (summaries don't need more context for ~200-word output).
- Uses `gemini-1.5-flash` with `temperature: 0.4`, `maxOutputTokens: 320`.
- Falls back to a plain-text first-400-chars snippet if the API key is missing or the request throws, so post creation is never blocked by an AI outage.
- The function is called from exactly three code paths: `POST /api/posts` (always), `PATCH /api/posts/[id]` (only if title or body changed), and `POST /api/summary` (admin-only manual regeneration).
- The result is persisted to `posts.summary`. Every read — listing, detail page, admin — selects the stored column.

---

## 3. Cost Optimization

The assignment explicitly asks for "Token reduction strategies · Generating summary only once · Storing summaries to avoid repeated API calls". Here's exactly how each is satisfied:

### Token reduction

- **Model choice** — `gemini-1.5-flash`, the cheapest/fastest model in Google's lineup. Well within the free tier for realistic blog volumes.
- **Input cap** — body is sliced to the first 4,000 chars before being sent. A 10,000-word essay sends roughly the same number of input tokens as a 1,000-word essay, because context beyond the first few paragraphs rarely changes the abstract.
- **Output cap** — `maxOutputTokens: 320` ≈ 200 words with a safety margin. Gemini won't keep generating past that.
- **Tight prompt** — one sentence of instruction, then `TITLE:` and `BODY:`. No system prompt, no role-play preamble, no few-shot examples.

### Generating the summary exactly once

- Called on `POST /api/posts`. Written to `posts.summary`.
- On `PATCH /api/posts/[id]`, a content diff is performed — if neither `title` nor `body` changed (e.g., the author only updated the featured image), the summariser is **skipped** entirely and the stored value is preserved.
- No polling, no cron, no "refresh summary on view".

### Storing to avoid repeated calls

- `posts.summary TEXT` column on the `posts` table.
- Every read path (`/posts`, `/posts/[id]`, admin console) does a single SQL `SELECT` — the AI is never in the request path for reads.
- The only way to force a second call for the same post is an **admin** clicking `↻ Summary` on the admin console. This hits `POST /api/summary`, gated with an `admin`-role check. No other user can trigger a re-summarisation.

### Back-of-envelope

For 10,000 reads of the same post, the project makes 1 Gemini call, not 10,000. At Gemini 1.5 Flash pricing this is essentially zero marginal cost.

---

## 4. Development Understanding

### A bug I encountered and how I resolved it

**Symptom:** after a successful signup, the new user could sign in, but the server components couldn't find their row in `public.users`, so their role always defaulted to `null` in the Navbar.

**Root cause:** I had originally put the role-defaulting logic in client code — reading `auth.user`, then inserting into `public.users` if the row didn't exist. Two problems:

1. A race between the signup redirect and the insert meant the first page load after signup sometimes happened before the row existed.
2. The insert was subject to RLS, and the policy required a row to *already exist* to prove the user was authed as themselves — a chicken-and-egg.

**Fix:** moved profile creation to a Postgres trigger on `auth.users`. The trigger runs with `SECURITY DEFINER`, inserts the profile row atomically as part of the signup transaction, and reads the user's chosen `name` / `role` from `raw_user_meta_data` which the client passes via `options: { data: {...} }` in `signUp`. The UI no longer does any profile bootstrapping — it just reads.

This also had a security benefit: the trigger clamps the role to `viewer` by default, so there's no "trust the client's role field" vulnerability.

### Key architectural decisions

**1. Next.js App Router over Pages Router.** Server components let me gate routes (like `/posts/new`, `/admin`) without writing a separate auth middleware for each. Loading a forbidden page just renders a server-rendered "denied" view — no client flicker.

**2. Supabase RLS as the enforcement floor, not just the API.** Every role rule in the brief is expressed twice: once in a route handler (for nice error messages), once in a Postgres policy (for correctness). If I later build a mobile app that talks to Supabase directly and skips the Next API, the rules still hold.

**3. AI as a side-effect, not a feature.** The blog works with or without a `GOOGLE_AI_API_KEY` set (falls back to a body-truncation summary). This made development fast — I didn't need to wait on API keys or worry about rate limits while iterating on the rest of the UI.

**4. A single `summary.ts` with one public function.** Makes the "call the AI once, never again" rule auditable. Grep `generateSummary` across the repo → three hits, all on write paths.

**5. Editorial UI over dashboard UI.** The assignment says "make the UI attractive". Default Tailwind admin dashboards with shadcn cards look like every other project on GitHub. Committing to an editorial-magazine aesthetic (Fraunces italics, grain noise, marquee strip, scroll-parallax hero) differentiates the submission on the "AI Tool Usage" and "Code Understanding" criteria too — I can explain every design choice rather than shrug and point at a default theme.

---

*— End of submission document —*
