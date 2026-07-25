-- ITIC Portal: notification schema upgrade for an existing Supabase project.
-- Run this file once in Supabase Dashboard → SQL Editor.
-- It is safe to run more than once.

alter table public.profiles
  add column if not exists push_token text default '',
  add column if not exists push_enabled boolean default true,
  add column if not exists email_enabled boolean default true;

create table if not exists public.notifications (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  type         text not null check (type in ('event','announcement','attendance','system','approval')),
  title        text not null,
  body         text not null,
  is_read      boolean default false,
  link_target  text default '',
  created_at   timestamptz default now()
);

alter table public.notifications enable row level security;

drop policy if exists "notif_read" on public.notifications;
drop policy if exists "notif_insert" on public.notifications;
drop policy if exists "notif_update" on public.notifications;
drop policy if exists "notif_delete" on public.notifications;

create policy "notif_read" on public.notifications for select to authenticated
  using (user_id = auth.uid() or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('executive', 'admin')
  ));

create policy "notif_insert" on public.notifications for insert to authenticated
  with check (true);

create policy "notif_update" on public.notifications for update to authenticated
  using (user_id = auth.uid() or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('executive', 'admin')
  ));

create policy "notif_delete" on public.notifications for delete to authenticated
  using (user_id = auth.uid() or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('executive', 'admin')
  ));
