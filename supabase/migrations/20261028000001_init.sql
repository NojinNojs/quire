-- Quire schema, first migration.
-- Source of truth: docs/SCHEMA.md. Every table carries an owner and RLS.

create extension if not exists pgcrypto;

-- profiles -------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  annual_goal int check (annual_goal is null or annual_goal between 1 and 500),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  insert into public.streaks (owner) values (new.id) on conflict (owner) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- works: one row per title, not per edition ----------------------------------
create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  title_key text generated always as (lower(regexp_replace(title, '[^a-zA-Z0-9]+', '', 'g'))) stored,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (title_key, author)
);

-- books: one row per edition owned -------------------------------------------
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  work_id uuid references public.works (id) on delete set null,
  title text not null,
  author text,
  publisher text,
  city text,
  year int check (year is null or year between 1000 and 2100),
  edition text,
  pages int check (pages is null or pages > 0),
  isbn text,
  ddc text,
  language text not null default 'id',
  cover_url text,
  cover_path text,
  status text not null default 'want' check (status in ('want', 'reading', 'finished', 'wishlist')),
  rating int check (rating is null or rating between 1 and 5),
  notes text,
  started_at date,
  finished_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists one_active_book on public.books (owner) where status = 'reading';
create unique index if not exists no_duplicate_isbn on public.books (owner, isbn) where isbn is not null;
create index if not exists books_by_owner_status on public.books (owner, status);
create index if not exists books_by_class on public.books (owner, ddc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists books_touch_updated_at on public.books;
create trigger books_touch_updated_at
  before update on public.books
  for each row execute function public.touch_updated_at();

-- progress -------------------------------------------------------------------
create table if not exists public.progress_log (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  day date not null,
  pages int not null check (pages > 0),
  created_at timestamptz not null default now(),
  unique (owner, book_id, day)
);

create index if not exists progress_by_day on public.progress_log (owner, day);

-- streaks --------------------------------------------------------------------
create table if not exists public.streaks (
  owner uuid primary key references public.profiles (id) on delete cascade,
  current int not null default 0 check (current >= 0),
  longest int not null default 0 check (longest >= 0),
  last_day date,
  restore_left int not null default 1 check (restore_left between 0 and 1),
  restore_month text
);

-- the only place streak arithmetic lives; the client never computes it
create or replace function public.log_pages(p_book uuid, p_pages int, p_day date default current_date)
returns table (streak_current int, streak_longest int, restored boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_streak public.streaks;
  v_gap int;
  v_month text := to_char(p_day, 'YYYY-MM');
  v_restored boolean := false;
  v_quota int;
  v_current int;
  v_longest int;
begin
  if v_owner is null then
    raise exception 'not authenticated';
  end if;
  if p_pages is null or p_pages <= 0 then
    raise exception 'pages must be positive';
  end if;
  if not exists (select 1 from public.books b where b.id = p_book and b.owner = v_owner) then
    raise exception 'book not found';
  end if;

  insert into public.progress_log as pl (owner, book_id, day, pages)
  values (v_owner, p_book, p_day, p_pages)
  on conflict on constraint progress_log_owner_book_id_day_key
  do update set pages = pl.pages + excluded.pages;

  update public.books b
     set status = 'reading',
         started_at = coalesce(b.started_at, p_day)
   where b.id = p_book and b.owner = v_owner and b.status = 'want';

  insert into public.streaks as s (owner) values (v_owner)
  on conflict (owner) do nothing;

  select * into v_streak from public.streaks s where s.owner = v_owner for update;

  -- one restore per calendar month: a new month refills the quota
  if v_streak.restore_month is null or v_streak.restore_month <> v_month then
    v_quota := 1;
  else
    v_quota := v_streak.restore_left;
  end if;

  if v_streak.last_day is null then
    v_current := 1;
    v_longest := greatest(v_streak.longest, 1);
  else
    v_gap := p_day - v_streak.last_day;
    if v_gap <= 0 then
      v_current := v_streak.current;
      v_longest := v_streak.longest;
    elsif v_gap = 1 then
      v_current := v_streak.current + 1;
      v_longest := greatest(v_streak.longest, v_current);
    elsif v_gap = 2 and v_quota > 0 then
      v_current := v_streak.current + 1;
      v_longest := greatest(v_streak.longest, v_current);
      v_restored := true;
    else
      v_current := 1;
      v_longest := v_streak.longest;
    end if;
  end if;

  update public.streaks s
     set current = v_current,
         longest = v_longest,
         last_day = p_day,
         restore_left = case when v_restored then 0 else v_quota end,
         restore_month = v_month
   where s.owner = v_owner;

  return query select v_current, v_longest, v_restored;
end;
$$;

-- photos ---------------------------------------------------------------------
create table if not exists public.book_photos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- row level security ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.works enable row level security;
alter table public.books enable row level security;
alter table public.progress_log enable row level security;
alter table public.streaks enable row level security;
alter table public.book_photos enable row level security;

drop policy if exists own_profile on public.profiles;
create policy own_profile on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists read_works on public.works;
create policy read_works on public.works for select using (auth.uid() is not null);
drop policy if exists write_own_works on public.works;
create policy write_own_works on public.works for all
  using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists own_books on public.books;
create policy own_books on public.books for all
  using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists own_progress on public.progress_log;
create policy own_progress on public.progress_log for all
  using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists own_streak on public.streaks;
create policy own_streak on public.streaks for select using (owner = auth.uid());

drop policy if exists own_photos on public.book_photos;
create policy own_photos on public.book_photos for all
  using (owner = auth.uid()) with check (owner = auth.uid());
