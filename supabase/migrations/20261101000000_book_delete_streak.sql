-- Book deletion cascades reading entries. Rebuild the derived streak in the same transaction.
create or replace function public.rebuild_streak_after_book_delete()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  d date;
  previous date := null;
  month_key text := null;
  quota int := 1;
  current_count int := 0;
  longest_count int := 0;
  gap int;
  next_month text;
begin
  -- Serialize with log_pages when a streak exists.
  perform 1 from public.streaks where owner = old.owner for update;
  for d in select distinct day from public.progress_log where owner = old.owner order by day loop
    next_month := to_char(d, 'YYYY-MM');
    if month_key is distinct from next_month then quota := 1; end if;
    if previous is null then
      current_count := 1;
    else
      gap := d - previous;
      if gap = 1 then
        current_count := current_count + 1;
      elsif gap = 2 and quota > 0 then
        current_count := current_count + 1;
        quota := 0;
      else
        current_count := 1;
      end if;
    end if;
    longest_count := greatest(longest_count, current_count);
    previous := d;
    month_key := next_month;
  end loop;
  update public.streaks set current = current_count, longest = longest_count,
    last_day = previous, restore_left = quota, restore_month = month_key where owner = old.owner;
  return old;
end;
$$;

drop trigger if exists books_rebuild_streak on public.books;
create trigger books_rebuild_streak after delete on public.books
for each row execute function public.rebuild_streak_after_book_delete();
