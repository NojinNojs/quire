drop policy if exists own_profile on public.profiles;
drop policy if exists profile_select on public.profiles;
drop policy if exists profile_insert on public.profiles;
drop policy if exists profile_update on public.profiles;
create policy profile_select on public.profiles for select using (id = auth.uid());
create policy profile_insert on public.profiles for insert with check (id = auth.uid());
create policy profile_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists own_progress on public.progress_log;
drop policy if exists progress_select on public.progress_log;
create policy progress_select on public.progress_log for select using (owner = auth.uid());
