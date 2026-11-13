-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.
create table if not exists public.entries (
  id           uuid primary key default gen_random_uuid(),
  type         text not null check (type in ('project','article','idea','skill')),
  title        text not null check (char_length(title) between 1 and 200),
  slug         text check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary      text,
  body         text,
  kind         text,
  url          text check (url is null or url = '' or url ~ '^https?://'),
  tags         text[] not null default '{}',
  sort_order   int  not null default 0,
  published    boolean not null default true,
  entry_date   date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Two articles cannot share a slug.
create unique index if not exists entries_article_slug on public.entries (slug) where type = 'article';

-- Security: row level security ON. Visitors can only read published rows.
alter table public.entries enable row level security;

drop policy if exists "visitors read published" on public.entries;
create policy "visitors read published" on public.entries
  for select to anon, authenticated using (published = true);

drop policy if exists "admin reads all" on public.entries;
create policy "admin reads all" on public.entries
  for select to authenticated using (true);

drop policy if exists "admin inserts" on public.entries;
create policy "admin inserts" on public.entries
  for insert to authenticated with check (true);

drop policy if exists "admin updates" on public.entries;
create policy "admin updates" on public.entries
  for update to authenticated using (true) with check (true);

drop policy if exists "admin deletes" on public.entries;
create policy "admin deletes" on public.entries
  for delete to authenticated using (true);
