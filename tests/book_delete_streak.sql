-- Run against a disposable local database after migrations; rollback leaves no fixtures.
begin;
do $$
declare
  owner_id uuid := gen_random_uuid();
  first_book uuid := gen_random_uuid();
  second_book uuid := gen_random_uuid();
  streak_row public.streaks;
begin
  insert into auth.users (id, aud, role, email, encrypted_password, created_at, updated_at)
    values (owner_id, 'authenticated', 'authenticated', owner_id::text || '@example.test', '', now(), now());
  insert into public.profiles (id) values (owner_id) on conflict (id) do nothing;
  insert into public.books (id, owner, title) values
    (first_book, owner_id, 'Deleted'), (second_book, owner_id, 'Kept');
  insert into public.streaks (owner, current, longest, last_day, restore_left, restore_month)
    values (owner_id, 3, 3, '2026-10-03', 1, '2026-10') on conflict (owner) do update
    set current = 3, longest = 3, last_day = '2026-10-03', restore_left = 1, restore_month = '2026-10';
  insert into public.progress_log (owner, book_id, day, pages) values
    (owner_id, first_book, '2026-10-02', 5),
    (owner_id, second_book, '2026-10-01', 5),
    (owner_id, second_book, '2026-10-03', 5);
  delete from public.books where id = first_book;
  select * into strict streak_row from public.streaks where owner = owner_id;
  if streak_row.current <> 2 or streak_row.longest <> 2 or streak_row.restore_left <> 0 or streak_row.last_day <> '2026-10-03' then
    raise exception 'incorrect rebuilt streak: %', row_to_json(streak_row);
  end if;
  if (select count(*) from public.progress_log where owner = owner_id and book_id = second_book) <> 2 then
    raise exception 'remaining book logs changed';
  end if;
  if exists (select 1 from public.progress_log where book_id = first_book) then
    raise exception 'deleted book logs remain';
  end if;
end $$;
rollback;
