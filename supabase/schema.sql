create table if not exists public.surveys (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  status text not null check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  questions jsonb not null default '[]'::jsonb
);

create table if not exists public.responses (
  id text primary key,
  survey_id text not null references public.surveys(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  answers jsonb not null default '{}'::jsonb
);

create index if not exists surveys_owner_id_idx on public.surveys(owner_id);
create index if not exists surveys_status_idx on public.surveys(status);
create index if not exists responses_survey_id_idx on public.responses(survey_id);

alter table public.surveys enable row level security;
alter table public.responses enable row level security;

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
