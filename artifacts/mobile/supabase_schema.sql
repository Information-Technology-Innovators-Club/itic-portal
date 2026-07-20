-- ═══════════════════════════════════════════════════════════════════════════════
-- ITIC Portal – Supabase Schema
-- Run this entire file in your Supabase SQL Editor (supabase.com → project → SQL Editor)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. PROFILES (member data, linked to auth.users)
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  member_id             text unique not null,
  full_name             text not null,
  student_number        text unique not null default '',
  email                 text unique not null,
  phone                 text default '',
  gender                text default '',
  date_of_birth         text default '',
  faculty               text default '',
  department            text default '',
  programme             text default '',
  academic_level        text default '',
  semester              text default '',
  technology_interests  text[] default '{}',
  programming_languages text[] default '{}',
  experience_level      text default 'beginner',
  has_laptop            boolean default false,
  github_username       text default '',
  linked_in             text default '',
  portfolio             text default '',
  profile_picture       text default '',
  role                  text default 'member' check (role in ('guest','member','executive','admin')),
  status                text default 'pending' check (status in ('pending','active','inactive','suspended')),
  joined_date           timestamptz default now(),
  last_active           timestamptz default now(),
  email_verified        boolean default false,
  profile_completeness  integer default 0
);

-- 2. EVENTS
create table if not exists public.events (
  id             uuid default gen_random_uuid() primary key,
  title          text not null,
  description    text default '',
  date           text not null,
  time           text default '',
  venue          text default '',
  category       text default 'General',
  status         text default 'upcoming' check (status in ('upcoming','ongoing','past')),
  attendee_count integer default 0,
  max_attendees  integer default 100,
  organizer_id   uuid references public.profiles(id) on delete set null,
  tags           text[] default '{}',
  created_at     timestamptz default now()
);

-- 3. ANNOUNCEMENTS
create table if not exists public.announcements (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  content     text not null,
  category    text default 'general' check (category in ('general','workshop','hackathon','meeting','urgent')),
  author_id   uuid references public.profiles(id) on delete set null,
  author_name text default 'ITIC',
  is_pinned   boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 4. ATTENDANCE
create table if not exists public.attendance (
  id            uuid default gen_random_uuid() primary key,
  member_id     uuid references public.profiles(id) on delete cascade,
  event_id      uuid references public.events(id) on delete cascade,
  event_title   text default '',
  checked_in_at timestamptz default now(),
  checked_in_by uuid references public.profiles(id) on delete set null,
  unique(member_id, event_id)
);

-- ─── RPC: increment attendee count safely ─────────────────────────────────────
create or replace function increment_attendee_count(event_id uuid)
returns void language sql as $$
  update events set attendee_count = attendee_count + 1 where id = event_id;
$$;

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.events        enable row level security;
alter table public.announcements enable row level security;
alter table public.attendance    enable row level security;

-- Profiles: any authenticated user can read; only self or exec/admin can update
create policy "profiles_read"   on public.profiles for select to authenticated using (true);
create policy "profiles_insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update to authenticated
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('executive','admin')
    )
  );

-- Events: read for all authenticated; write for exec/admin only
create policy "events_read"  on public.events for select to authenticated using (true);
create policy "events_write" on public.events for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('executive','admin')));

-- Announcements: read for all; write for exec/admin
create policy "ann_read"  on public.announcements for select to authenticated using (true);
create policy "ann_write" on public.announcements for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('executive','admin')));

-- Attendance: members read their own; exec/admin read all and can insert
create policy "att_read" on public.attendance for select to authenticated
  using (
    member_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('executive','admin'))
  );
create policy "att_insert" on public.attendance for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('executive','admin')));

-- ═══════════════════════════════════════════════════════════════════════════════
-- SETUP STEPS (after running this SQL):
--
-- 1. In Supabase Dashboard → Authentication → Settings
--    → Disable "Enable email confirmations" so members can log in immediately
--
-- 2. Create your first admin account:
--    → Authentication → Users → Add user
--    → Enter the email and password for your club administrator
--    → Copy the UUID assigned by Supabase
--
-- 3. Insert the admin profile (replace the placeholders):
--    INSERT INTO public.profiles (
--      id, member_id, full_name, student_number, email,
--      role, status, email_verified, profile_completeness
--    ) VALUES (
--      '<uuid-from-step-2>',
--      'ITIC-<year>-0001',
--      '<Admin Full Name>',
--      '<Student Number or ADMIN>',
--      '<admin@yourdomain.com>',
--      'admin', 'active', true, 100
--    );
--
-- 4. Log in as admin, then use the Management tab to:
--    → Create events and announcements
--    → Approve member registrations
--    → Promote members to executive or admin roles
-- ═══════════════════════════════════════════════════════════════════════════════
