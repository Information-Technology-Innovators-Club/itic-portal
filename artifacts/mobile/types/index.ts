export type UserRole = 'guest' | 'member' | 'executive' | 'admin';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type AnnouncementCategory = 'general' | 'workshop' | 'hackathon' | 'meeting' | 'urgent';
export type EventStatus = 'upcoming' | 'ongoing' | 'past';
export type MemberStatus = 'pending' | 'active' | 'inactive' | 'suspended';
export type Gender = 'male' | 'female' | 'other';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  status: MemberStatus;
  createdAt: string;
  memberId: string;
  fullName: string;
  studentNumber: string;
  phone: string;
  gender: Gender;
  dateOfBirth: string;
  faculty: string;
  department: string;
  programme: string;
  academicLevel: string;
  semester: string;
  technologyInterests: string[];
  programmingLanguages: string[];
  experienceLevel: ExperienceLevel;
  hasLaptop: boolean;
  githubUsername: string;
  linkedIn: string;
  portfolio: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  profilePicture: string;
  joinedDate: string;
  lastActive: string;
  emailVerified: boolean;
  profileCompleteness: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  status: EventStatus;
  attendeeCount: number;
  maxAttendees: number;
  organizerId: string;
  createdAt: string;
  tags: string[];
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  eventId: string;
  eventTitle: string;
  checkedInAt: string;
  checkedInBy: string;
}

export interface RegisterFormData {
  fullName: string;
  studentNumber: string;
  email: string;
  password: string;
  phone: string;
  gender: Gender | '';
  dateOfBirth: string;
  faculty: string;
  department: string;
  programme: string;
  academicLevel: string;
  semester: string;
  technologyInterests: string[];
  programmingLanguages: string[];
  experienceLevel: ExperienceLevel | '';
  hasLaptop: boolean;
  githubUsername: string;
  linkedIn: string;
  portfolio: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  agreedToTerms: boolean;
}
