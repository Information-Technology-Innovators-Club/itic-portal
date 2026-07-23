---
name: ITIC Gamification system
description: How XP, levels, badges, and streaks work in the ITIC portal — all computed client-side from existing data.
---

# ITIC Gamification

## Key rule
All gamification is **computed client-side** from existing Supabase tables (`attendance`, `profiles`). No new DB columns or tables were added. This avoids migration risk but means leaderboard queries require fetching all active members + their attendance counts.

## XP formula
`XP = attendanceCount × 15 + Math.round(profileCompleteness / 100 × 50) + min(floor(daysActive / 7) × 2, 100)`

## Levels (minXP → name)
0 Rookie · 100 Explorer · 250 Builder · 500 Innovator · 1000 Legend

## Badges (6 total)
First Step (1 event), Team Player (5), Dedicated (10), Complete Profile (≥90%), Consistent (3+ meetings), ITIC OG (90+ days active)

## Streak
Counted in ISO weeks — consecutive weeks with ≥1 attendance record, walking back from current week.

## New DB helpers (services/db.ts)
- `getMembersAttendanceCounts(ids[])` — single query, returns `Record<userId, count>`
- `getRecentActivityFeed(limit)` — joins attendance + profiles for exec activity feed

**Why:** Adding DB columns for XP/level would require a Supabase migration and RLS policy updates that the user hasn't set up yet. Client-side derivation is zero-risk and still real-time via existing subscription channels.

## Files
- `artifacts/mobile/components/Gamification.tsx` — XPBar, StreakWidget, BadgeRow, LeaderRow, calcXP, calcStreak, calcBadges, LEVELS
- `artifacts/mobile/app/(tabs)/members.tsx` — Public member directory (active members only, searchable, ranked by XP)
- `artifacts/mobile/app/(tabs)/leaderboard.tsx` — Full leaderboard with podium
- `artifacts/mobile/app/(tabs)/_layout.tsx` — Members + Ranks tabs; href=null for pending/inactive users
