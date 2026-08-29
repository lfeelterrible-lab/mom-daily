-- MomDaily / Supabase schema
-- Apply this file in a fresh Supabase project before enabling the cloud adapter.

create extension if not exists pgcrypto;

create table if not exists public.pairs (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{6}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '我',
  avatar_url text,
  pair_id uuid references public.pairs(id) on delete set null,
  invite_code text,
  created_at timestamptz not null default now()
);

-- The invite belongs to the pair, so both profiles may share it.
alter table public.profiles drop constraint if exists profiles_invite_code_key;

create table if not exists public.habits (
  id text not null,
  pair_id uuid not null references public.pairs(id) on delete cascade,
  name text not null,
  emoji text not null,
  sort_order smallint not null,
  category text not null,
  default_time text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (pair_id, id)
);

create table if not exists public.daily_completions (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null,
  habit_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  completed_at timestamptz not null default now(),
  unique (pair_id, habit_id, user_id, date),
  foreign key (pair_id, habit_id) references public.habits(pair_id, id) on delete cascade
);

create table if not exists public.daily_status (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs(id) on delete cascade,
  date date not null,
  completed_count smallint not null default 0 check (completed_count between 0 and 11),
  is_full_complete boolean not null default false,
  unique (pair_id, date)
);

create table if not exists public.daily_messages (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  content text not null check (char_length(trim(content)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pair_id, user_id, date)
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs(id) on delete cascade,
  completion_id uuid references public.daily_completions(id) on delete cascade,
  habit_id text not null,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('❤️', '👍', '👏', '😘', '🔥')),
  date date not null,
  created_at timestamptz not null default now(),
  check (from_user <> to_user),
  foreign key (pair_id, habit_id) references public.habits(pair_id, id) on delete cascade
);

create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs(id) on delete cascade,
  habit_id text not null,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  check (from_user <> to_user),
  foreign key (pair_id, habit_id) references public.habits(pair_id, id) on delete cascade
);

create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  morning_reminder time not null default '08:30',
  evening_reminder time not null default '21:30',
  updated_at timestamptz not null default now()
);

create index if not exists profiles_pair_id_idx on public.profiles(pair_id);
create index if not exists habits_pair_sort_idx on public.habits(pair_id, sort_order);
create index if not exists daily_completions_pair_date_idx on public.daily_completions(pair_id, date);
create index if not exists daily_completions_user_date_idx on public.daily_completions(user_id, date);
create index if not exists daily_status_pair_date_idx on public.daily_status(pair_id, date);
create index if not exists daily_messages_pair_date_idx on public.daily_messages(pair_id, date);
create index if not exists reactions_pair_date_idx on public.reactions(pair_id, date);
create index if not exists nudges_pair_date_idx on public.nudges(pair_id, date);

create or replace function public.refresh_daily_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_pair_id uuid;
  target_date date;
  shared_count smallint;
begin
  if tg_op = 'DELETE' then
    target_pair_id := old.pair_id;
    target_date := old.date;
  else
    target_pair_id := new.pair_id;
    target_date := new.date;
  end if;

  select count(*)::smallint into shared_count
  from (
    select first_side.habit_id
    from public.daily_completions first_side
    join public.daily_completions second_side
      on second_side.pair_id = first_side.pair_id
      and second_side.habit_id = first_side.habit_id
      and second_side.date = first_side.date
      and second_side.user_id <> first_side.user_id
    where first_side.pair_id = target_pair_id
      and first_side.date = target_date
    group by first_side.habit_id
  ) shared_habits;

  insert into public.daily_status (pair_id, date, completed_count, is_full_complete)
  values (target_pair_id, target_date, shared_count, shared_count = 11)
  on conflict (pair_id, date) do update set
    completed_count = excluded.completed_count,
    is_full_complete = excluded.is_full_complete;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists daily_completions_refresh_status on public.daily_completions;
create trigger daily_completions_refresh_status
after insert or update or delete on public.daily_completions
for each row execute function public.refresh_daily_status();

create or replace function public.is_pair_member(target_pair_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.pair_id = target_pair_id
  );
$$;

create or replace function public.seed_default_habits(target_pair_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_pair_member(target_pair_id) then
    raise exception 'Only a pair member can seed habits';
  end if;

  insert into public.habits (id, pair_id, name, emoji, sort_order, category, default_time)
  values
    ('breakfast', target_pair_id, '早饭', '🍳', 1, '晨间', '07:00–09:00'),
    ('streak', target_pair_id, '续火花', '🔥', 2, '晨间', '09:00–10:30'),
    ('voice_call', target_pair_id, '语音通话', '📞', 3, '上午 / 中午', '10:30–12:00'),
    ('lunch', target_pair_id, '午饭', '🍚', 4, '上午 / 中午', '11:30–13:30'),
    ('watch_together', target_pair_id, '一起看', '📺', 5, '上午 / 中午', '12:30–14:00'),
    ('nap', target_pair_id, '午休', '😴', 6, '下午', '13:00–14:30'),
    ('dinner', target_pair_id, '晚饭', '🍲', 7, '晚上', '17:30–20:00'),
    ('duolingo', target_pair_id, '多邻国', '🦉', 8, '晚上', '19:00–21:00'),
    ('vocabulary', target_pair_id, '背单词', '📚', 9, '晚上', '19:30–21:30'),
    ('douyin_heart', target_pair_id, '抖音比心', '❤️', 10, '晚上', '20:00–22:00'),
    ('sleep', target_pair_id, '睡觉', '🌙', 11, '睡前', '22:00–00:30')
  on conflict (pair_id, id) do update set
    name = excluded.name,
    emoji = excluded.emoji,
    sort_order = excluded.sort_order,
    category = excluded.category,
    default_time = excluded.default_time,
    is_active = true;
end;
$$;

create or replace function public.create_pair_with_defaults(input_display_name text)
returns public.pairs
language plpgsql
security definer
set search_path = public
as $$
declare
  created_pair public.pairs;
  generated_code text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if coalesce(input_display_name, '') not in ('我', '妈妈') then
    raise exception 'Choose either 我 or 妈妈';
  end if;

  generated_code := upper(substr(encode(extensions.gen_random_bytes(5), 'hex'), 1, 6));
  insert into public.pairs (invite_code) values (generated_code) returning * into created_pair;
  insert into public.profiles (id, display_name, pair_id, invite_code)
  values (auth.uid(), input_display_name, created_pair.id, generated_code)
  on conflict (id) do update set
    display_name = excluded.display_name,
    pair_id = excluded.pair_id,
    invite_code = excluded.invite_code;
  perform public.seed_default_habits(created_pair.id);
  return created_pair;
end;
$$;

create or replace function public.join_pair_by_code(input_code text, input_display_name text)
returns public.pairs
language plpgsql
security definer
set search_path = public
as $$
declare
  target_pair public.pairs;
  member_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into target_pair from public.pairs where invite_code = upper(input_code);
  if target_pair.id is null then
    raise exception 'Invite code not found';
  end if;

  select count(*) into member_count from public.profiles where pair_id = target_pair.id;
  if member_count >= 2 then
    raise exception 'This pair is already full';
  end if;
  if coalesce(input_display_name, '') not in ('我', '妈妈') then
    raise exception 'Choose either 我 or 妈妈';
  end if;
  if exists (
    select 1 from public.profiles
    where pair_id = target_pair.id
      and display_name = input_display_name
  ) then
    raise exception 'This identity is already selected';
  end if;

  insert into public.profiles (id, display_name, pair_id, invite_code)
  values (auth.uid(), input_display_name, target_pair.id, target_pair.invite_code)
  on conflict (id) do update set
    display_name = excluded.display_name,
    pair_id = excluded.pair_id,
    invite_code = excluded.invite_code;
  perform public.seed_default_habits(target_pair.id);
  return target_pair;
end;
$$;

create or replace function public.set_pair_identity(input_display_name text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles;
  target_profile public.profiles;
  previous_display_name text;
  updated_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if coalesce(input_display_name, '') not in ('我', '妈妈') then
    raise exception 'Choose either 我 or 妈妈';
  end if;

  select * into current_profile from public.profiles where id = auth.uid() for update;
  if current_profile.pair_id is null then
    raise exception 'Pair required';
  end if;

  previous_display_name := current_profile.display_name;
  if previous_display_name <> input_display_name then
    select * into target_profile
    from public.profiles
    where pair_id = current_profile.pair_id
      and id <> auth.uid()
      and display_name = input_display_name
    for update;

    if target_profile.id is not null and previous_display_name in ('我', '妈妈') then
      update public.profiles
      set display_name = previous_display_name
      where id = target_profile.id;
    end if;
  end if;

  update public.profiles
  set display_name = input_display_name
  where id = auth.uid()
  returning * into updated_profile;
  return updated_profile;
end;
$$;

alter table public.pairs enable row level security;
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.daily_completions enable row level security;
alter table public.daily_status enable row level security;
alter table public.daily_messages enable row level security;
alter table public.reactions enable row level security;
alter table public.nudges enable row level security;
alter table public.notification_settings enable row level security;

-- Realtime DELETE payloads need the old habit/user/date values so the other phone can update immediately.
alter table public.daily_completions replica identity full;
alter table public.daily_messages replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.daily_completions;
exception when duplicate_object then
  null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.daily_messages;
exception when duplicate_object then
  null;
end $$;

-- Let the creator see the second member join without refreshing.
do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then
  null;
end $$;

-- Private avatar bucket. Store files as <auth-user-id>/avatar.<ext>.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do update set public = false;
