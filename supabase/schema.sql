create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) between 2 and 40),
  constraint profiles_username_format check (username ~ '^[a-zA-Z0-9_ -]+$')
);

alter table public.profiles
add column if not exists username text;

alter table public.profiles
add column if not exists created_at timestamptz not null default now();

alter table public.profiles
add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_username_unique_idx
on public.profiles (lower(username));

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
  fallback_username text;
begin
  requested_username := nullif(trim(new.raw_user_meta_data->>'username'), '');
  fallback_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);

  if requested_username is not null and exists (
    select 1 from public.profiles where lower(username) = lower(requested_username)
  ) then
    requested_username := null;
  end if;

  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(requested_username, fallback_username)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create table if not exists public.surveys (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  status text not null check (status in ('draft', 'published')),
  slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sections jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb
);

alter table public.surveys
add column if not exists owner_id uuid references auth.users(id) on delete cascade;

alter table public.surveys
add column if not exists slug text;

alter table public.surveys
add column if not exists updated_at timestamptz not null default now();

alter table public.surveys
add column if not exists sections jsonb not null default '[]'::jsonb;

alter table public.surveys
add column if not exists questions jsonb not null default '[]'::jsonb;

create table if not exists public.responses (
  id text primary key,
  survey_id text not null references public.surveys(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  answers jsonb not null default '{}'::jsonb
);

create index if not exists surveys_owner_id_idx on public.surveys(owner_id);
create index if not exists surveys_status_idx on public.surveys(status);
create unique index if not exists surveys_slug_unique_idx on public.surveys(slug) where slug is not null;
create index if not exists responses_survey_id_idx on public.responses(survey_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_surveys_updated_at on public.surveys;
create trigger set_surveys_updated_at
before update on public.surveys
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.surveys enable row level security;
alter table public.responses enable row level security;

drop policy if exists "Anyone can read profiles" on public.profiles;
drop policy if exists "Users can create own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;

drop policy if exists "Anyone can read surveys" on public.surveys;
drop policy if exists "Anyone can create surveys" on public.surveys;
drop policy if exists "Anyone can delete surveys" on public.surveys;
drop policy if exists "Owners can read their surveys" on public.surveys;
drop policy if exists "Anyone can read published surveys" on public.surveys;
drop policy if exists "Signed in users can create surveys" on public.surveys;
drop policy if exists "Owners can update surveys" on public.surveys;
drop policy if exists "Owners can delete surveys" on public.surveys;

drop policy if exists "Anyone can read responses" on public.responses;
drop policy if exists "Anyone can create responses" on public.responses;
drop policy if exists "Anyone can delete responses" on public.responses;
drop policy if exists "Survey owners can read responses" on public.responses;
drop policy if exists "Anyone can submit responses to published surveys" on public.responses;

create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "Users can create own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Anyone can read published surveys"
on public.surveys for select
to anon, authenticated
using (status = 'published');

create policy "Owners can read their surveys"
on public.surveys for select
to authenticated
using (owner_id = auth.uid());

create policy "Signed in users can create surveys"
on public.surveys for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Owners can update surveys"
on public.surveys for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Owners can delete surveys"
on public.surveys for delete
to authenticated
using (owner_id = auth.uid());

create policy "Survey owners can read responses"
on public.responses for select
to authenticated
using (
  exists (
    select 1
    from public.surveys
    where surveys.id = responses.survey_id
      and surveys.owner_id = auth.uid()
  )
);

create policy "Anyone can submit responses to published surveys"
on public.responses for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.surveys
    where surveys.id = responses.survey_id
      and surveys.status = 'published'
  )
);
