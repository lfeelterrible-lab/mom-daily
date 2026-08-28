-- MomDaily / Row Level Security
-- Run after schema.sql. All visible records must belong to the same pair.

drop policy if exists "pair members read pairs" on public.pairs;
create policy "pair members read pairs" on public.pairs
  for select using (public.is_pair_member(id));

drop policy if exists "users read their pair profiles" on public.profiles;
create policy "users read their pair profiles" on public.profiles
  for select using (id = auth.uid() or (pair_id is not null and public.is_pair_member(pair_id)));

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update using (id = auth.uid()) with check (
    id = auth.uid()
    and pair_id is not distinct from (select current_profile.pair_id from public.profiles current_profile where current_profile.id = auth.uid())
  );

drop policy if exists "pair members read habits" on public.habits;
create policy "pair members read habits" on public.habits
  for select using (public.is_pair_member(pair_id));

drop policy if exists "pair members manage habits" on public.habits;
create policy "pair members manage habits" on public.habits
  for all using (public.is_pair_member(pair_id)) with check (public.is_pair_member(pair_id));

drop policy if exists "pair members read completions" on public.daily_completions;
create policy "pair members read completions" on public.daily_completions
  for select using (
    public.is_pair_member(pair_id)
    and exists (
      select 1 from public.profiles
      where profiles.id = daily_completions.user_id
        and profiles.pair_id = daily_completions.pair_id
    )
  );

drop policy if exists "pair members write own completions" on public.daily_completions;
create policy "pair members write own completions" on public.daily_completions
  for insert with check (
    user_id = auth.uid()
    and public.is_pair_member(pair_id)
  );

drop policy if exists "pair members update own completions" on public.daily_completions;
create policy "pair members update own completions" on public.daily_completions
  for update using (
    user_id = auth.uid()
    and public.is_pair_member(pair_id)
  ) with check (
    user_id = auth.uid()
    and public.is_pair_member(pair_id)
  );

drop policy if exists "pair members delete own completions" on public.daily_completions;
create policy "pair members delete own completions" on public.daily_completions
  for delete using (
    user_id = auth.uid()
    and public.is_pair_member(pair_id)
  );

drop policy if exists "pair members read daily status" on public.daily_status;
create policy "pair members read daily status" on public.daily_status
  for select using (public.is_pair_member(pair_id));

drop policy if exists "pair members manage daily status" on public.daily_status;

drop policy if exists "pair members read reactions" on public.reactions;
create policy "pair members read reactions" on public.reactions
  for select using (public.is_pair_member(pair_id));

drop policy if exists "pair members send reactions" on public.reactions;
create policy "pair members send reactions" on public.reactions
  for insert with check (
    from_user = auth.uid()
    and public.is_pair_member(pair_id)
    and exists (select 1 from public.profiles where profiles.id = reactions.to_user and profiles.pair_id = reactions.pair_id)
  );

drop policy if exists "pair members read nudges" on public.nudges;
create policy "pair members read nudges" on public.nudges
  for select using (public.is_pair_member(pair_id));

drop policy if exists "pair members send nudges" on public.nudges;
create policy "pair members send nudges" on public.nudges
  for insert with check (
    from_user = auth.uid()
    and public.is_pair_member(pair_id)
    and exists (select 1 from public.profiles where profiles.id = nudges.to_user and profiles.pair_id = nudges.pair_id)
  );

drop policy if exists "users manage own notification settings" on public.notification_settings;
create policy "users manage own notification settings" on public.notification_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "pair members read private avatars" on storage.objects;
create policy "pair members read private avatars" on storage.objects
  for select using (
    bucket_id = 'avatars'
    and exists (
      select 1
      from public.profiles viewer
      join public.profiles owner_profile
        on owner_profile.id::text = split_part(storage.objects.name, '/', 1)
      where viewer.id = auth.uid()
        and viewer.pair_id is not null
        and viewer.pair_id = owner_profile.pair_id
    )
  );

drop policy if exists "users upload own avatar" on storage.objects;
create policy "users upload own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and name like auth.uid()::text || '/%'
  );

drop policy if exists "users update own avatar" on storage.objects;
create policy "users update own avatar" on storage.objects
  for update using (bucket_id = 'avatars' and owner_id = auth.uid()::text)
  with check (bucket_id = 'avatars' and owner_id = auth.uid()::text);

drop policy if exists "users delete own avatar" on storage.objects;
create policy "users delete own avatar" on storage.objects
  for delete using (bucket_id = 'avatars' and owner_id = auth.uid()::text);
