import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Announcement, Event, AttendanceRecord } from '@/types';

const KEYS = {
  USERS: '@itic/users',
  CURRENT_USER: '@itic/current_user',
  ANNOUNCEMENTS: '@itic/announcements',
  EVENTS: '@itic/events',
  ATTENDANCE: '@itic/attendance',
  SEEDED: '@itic/seeded',
  ONBOARDED: '@itic/onboarded',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generateMemberId(index: number): string {
  const year = new Date().getFullYear();
  return `ITIC-${year}-${String(index).padStart(4, '0')}`;
}

function calcCompleteness(user: Partial<User>): number {
  const fields: (keyof User)[] = [
    'fullName', 'studentNumber', 'email', 'phone', 'gender', 'dateOfBirth',
    'faculty', 'department', 'programme', 'academicLevel', 'semester',
    'technologyInterests', 'programmingLanguages', 'experienceLevel',
    'githubUsername', 'linkedIn', 'emergencyContactName', 'emergencyContactPhone',
  ];
  const filled = fields.filter(f => {
    const v = user[f];
    if (Array.isArray(v)) return v.length > 0;
    return v !== '' && v !== undefined && v !== null;
  });
  return Math.round((filled.length / fields.length) * 100);
}

const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1', title: 'Welcome to ITIC – Orientation 2024!',
    content: 'Welcome to the Information Technology Innovators Club at Chinhoyi University of Technology. We are thrilled to have you join our growing community of tech enthusiasts. This is the beginning of an exciting journey filled with workshops, hackathons, and networking opportunities.',
    category: 'general', authorId: 'admin-1', authorName: 'ITIC Admin',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), isPinned: true,
  },
  {
    id: 'ann-2', title: 'Hackathon 2024: Registration Now Open',
    content: 'We are excited to announce ITIC Hackathon 2024! Register your team of 3-5 members and compete for prizes worth USD 5,000. Theme: "AI Solutions for African Challenges". Registration closes in 2 weeks.',
    category: 'hackathon', authorId: 'admin-1', authorName: 'ITIC Admin',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(), isPinned: true,
  },
  {
    id: 'ann-3', title: 'Web Development Workshop – React & Next.js',
    content: 'Join us for a hands-on workshop on modern web development using React and Next.js. The workshop will cover component architecture, server-side rendering, and deployment. Bring your laptop!',
    category: 'workshop', authorId: 'exec-1', authorName: 'Tech Lead',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(), isPinned: false,
  },
  {
    id: 'ann-4', title: 'Monthly Executive Meeting – All Members Welcome',
    content: 'Our monthly executive meeting will be held this Friday at 2:00 PM in Room B204. We will discuss upcoming events, elections, and club constitution amendments. All members are encouraged to attend.',
    category: 'meeting', authorId: 'exec-1', authorName: 'Club President',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(), isPinned: false,
  },
  {
    id: 'ann-5', title: 'URGENT: System Downtime Notice',
    content: 'The university network will undergo scheduled maintenance this Saturday from 00:00 to 06:00. All online services including the student portal will be unavailable during this period. Plan accordingly.',
    category: 'urgent', authorId: 'admin-1', authorName: 'ITIC Admin',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(), isPinned: false,
  },
];

const SEED_EVENTS: Event[] = [
  {
    id: 'evt-1', title: 'ITIC Hackathon 2024',
    description: 'A 48-hour hackathon where teams compete to build innovative solutions to real-world African challenges using AI and modern technology. Teams of 3-5 members. Prizes, mentorship, and networking await.',
    date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    time: '08:00', venue: 'CUT Main Hall – Block A', category: 'Hackathon',
    status: 'upcoming', attendeeCount: 87, maxAttendees: 200,
    organizerId: 'admin-1', createdAt: new Date().toISOString(),
    tags: ['AI', 'Hackathon', 'Competition', 'Teams'],
  },
  {
    id: 'evt-2', title: 'Web Development Workshop',
    description: 'Hands-on full-day workshop covering React.js, Next.js 14, Tailwind CSS, and deployment with Vercel. Suitable for beginners and intermediate developers.',
    date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    time: '09:00', venue: 'Computer Lab 3, Block C', category: 'Workshop',
    status: 'upcoming', attendeeCount: 45, maxAttendees: 60,
    organizerId: 'exec-1', createdAt: new Date().toISOString(),
    tags: ['React', 'Web', 'Workshop', 'Frontend'],
  },
  {
    id: 'evt-3', title: 'Python for Data Science Bootcamp',
    description: 'Three-day intensive bootcamp covering Python fundamentals, pandas, matplotlib, scikit-learn, and machine learning basics. Certificate of completion provided.',
    date: new Date(Date.now() + 86400000 * 21).toISOString().split('T')[0],
    time: '08:30', venue: 'Engineering Lab 1', category: 'Bootcamp',
    status: 'upcoming', attendeeCount: 32, maxAttendees: 50,
    organizerId: 'exec-1', createdAt: new Date().toISOString(),
    tags: ['Python', 'Data Science', 'ML', 'Bootcamp'],
  },
  {
    id: 'evt-4', title: 'Cybersecurity Awareness Seminar',
    description: 'Learn about the latest cybersecurity threats, social engineering, password security, and how to protect your digital identity. Open to all students.',
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    time: '10:00', venue: 'Auditorium B, Block D', category: 'Seminar',
    status: 'past', attendeeCount: 120, maxAttendees: 150,
    organizerId: 'admin-1', createdAt: new Date().toISOString(),
    tags: ['Cybersecurity', 'Seminar', 'Security'],
  },
  {
    id: 'evt-5', title: 'Club Orientation Night',
    description: 'An evening to welcome new and returning members. Meet the executives, learn about ITIC\'s mission, and discover opportunities to get involved.',
    date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    time: '18:00', venue: 'Student Centre Rooftop', category: 'Social',
    status: 'past', attendeeCount: 93, maxAttendees: 100,
    organizerId: 'exec-1', createdAt: new Date().toISOString(),
    tags: ['Orientation', 'Social', 'Networking'],
  },
];

async function seedIfNeeded(): Promise<void> {
  const seeded = await AsyncStorage.getItem(KEYS.SEEDED);
  if (seeded) return;

  const execUser: User = {
    id: 'exec-1', email: 'exec@itic.co.zw', password: 'exec123',
    role: 'executive', status: 'active', createdAt: new Date().toISOString(),
    memberId: generateMemberId(1), fullName: 'Takunda Moyo',
    studentNumber: 'C221456B', phone: '+263 77 123 4567',
    gender: 'male', dateOfBirth: '2001-03-15',
    faculty: 'Faculty of Science and Technology', department: 'Computer Science',
    programme: 'BSc Computer Science', academicLevel: 'Level 3', semester: 'Semester 1',
    technologyInterests: ['Web Development', 'AI/Machine Learning', 'Cloud Computing'],
    programmingLanguages: ['Python', 'JavaScript', 'TypeScript', 'Java'],
    experienceLevel: 'advanced', hasLaptop: true,
    githubUsername: 'takundamoyo', linkedIn: 'linkedin.com/in/takundamoyo', portfolio: '',
    emergencyContactName: 'Rose Moyo', emergencyContactPhone: '+263 71 987 6543',
    emergencyContactRelation: 'Mother', profilePicture: '',
    joinedDate: new Date(Date.now() - 86400000 * 90).toISOString(),
    lastActive: new Date().toISOString(), emailVerified: true, profileCompleteness: 95,
  };

  const adminUser: User = {
    id: 'admin-1', email: 'admin@itic.co.zw', password: 'admin123',
    role: 'admin', status: 'active', createdAt: new Date().toISOString(),
    memberId: generateMemberId(0), fullName: 'ITIC Administrator',
    studentNumber: 'ADMIN001', phone: '+263 77 000 0001',
    gender: 'other', dateOfBirth: '2000-01-01',
    faculty: 'Faculty of Science and Technology', department: 'Information Technology',
    programme: 'BSc Information Technology', academicLevel: 'Level 4', semester: 'Semester 2',
    technologyInterests: ['DevOps', 'Cloud Computing', 'Cybersecurity'],
    programmingLanguages: ['Python', 'Go', 'SQL'],
    experienceLevel: 'advanced', hasLaptop: true,
    githubUsername: 'itic-admin', linkedIn: '', portfolio: '',
    emergencyContactName: 'N/A', emergencyContactPhone: 'N/A', emergencyContactRelation: 'N/A',
    profilePicture: '', joinedDate: new Date(Date.now() - 86400000 * 365).toISOString(),
    lastActive: new Date().toISOString(), emailVerified: true, profileCompleteness: 100,
  };

  await AsyncStorage.multiSet([
    [KEYS.USERS, JSON.stringify([adminUser, execUser])],
    [KEYS.ANNOUNCEMENTS, JSON.stringify(SEED_ANNOUNCEMENTS)],
    [KEYS.EVENTS, JSON.stringify(SEED_EVENTS)],
    [KEYS.ATTENDANCE, JSON.stringify([])],
    [KEYS.SEEDED, 'true'],
  ]);
}

export async function initStorage(): Promise<void> {
  await seedIfNeeded();
}

export async function getUsers(): Promise<User[]> {
  const raw = await AsyncStorage.getItem(KEYS.USERS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveUsers(users: User[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

export async function getCurrentUserId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.CURRENT_USER);
}

export async function setCurrentUserId(id: string | null): Promise<void> {
  if (id) {
    await AsyncStorage.setItem(KEYS.CURRENT_USER, id);
  } else {
    await AsyncStorage.removeItem(KEYS.CURRENT_USER);
  }
}

export async function loginUser(email: string, password: string): Promise<User> {
  const users = await getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) throw new Error('Invalid email or password');
  if (user.status === 'suspended') throw new Error('Your account has been suspended. Contact support.');
  await setCurrentUserId(user.id);
  // Update lastActive
  user.lastActive = new Date().toISOString();
  await saveUsers(users.map(u => u.id === user.id ? user : u));
  return user;
}

export async function registerUser(data: import('@/types').RegisterFormData): Promise<User> {
  const users = await getUsers();
  if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('An account with this email already exists');
  }
  if (users.find(u => u.studentNumber === data.studentNumber)) {
    throw new Error('Student number is already registered');
  }
  const newUser: User = {
    id: generateId(),
    email: data.email,
    password: data.password,
    role: 'member',
    status: 'pending',
    createdAt: new Date().toISOString(),
    memberId: generateMemberId(users.length),
    fullName: data.fullName,
    studentNumber: data.studentNumber,
    phone: data.phone,
    gender: data.gender as import('@/types').Gender,
    dateOfBirth: data.dateOfBirth,
    faculty: data.faculty,
    department: data.department,
    programme: data.programme,
    academicLevel: data.academicLevel,
    semester: data.semester,
    technologyInterests: data.technologyInterests,
    programmingLanguages: data.programmingLanguages,
    experienceLevel: data.experienceLevel as import('@/types').ExperienceLevel,
    hasLaptop: data.hasLaptop,
    githubUsername: data.githubUsername,
    linkedIn: data.linkedIn,
    portfolio: data.portfolio,
    emergencyContactName: data.emergencyContactName,
    emergencyContactPhone: data.emergencyContactPhone,
    emergencyContactRelation: data.emergencyContactRelation,
    profilePicture: '',
    joinedDate: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    emailVerified: false,
    profileCompleteness: 0,
  };
  newUser.profileCompleteness = calcCompleteness(newUser);
  const updatedUsers = [...users, newUser];
  await saveUsers(updatedUsers);
  await setCurrentUserId(newUser.id);
  return newUser;
}

export async function getCurrentUser(): Promise<User | null> {
  const id = await getCurrentUserId();
  if (!id) return null;
  const users = await getUsers();
  return users.find(u => u.id === id) ?? null;
}

export async function logoutUser(): Promise<void> {
  await setCurrentUserId(null);
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const raw = await AsyncStorage.getItem(KEYS.ANNOUNCEMENTS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveAnnouncements(announcements: Announcement[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
}

export async function addAnnouncement(ann: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement> {
  const announcements = await getAnnouncements();
  const newAnn: Announcement = {
    ...ann, id: generateId(),
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  await saveAnnouncements([newAnn, ...announcements]);
  return newAnn;
}

export async function getEvents(): Promise<Event[]> {
  const raw = await AsyncStorage.getItem(KEYS.EVENTS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveEvents(events: Event[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
}

export async function addEvent(evt: Omit<Event, 'id' | 'createdAt' | 'attendeeCount'>): Promise<Event> {
  const events = await getEvents();
  const newEvent: Event = {
    ...evt, id: generateId(),
    createdAt: new Date().toISOString(), attendeeCount: 0,
  };
  await saveEvents([...events, newEvent]);
  return newEvent;
}

export async function getAttendance(): Promise<AttendanceRecord[]> {
  const raw = await AsyncStorage.getItem(KEYS.ATTENDANCE);
  return raw ? JSON.parse(raw) : [];
}

export async function markAttendance(memberId: string, eventId: string, eventTitle: string, checkedBy: string): Promise<AttendanceRecord> {
  const attendance = await getAttendance();
  const existing = attendance.find(a => a.memberId === memberId && a.eventId === eventId);
  if (existing) throw new Error('Attendance already marked for this event');
  const record: AttendanceRecord = {
    id: generateId(), memberId, eventId, eventTitle,
    checkedInAt: new Date().toISOString(), checkedInBy: checkedBy,
  };
  await AsyncStorage.setItem(KEYS.ATTENDANCE, JSON.stringify([...attendance, record]));
  return record;
}

export async function getUserAttendance(memberId: string): Promise<AttendanceRecord[]> {
  const attendance = await getAttendance();
  return attendance.filter(a => a.memberId === memberId);
}

export async function approveUser(userId: string): Promise<void> {
  const users = await getUsers();
  await saveUsers(users.map(u => u.id === userId ? { ...u, status: 'active' as const } : u));
}

export async function deactivateUser(userId: string): Promise<void> {
  const users = await getUsers();
  await saveUsers(users.map(u => u.id === userId ? { ...u, status: 'inactive' as const } : u));
}

export async function isOnboarded(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return v === 'true';
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
}
