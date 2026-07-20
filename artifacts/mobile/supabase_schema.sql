-- ═══════════════════════════════════════════════════════════════════════════════
-- ITIC Portal – Supabase Schema
-- Run this entire file in your Supabase SQL Editor (supabase.com → project → SQL Editor)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. PROFILES (member data, linked to auth.users)
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  member_id            text unique not null,
  full_name            text not null,
  student_number       text unique not null default '',
  email                text unique not null,
  phone                text default '',
  gender               text default '',
  date_of_birth        text default '',
  faculty              text default '',
  department           text default '',
  programme            text default '',
  academic_level       text default '',
  semester             text default '',
  technology_interests text[] default '{}',
  programming_languages text[] default '{}',
  experience_level     text default 'beginner',
  has_laptop           boolean default false,
  github_username      text default '',
  linked_in            text default '',
  portfolio            text default '',
  profile_picture      text default '',
  role                 text default 'member' check (role in ('guest','member','executive','admin')),
  status               text default 'pending' check (status in ('pending','active','inactive','suspended')),
  joined_date          timestamptz default now(),
  last_active          timestamptz default now(),
  email_verified       boolean default false,
  profile_completeness integer default 0
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

-- Profiles: anyone authenticated can read; only self or exec/admin can update
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
create policy "events_read"   on public.events for select to authenticated using (true);
create policy "events_write"  on public.events for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('executive','admin')));

-- Announcements: read for all; write for exec/admin
create policy "ann_read"  on public.announcements for select to authenticated using (true);
create policy "ann_write" on public.announcements for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('executive','admin')));

-- Attendance: read own for members; read all + insert for exec/admin
create policy "att_read_own"  on public.attendance for select to authenticated
  using (
    member_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('executive','admin'))
  );
create policy "att_insert"    on public.attendance for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('executive','admin')));

-- ─── Seed: demo events ────────────────────────────────────────────────────────
insert into public.events (title, description, date, time, venue, category, status, max_attendees, tags)
values
  (
    'ITIC Hackathon 2024',
    'A 48-hour hackathon where teams compete to build innovative solutions to real-world African challenges using AI and modern technology. Teams of 3-5 members. Prizes, mentorship, and networking await.',
    to_char(now() + interval '14 days', 'YYYY-MM-DD'), '08:00',
    'CUT Main Hall – Block A', 'Hackathon', 'upcoming', 200,
    ARRAY['AI','Hackathon','Competition','Teams']
  ),
  (
    'Web Development Workshop',
    'Hands-on full-day workshop covering React.js, Next.js 14, Tailwind CSS, and deployment with Vercel.',
    to_char(now() + interval '5 days', 'YYYY-MM-DD'), '09:00',
    'Computer Lab 3, Block C', 'Workshop', 'upcoming', 60,
    ARRAY['React','Web','Workshop','Frontend']
  ),
  (
    'Python for Data Science Bootcamp',
    'Three-day intensive bootcamp covering Python fundamentals, pandas, matplotlib, and machine learning basics.',
    to_char(now() + interval '21 days', 'YYYY-MM-DD'), '08:30',
    'Engineering Lab 1', 'Bootcamp', 'upcoming', 50,
    ARRAY['Python','Data Science','ML']
  ),
  (
    'Cybersecurity Awareness Seminar',
    'Learn about the latest cybersecurity threats, social engineering, and how to protect your digital identity.',
    to_char(now() - interval '3 days', 'YYYY-MM-DD'), '10:00',
    'Auditorium B, Block D', 'Seminar', 'past', 150,
    ARRAY['Cybersecurity','Seminar']
  ),
  (
    'Club Orientation Night',
    'An evening to welcome new and returning members. Meet the executives and learn about ITIC''s mission.',
    to_char(now() - interval '7 days', 'YYYY-MM-DD'), '18:00',
    'Student Centre Rooftop', 'Social', 'past', 100,
    ARRAY['Orientation','Social','Networking']
  )
on conflict do nothing;

-- ─── Seed: demo announcements ─────────────────────────────────────────────────
insert into public.announcements (title, content, category, author_name, is_pinned, created_at)
values
  (
    'Welcome to ITIC – Orientation 2024!',
    'Welcome to the Information Technology Innovators Club at Chinhoyi University of Technology. We are thrilled to have you join our growing community of tech enthusiasts. This is the beginning of an exciting journey filled with workshops, hackathons, and networking opportunities.',
    'general', 'ITIC Admin', true, now() - interval '2 days'
  ),
  (
    'Hackathon 2024: Registration Now Open',
    'We are excited to announce ITIC Hackathon 2024! Register your team of 3-5 members and compete for prizes worth USD 5,000. Theme: "AI Solutions for African Challenges". Registration closes in 2 weeks.',
    'hackathon', 'ITIC Admin', true, now() - interval '1 day'
  ),
  (
    'Web Development Workshop – React & Next.js',
    'Join us for a hands-on workshop on modern web development using React and Next.js. The workshop will cover component architecture, server-side rendering, and deployment. Bring your laptop!',
    'workshop', 'Tech Lead', false, now() - interval '5 hours'
  ),
  (
    'Monthly Executive Meeting – All Members Welcome',
    'Our monthly executive meeting will be held this Friday at 2:00 PM in Room B204. We will discuss upcoming events, elections, and club constitution amendments. All members are encouraged to attend.',
    'meeting', 'Club President', false, now() - interval '2 hours'
  ),
  (
    'URGENT: System Downtime Notice',
    'The university network will undergo scheduled maintenance this Saturday from 00:00 to 06:00. All online services including the student portal will be unavailable during this period. Plan accordingly.',
    'urgent', 'ITIC Admin', false, now() - interval '30 minutes'
  )
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MANUAL STEPS AFTER RUNNING THIS SQL:
-- 1. Go to Authentication > Users > Add user (manually)
-- 2. Create: exec@itic.co.zw / exec123  → then run the UPDATE below with the UUID
-- 3. Create: admin@itic.co.zw / admin123 → then run the UPDATE below with the UUID
--
-- After creating the auth users, insert their profiles:
-- INSERT INTO public.profiles (id, member_id, full_name, student_number, email,
--   phone, gender, faculty, department, programme, academic_level, semester,
--   technology_interests, programming_languages, experience_level,
--   has_laptop, role, status, email_verified, profile_completeness)
-- VALUES
--   ('<exec-uuid-from-auth>', 'ITIC-2024-0001', 'Takunda Moyo', 'C221456B', 'exec@itic.co.zw',
--    '+263 77 123 4567', 'male', 'Faculty of Science and Technology', 'Computer Science',
--    'BSc Computer Science', 'Level 3', 'Semester 1',
--    ARRAY['Web Development','AI/Machine Learning','Cloud Computing'],
--    ARRAY['Python','JavaScript','TypeScript'], 'advanced',
--    true, 'executive', 'active', true, 95),
--   ('<admin-uuid-from-auth>', 'ITIC-2024-0000', 'ITIC Administrator', 'ADMIN001', 'admin@itic.co.zw',
--    '+263 77 000 0001', 'other', 'Faculty of Science and Technology', 'Information Technology',
--    'BSc Information Technology', 'Level 4', 'Semester 2',
--    ARRAY['DevOps','Cloud Computing','Cybersecurity'],
--    ARRAY['Python','Go','SQL'], 'advanced',
--    true, 'admin', 'active', true, 100);
-- ═══════════════════════════════════════════════════════════════════════════════
