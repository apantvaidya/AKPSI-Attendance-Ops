create extension if not exists "pgcrypto";
create extension if not exists "citext";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type attendance_status as enum ('present', 'excused', 'absent_unexcused');
  end if;

  if not exists (select 1 from pg_type where typname = 'excuse_override_status') then
    create type excuse_override_status as enum ('approved', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'fine_draft_status') then
    create type fine_draft_status as enum ('draft', 'exported');
  end if;
end $$;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email citext not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  full_name text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  center_lat double precision not null,
  center_lng double precision not null,
  radius_meters integer not null default 100 check (radius_meters > 0),
  checkin_open_at timestamptz not null,
  checkin_close_at timestamptz not null,
  excuse_close_at timestamptz not null,
  fine_amount numeric(10,2) not null default 5.00,
  created_by uuid references public.admins(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint events_checkin_window check (checkin_open_at < checkin_close_at)
);

create table if not exists public.event_expected_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete restrict,
  full_name_snapshot text not null,
  email_snapshot citext not null,
  manual_status attendance_status,
  created_at timestamptz not null default timezone('utc', now()),
  unique (event_id, member_id)
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete restrict,
  checked_in_at timestamptz not null,
  user_lat double precision not null,
  user_lng double precision not null,
  gps_accuracy_meters double precision,
  distance_from_center_meters double precision not null,
  status attendance_status not null default 'present',
  created_at timestamptz not null default timezone('utc', now()),
  unique (event_id, member_id)
);

create table if not exists public.excuse_submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete restrict,
  full_name_snapshot text not null,
  reason text not null,
  proof_image_url text,
  submitted_at timestamptz not null default timezone('utc', now()),
  default_valid boolean not null default true,
  admin_override_status excuse_override_status,
  reviewed_by uuid references public.admins(id) on delete set null,
  reviewed_at timestamptz,
  unique (event_id, member_id)
);

create table if not exists public.fine_drafts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete restrict,
  amount numeric(10,2) not null,
  message_body text not null,
  status fine_draft_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  unique (event_id, member_id)
);

create index if not exists idx_members_active on public.members(is_active);
create index if not exists idx_events_checkin_open on public.events(checkin_open_at);
create index if not exists idx_expected_event on public.event_expected_members(event_id);
create index if not exists idx_expected_member on public.event_expected_members(member_id);
create index if not exists idx_attendance_event on public.attendance_records(event_id);
create index if not exists idx_attendance_member on public.attendance_records(member_id);
create index if not exists idx_excuses_event on public.excuse_submissions(event_id);
create index if not exists idx_excuses_member on public.excuse_submissions(member_id);
create index if not exists idx_fines_event on public.fine_drafts(event_id);

create or replace function public.request_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.current_member_id()
returns uuid
language sql
stable
as $$
  select id
  from public.members
  where lower(email::text) = public.request_email()
    and is_active = true
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admins
    where lower(email::text) = public.request_email()
  );
$$;

alter table public.members enable row level security;
alter table public.admins enable row level security;
alter table public.events enable row level security;
alter table public.event_expected_members enable row level security;
alter table public.attendance_records enable row level security;
alter table public.excuse_submissions enable row level security;
alter table public.fine_drafts enable row level security;

drop policy if exists "members_select_self_or_admin" on public.members;
create policy "members_select_self_or_admin"
on public.members for select
using (
  public.is_admin()
  or id = public.current_member_id()
);

drop policy if exists "admins_select_admins" on public.admins;
create policy "admins_select_admins"
on public.admins for select
using (public.is_admin());

drop policy if exists "events_select_for_admin_or_expected_member" on public.events;
create policy "events_select_for_admin_or_expected_member"
on public.events for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.event_expected_members eem
    where eem.event_id = events.id
      and eem.member_id = public.current_member_id()
  )
);

drop policy if exists "expected_members_select_for_admin_or_self" on public.event_expected_members;
create policy "expected_members_select_for_admin_or_self"
on public.event_expected_members for select
using (
  public.is_admin()
  or member_id = public.current_member_id()
);

drop policy if exists "attendance_select_for_admin_or_self" on public.attendance_records;
create policy "attendance_select_for_admin_or_self"
on public.attendance_records for select
using (
  public.is_admin()
  or member_id = public.current_member_id()
);

drop policy if exists "attendance_insert_self" on public.attendance_records;
create policy "attendance_insert_self"
on public.attendance_records for insert
with check (
  member_id = public.current_member_id()
);

drop policy if exists "excuses_select_for_admin_or_self" on public.excuse_submissions;
create policy "excuses_select_for_admin_or_self"
on public.excuse_submissions for select
using (
  public.is_admin()
  or member_id = public.current_member_id()
);

drop policy if exists "excuses_insert_self" on public.excuse_submissions;
create policy "excuses_insert_self"
on public.excuse_submissions for insert
with check (
  member_id = public.current_member_id()
);

drop policy if exists "fine_drafts_select_admin_only" on public.fine_drafts;
create policy "fine_drafts_select_admin_only"
on public.fine_drafts for select
using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('excuse-proofs', 'excuse-proofs', true)
on conflict (id) do nothing;
