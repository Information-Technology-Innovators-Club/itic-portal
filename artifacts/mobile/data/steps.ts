import { ExperienceLevel, Gender } from "@/types";
import Ionicons from "@expo/vector-icons/build/Ionicons";

export const STEPS = [
  {
    key: "Personal",
    label: "You",
    icon: "person-outline" as const,
    subtitle: "Let's start with the basics",
  },
  {
    key: "Academic",
    label: "Academics",
    icon: "school-outline" as const,
    subtitle: "Tell us about your studies",
  },
  {
    key: "Tech",
    label: "Tech",
    icon: "hardware-chip-outline" as const,
    subtitle: "What excites you in tech?",
  },
  {
    key: "Review",
    label: "Review",
    icon: "checkmark-done-outline" as const,
    subtitle: "Almost there — check everything",
  },
];
export const TOTAL = STEPS.length;

export const TECH_INTERESTS = [
  "Web Development",
  "Mobile Development",
  "AI/Machine Learning",
  "Data Science",
  "Cybersecurity",
  "Cloud Computing",
  "DevOps",
  "Blockchain",
  "IoT",
  "Game Development",
  "UI/UX Design",
  "Database Systems",
];

export const LANGUAGES = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C",
  "C++",
  "C#",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
  "SQL",
  "R",
];

export const TECH_INTEREST_ICONS: Record<
  string,
  keyof typeof Ionicons.glyphMap
> = {
  "Web Development": "globe-outline",
  "Mobile Development": "phone-portrait-outline",
  "AI/Machine Learning": "hardware-chip-outline",
  "Data Science": "stats-chart-outline",
  Cybersecurity: "shield-checkmark-outline",
  "Cloud Computing": "cloud-outline",
  DevOps: "infinite-outline",
  Blockchain: "link-outline",
  IoT: "wifi-outline",
  "Game Development": "game-controller-outline",
  "UI/UX Design": "color-palette-outline",
  "Database Systems": "server-outline",
};

export const LANGUAGE_ICONS: Record<string, string> = {
  Python: "language-python",
  JavaScript: "language-javascript",
  TypeScript: "language-typescript",
  Java: "language-java",
  C: "language-c",
  "C++": "language-cpp",
  "C#": "language-csharp",
  Go: "language-go",
  Rust: "language-rust",
  PHP: "language-php",
  Ruby: "language-ruby",
  Swift: "language-swift",
  Kotlin: "language-kotlin",
  SQL: "database",
  R: "language-r",
};

export const LEVELS = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"];
export const SEMESTERS = ["Semester 1", "Semester 2"];
export const GENDERS: { label: string; value: Gender }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];
export const EXPERIENCE: { label: string; value: ExperienceLevel }[] = [
  { label: "🌱 Beginner", value: "beginner" },
  { label: "⚡ Intermediate", value: "intermediate" },
  { label: "🚀 Advanced", value: "advanced" },
];

export type Country = {
  name: string;
  flag: string;
  dial: string;
  minDigits: number;
  maxDigits: number;
};
export const COUNTRIES: Country[] = [
  { name: "Zimbabwe", flag: "🇿🇼", dial: "+263", minDigits: 9, maxDigits: 9 },
];
export const DEFAULT_COUNTRY = COUNTRIES[0];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
