/**
 * db.ts — all data access via Supabase.
 * Run supabase_schema.sql in your Supabase SQL editor first.
 */
import { supabase } from './supabase';
import {
  User, Announcement, Event, AttendanceRecord, RegisterFormData,
  MemberStatus, UserRole, Gender, ExperienceLevel,
} from '@/types';

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapProfile(r: Record<string, unknown>): User {
  return {
    id: r.id as string,
    email: r.email as string,
    role: (r.role as UserRole) ?? 'member',
    status: (r.status as MemberStatus) ?? 'pending',
    createdAt: (r.joined_date as string) ?? new Date().toISOString(),
    memberId: r.member_id as string,
    fullName: r.full_name as string,
    studentNumber: (r.student_number as string) ?? '',
    phone: (r.phone as string) ?? '',
    gender: (r.gender as Gender) ?? 'prefer_not_to_say',
    dateOfBirth: (r.date_of_birth as string) ?? '',
    faculty: (r.faculty as string) ?? '',
    department: (r.department as string) ?? '',
    programme: (r.programme as string) ?? '',
    academicLevel: (r.academic_level as string) ?? '',
    semester: (r.semester as string) ?? '',
    technologyInterests: (r.technology_interests as string[]) ?? [],
    programmingLanguages: (r.programming_languages as string[]) ?? [],
    experienceLevel: (r.experience_level as ExperienceLevel) ?? 'beginner',
    hasLaptop: (r.has_laptop as boolean) ?? false,
    githubUsername: (r.github_username as string) ?? '',
    linkedIn: (r.linked_in as string) ?? '',
    portfolio: (r.portfolio as string) ?? '',
    profilePicture: (r.profile_picture as string) ?? '',
    joinedDate: (r.joined_date as string) ?? new Date().toISOString(),
    lastActive: (r.last_active as string) ?? new Date().toISOString(),
    emailVerified: (r.email_verified as boolean) ?? false,
    profileCompleteness: (r.profile_completeness as number) ?? 0,
  };
}

function mapAnnouncement(r: Record<string, unknown>): Announcement {
  return {
    id: r.id as string,
    title: r.title as string,
    content: r.content as string,
    category: r.category as Announcement['category'],
    authorId: (r.author_id as string) ?? '',
    authorName: (r.author_name as string) ?? 'ITIC',
    createdAt: r.created_at as string,
    updatedAt: (r.updated_at as string) ?? (r.created_at as string),
    isPinned: (r.is_pinned as boolean) ?? false,
  };
}

function mapEvent(r: Record<string, unknown>): Event {
  return {
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) ?? '',
    date: r.date as string,
    time: (r.time as string) ?? '',
    venue: (r.venue as string) ?? '',
    category: (r.category as string) ?? 'General',
    status: (r.status as Event['status']) ?? 'upcoming',
    attendeeCount: (r.attendee_count as number) ?? 0,
    maxAttendees: (r.max_attendees as number) ?? 100,
    organizerId: (r.organizer_id as string) ?? '',
    createdAt: r.created_at as string,
    tags: (r.tags as string[]) ?? [],
  };
}

function mapAttendance(r: Record<string, unknown>): AttendanceRecord {
  return {
    id: r.id as string,
    memberId: r.member_id as string,
    eventId: (r.event_id as string) ?? '',
    eventTitle: (r.event_title as string) ?? '',
    checkedInAt: r.checked_in_at as string,
    checkedInBy: (r.checked_in_by as string) ?? '',
  };
}

function calcCompleteness(data: Partial<RegisterFormData>): number {
  const fields = [
    'fullName', 'studentNumber', 'email', 'phone', 'gender', 'dateOfBirth',
    'faculty', 'department', 'programme', 'academicLevel', 'semester',
    'technologyInterests', 'programmingLanguages', 'experienceLevel', 'githubUsername',
  ] as const;
  const filled = fields.filter(f => {
    const v = (data as Record<string, unknown>)[f];
    if (Array.isArray(v)) return v.length > 0;
    return v !== '' && v !== undefined && v !== null;
  });
  return Math.round((filled.length / fields.length) * 100);
}

function generateMemberId(count: number): string {
  const year = new Date().getFullYear();
  return `ITIC-${year}-${String(count).padStart(4, '0')}`;
}

// ─── Auth operations ──────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string): Promise<User> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (profileError || !profile) throw new Error('Profile not found. Contact support.');
  if (profile.status === 'suspended') throw new Error('Account suspended. Contact ITIC support.');

  await supabase.from('profiles').update({ last_active: new Date().toISOString() }).eq('id', profile.id);
  return mapProfile(profile);
}

export async function registerUser(data: RegisterFormData): Promise<User> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });
  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Registration failed. Please try again.');

  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  const memberId = generateMemberId((count ?? 0) + 1);
  const completeness = calcCompleteness(data);

  const profileRow = {
    id: authData.user.id,
    member_id: memberId,
    full_name: data.fullName,
    student_number: data.studentNumber,
    email: data.email.toLowerCase(),
    phone: data.phone,
    gender: data.gender,
    date_of_birth: data.dateOfBirth,
    faculty: data.faculty,
    department: data.department,
    programme: data.programme,
    academic_level: data.academicLevel,
    semester: data.semester,
    technology_interests: data.technologyInterests,
    programming_languages: data.programmingLanguages,
    experience_level: data.experienceLevel,
    has_laptop: data.hasLaptop,
    github_username: data.githubUsername,
    linked_in: data.linkedIn,
    portfolio: data.portfolio,
    profile_picture: '',
    role: 'member',
    status: 'pending',
    joined_date: new Date().toISOString(),
    last_active: new Date().toISOString(),
    email_verified: false,
    profile_completeness: completeness,
  };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert(profileRow)
    .select()
    .single();

  if (profileError) throw new Error('Failed to create profile: ' + profileError.message);
  return mapProfile(profile);
}

export async function checkStudentNumberExists(studentNumber: string): Promise<boolean> {
  if (!studentNumber.trim()) return false;
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('student_number', studentNumber.trim())
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return profile ? mapProfile(profile) : null;
}

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
}

// ─── Profile operations ───────────────────────────────────────────────────────

export async function getAllMembers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('joined_date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProfile);
}

export async function getMemberById(id: string): Promise<User | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
  return data ? mapProfile(data) : null;
}

export async function getMemberByMemberId(memberId: string): Promise<User | null> {
  const { data } = await supabase.from('profiles').select('*').eq('member_id', memberId).single();
  return data ? mapProfile(data) : null;
}

export async function approveUser(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function deactivateUser(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ status: 'inactive' }).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function suspendUser(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ status: 'suspended' }).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function updateProfilePicture(userId: string, avatarUrl: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ profile_picture: avatarUrl }).eq('id', userId);
  if (error) throw new Error(error.message);
}

export interface ProfileUpdates {
  githubUsername?: string;
  linkedIn?: string;
  portfolio?: string;
  technologyInterests?: string[];
  programmingLanguages?: string[];
  experienceLevel?: ExperienceLevel;
  hasLaptop?: boolean;
  phone?: string;
}

export async function updateProfile(userId: string, updates: ProfileUpdates): Promise<void> {
  const row: Record<string, unknown> = {};
  if (updates.githubUsername !== undefined) row.github_username = updates.githubUsername;
  if (updates.linkedIn !== undefined) row.linked_in = updates.linkedIn;
  if (updates.portfolio !== undefined) row.portfolio = updates.portfolio;
  if (updates.technologyInterests !== undefined) row.technology_interests = updates.technologyInterests;
  if (updates.programmingLanguages !== undefined) row.programming_languages = updates.programmingLanguages;
  if (updates.experienceLevel !== undefined) row.experience_level = updates.experienceLevel;
  if (updates.hasLaptop !== undefined) row.has_laptop = updates.hasLaptop;
  if (updates.phone !== undefined) row.phone = updates.phone;

  // Recalculate completeness after update
  const { data: current } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (current) {
    const merged = { ...current, ...row };
    row.profile_completeness = calcCompleteness({
      fullName: merged.full_name,
      studentNumber: merged.student_number,
      email: merged.email,
      phone: merged.phone,
      gender: merged.gender,
      dateOfBirth: merged.date_of_birth,
      faculty: merged.faculty,
      department: merged.department,
      programme: merged.programme,
      academicLevel: merged.academic_level,
      semester: merged.semester,
      technologyInterests: merged.technology_interests ?? [],
      programmingLanguages: merged.programming_languages ?? [],
      experienceLevel: merged.experience_level,
      githubUsername: merged.github_username,
      linkedIn: merged.linked_in,
      portfolio: merged.portfolio,
      hasLaptop: merged.has_laptop,
      password: '',
      agreedToTerms: true,
    });
  }

  const { error } = await supabase.from('profiles').update(row).eq('id', userId);
  if (error) throw new Error(error.message);
}

// ─── Announcements ────────────────────────────────────────────────────────────

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAnnouncement);
}

export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  const { data } = await supabase.from('announcements').select('*').eq('id', id).single();
  return data ? mapAnnouncement(data) : null;
}

export async function addAnnouncement(
  ann: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Announcement> {
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: ann.title,
      content: ann.content,
      category: ann.category,
      author_id: ann.authorId,
      author_name: ann.authorName,
      is_pinned: ann.isPinned,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapAnnouncement(data);
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.content !== undefined) row.content = updates.content;
  if (updates.isPinned !== undefined) row.is_pinned = updates.isPinned;
  const { error } = await supabase.from('announcements').update(row).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapEvent);
}

export async function getEventById(id: string): Promise<Event | null> {
  const { data } = await supabase.from('events').select('*').eq('id', id).single();
  return data ? mapEvent(data) : null;
}

export async function addEvent(evt: Omit<Event, 'id' | 'createdAt' | 'attendeeCount'>): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: evt.title,
      description: evt.description,
      date: evt.date,
      time: evt.time,
      venue: evt.venue,
      category: evt.category,
      status: evt.status,
      max_attendees: evt.maxAttendees,
      organizer_id: evt.organizerId,
      tags: evt.tags,
      attendee_count: 0,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapEvent(data);
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.venue !== undefined) row.venue = updates.venue;
  if (updates.date !== undefined) row.date = updates.date;
  if (updates.time !== undefined) row.time = updates.time;
  if (updates.maxAttendees !== undefined) row.max_attendees = updates.maxAttendees;
  if (updates.tags !== undefined) row.tags = updates.tags;
  const { error } = await supabase.from('events').update(row).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function markAttendance(
  memberId: string,
  eventId: string,
  eventTitle: string,
  checkedBy: string,
): Promise<AttendanceRecord> {
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('member_id', memberId)
    .eq('event_id', eventId)
    .maybeSingle();

  if (existing) throw new Error('Attendance already marked for this member at this event');

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      member_id: memberId,
      event_id: eventId,
      event_title: eventTitle,
      checked_in_at: new Date().toISOString(),
      checked_in_by: checkedBy,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Increment attendee count
  await supabase.rpc('increment_attendee_count', { event_id: eventId });

  return mapAttendance(data);
}

export async function getUserAttendance(memberId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('member_id', memberId)
    .order('checked_in_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map(mapAttendance);
}

export async function getEventAttendance(eventId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('event_id', eventId)
    .order('checked_in_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map(mapAttendance);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getClubStats(): Promise<{
  total: number; active: number; pending: number; executives: number;
}> {
  const { data } = await supabase.from('profiles').select('status, role');
  const members = data ?? [];
  return {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    pending: members.filter(m => m.status === 'pending').length,
    executives: members.filter(m => m.role === 'executive' || m.role === 'admin').length,
  };
}
