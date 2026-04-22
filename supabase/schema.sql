-- ============================================================
-- HIVON BLOG: Supabase schema
-- Run this in Supabase SQL Editor (Project -> SQL -> New Query)
-- ============================================================

-- ----- USERS -----
-- One row per authenticated user. Mirrors auth.users.id.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'viewer' check (role in ('viewer','author','admin')),
  created_at timestamptz not null default now()
);

-- ----- POSTS -----
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_url text,
  summary text,                        -- AI-generated, stored once
  author_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_author_idx on public.posts(author_id);
create index if not exists posts_created_idx on public.posts(created_at desc);
-- simple full-text-ish search (title + body)
create index if not exists posts_title_trgm on public.posts using gin (to_tsvector('english', title || ' ' || coalesce(body,'')));

-- ----- COMMENTS -----
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  comment_text text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments(post_id);

-- ----- AUTO-CREATE PROFILE ON SIGNUP -----
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'viewer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----- UPDATED_AT TRIGGER -----
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.users    enable row level security;
alter table public.posts    enable row level security;
alter table public.comments enable row level security;

-- helper: is current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

-- ----- USERS policies -----
drop policy if exists "users_select_all" on public.users;
create policy "users_select_all" on public.users
  for select using (true);

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "users_admin_update" on public.users;
create policy "users_admin_update" on public.users
  for update using (public.is_admin()) with check (public.is_admin());

-- ----- POSTS policies -----
drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all" on public.posts
  for select using (true);

-- only authors/admins can insert, and author_id must be self (unless admin)
drop policy if exists "posts_insert_author" on public.posts;
create policy "posts_insert_author" on public.posts
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('author','admin')
    )
  );

-- authors can update their OWN posts, admins can update ANY
drop policy if exists "posts_update_author_or_admin" on public.posts;
create policy "posts_update_author_or_admin" on public.posts
  for update using (
    auth.uid() = author_id or public.is_admin()
  ) with check (
    auth.uid() = author_id or public.is_admin()
  );

drop policy if exists "posts_delete_author_or_admin" on public.posts;
create policy "posts_delete_author_or_admin" on public.posts
  for delete using (
    auth.uid() = author_id or public.is_admin()
  );

-- ----- COMMENTS policies -----
drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments
  for select using (true);

-- any logged-in user can comment
drop policy if exists "comments_insert_authed" on public.comments;
create policy "comments_insert_authed" on public.comments
  for insert with check (auth.uid() = user_id);

-- user can delete own comment, admin can delete any
drop policy if exists "comments_delete_self_or_admin" on public.comments;
create policy "comments_delete_self_or_admin" on public.comments
  for delete using (auth.uid() = user_id or public.is_admin());

-- ============================================================
-- STORAGE: featured images bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "post_images_public_read" on storage.objects;
create policy "post_images_public_read" on storage.objects
  for select using (bucket_id = 'post-images');

drop policy if exists "post_images_authed_write" on storage.objects;
create policy "post_images_authed_write" on storage.objects
  for insert with check (bucket_id = 'post-images' and auth.role() = 'authenticated');

drop policy if exists "post_images_owner_update" on storage.objects;
create policy "post_images_owner_update" on storage.objects
  for update using (bucket_id = 'post-images' and auth.uid() = owner);

drop policy if exists "post_images_owner_delete" on storage.objects;
create policy "post_images_owner_delete" on storage.objects
  for delete using (bucket_id = 'post-images' and (auth.uid() = owner or public.is_admin()));
