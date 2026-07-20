---
name: ITIC Portal architecture
description: Key decisions and setup steps for the ITIC Expo mobile app with Supabase backend.
---

## Stack
- Expo SDK 54, Expo Router v6, React Native 0.81
- Supabase for auth + database (URL/anon key in shared env vars as EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY)
- AsyncStorage used only as Supabase auth session storage adapter

## Supabase setup
- Schema SQL: `artifacts/mobile/supabase_schema.sql` — run this in Supabase SQL Editor
- Tables: `profiles`, `events`, `announcements`, `attendance`
- RPC: `increment_attendee_count(event_id uuid)` must exist for attendance marking
- Demo exec/admin accounts: must be manually created in Supabase Auth dashboard (Authentication > Users > Add user), then INSERT into profiles with the returned UUID using the SQL comments at the bottom of schema file
- Email confirmation: disable in Supabase Auth settings (Authentication > Settings > Email confirmations OFF) for smooth dev flow

## Key decisions
- Emergency contact removed from registration and user type (it's a club, not appropriate)
- QR scanner is exec/admin only — they scan members; members show QR on profile
- Member ID card: flip animation (Reanimated rotateY), front shows QR + member info, back shows academic + interests
- Toast system: custom Reanimated-based, context-driven, no external package
- Scanner tab and Executive tab hidden for regular members via `href: null` in tab layout
- Registration: 3 steps (Personal, Academic, Tech & Finish) — no emergency contact step

## Services
- `services/supabase.ts` — Supabase client singleton
- `services/db.ts` — all CRUD: loginUser, registerUser, getAllMembers, getClubStats, markAttendance, etc.
- `context/AuthContext.tsx` — Supabase onAuthStateChange drives auth state
- `context/ToastContext.tsx` — global toast context

## New screens added
- `app/(tabs)/scanner.tsx` — QR scanner for exec/admin attendance
- `app/event/[id].tsx` — event detail with capacity bar, countdown
- `app/announcement/[id].tsx` — announcement detail with category styling

**Why Supabase over AsyncStorage:** user requested full backend; Supabase provides auth, RLS, real-time, and scales to production. AsyncStorage kept only as auth session storage adapter (required by supabase-js in RN).
