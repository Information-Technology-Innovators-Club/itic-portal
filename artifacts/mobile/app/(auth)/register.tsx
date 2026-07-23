import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeInRight,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RegisterFormData, Gender, ExperienceLevel } from "@/types";
import * as db from "@/services/db";

const STEPS = [
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
const TOTAL = STEPS.length;

const FACULTIES = [
  "School of Natural Sciences & Mathematics",
  "School of Art & Design",
  "School of Entrepreneurship & Business Sciences",
  "School of Engineering Science & Technology",
  "Graduate Business School",
  "School of Wildlife & Environmental Science",
  "School of Hospitality and Tourism",
  "Institute of Lifelong Learning & Development Studies",
  "Institute of Materials Science, Processing and Engineering Technology",
  "School of Agricultural Sciences & Technology",
  "School of Health Sciences & Technology",
];

const FACULTIES_ROW1 = FACULTIES.filter((_, idx) => idx % 2 === 0);
const FACULTIES_ROW2 = FACULTIES.filter((_, idx) => idx % 2 !== 0);

// Icon + accent tag shown on each faculty card
const FACULTY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "School of Natural Sciences & Mathematics": "flask-outline",
  "School of Art & Design": "color-palette-outline",
  "School of Entrepreneurship & Business Sciences": "briefcase-outline",
  "School of Engineering Science & Technology": "construct-outline",
  "Graduate Business School": "school-outline",
  "School of Wildlife & Environmental Science": "leaf-outline",
  "School of Hospitality and Tourism": "restaurant-outline",
  "Institute of Lifelong Learning & Development Studies": "book-outline",
  "Institute of Materials Science, Processing and Engineering Technology": "hardware-chip-outline",
  "School of Agricultural Sciences & Technology": "nutrition-outline",
  "School of Health Sciences & Technology": "medkit-outline",
};
const DEPARTMENTS: Record<string, string[]> = {
  "School of Natural Sciences & Mathematics": [
    "Department of Biology",
    "Department of Physics",
    "Department of Chemistry",
    "Department of Mathematics",
  ],

  "School of Art & Design": [
    "Creative Art and Design",
    "Clothing and Textile Technology",
  ],

  "School of Entrepreneurship & Business Sciences": [
    "Entrepreneurship and Business Management",
    "Accounting and Finance",
    "Supply Chain Management",
    "Marketing",
    "Consumer Science and Retail Management",
  ],

  "School of Engineering Science & Technology": [
    "Mechatronics Engineering",
    "Production Engineering",
    "ICT and Electronics",
    "Environmental Engineering",
    "Fuels and Energy Engineering",
  ],

  "Graduate Business School": [
    "Strategic Management",
    "Big Data Analytics",
  ],

  "School of Wildlife & Environmental Science": [
    "Department of Wildlife Ecology and Conservation",
    "Department of Freshwater and Fishery Science",
    "Environmental Conservation and Geo-informatics",
    "Environmental Science and Technology",
  ],

  "School of Hospitality and Tourism": [
    "Department of Hospitality and Tourism",
    "Department of Travel and Recreation",
  ],

  "Institute of Lifelong Learning & Development Studies": [
    "Centre for Development Studies",
    "Skills Training and Development Programme",
    "Centre for Indigenous Knowledge and Living Heritage",
    "Centre for Language and Communication Studies",
  ],

  "Institute of Materials Science, Processing and Engineering Technology": [
    "Materials Science and Engineering",
  ],

  "School of Agricultural Sciences & Technology": [
    "Agricultural Engineering",
    "Food Science and Technology",
    "Crop Science and Post Harvest Technology",
  ],

  "School of Health Sciences & Technology": [
    "Biotechnology",
  ],
};

const TECH_INTERESTS = [
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

const LANGUAGES = [
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

const TECH_INTEREST_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "Web Development": "globe-outline",
  "Mobile Development": "phone-portrait-outline",
  "AI/Machine Learning": "hardware-chip-outline",
  "Data Science": "stats-chart-outline",
  "Cybersecurity": "shield-checkmark-outline",
  "Cloud Computing": "cloud-outline",
  "DevOps": "infinite-outline",
  "Blockchain": "link-outline",
  "IoT": "wifi-outline",
  "Game Development": "game-controller-outline",
  "UI/UX Design": "color-palette-outline",
  "Database Systems": "server-outline",
};

const LANGUAGE_ICONS: Record<string, string> = {
  "Python": "language-python",
  "JavaScript": "language-javascript",
  "TypeScript": "language-typescript",
  "Java": "language-java",
  "C": "language-c",
  "C++": "language-cpp",
  "C#": "language-csharp",
  "Go": "language-go",
  "Rust": "language-rust",
  "PHP": "language-php",
  "Ruby": "language-ruby",
  "Swift": "language-swift",
  "Kotlin": "language-kotlin",
  "SQL": "database",
  "R": "language-r",
};

const LEVELS = [
  "Level 1",
  "Level 2",
  "Level 3",
  "Level 4",
  "Level 5",
];
const SEMESTERS = ["Semester 1", "Semester 2"];
const GENDERS: { label: string; value: Gender }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];
const EXPERIENCE: { label: string; value: ExperienceLevel }[] = [
  { label: "🌱 Beginner", value: "beginner" },
  { label: "⚡ Intermediate", value: "intermediate" },
  { label: "🚀 Advanced", value: "advanced" },
];

type Country = {
  name: string;
  flag: string;
  dial: string;
  minDigits: number;
  maxDigits: number;
};
const COUNTRIES: Country[] = [
  { name: "Zimbabwe", flag: "🇿🇼", dial: "+263", minDigits: 9, maxDigits: 9 },
  { name: "South Africa", flag: "🇿🇦", dial: "+27", minDigits: 9, maxDigits: 9 },
  { name: "Zambia", flag: "🇿🇲", dial: "+260", minDigits: 9, maxDigits: 9 },
  { name: "Botswana", flag: "🇧🇼", dial: "+267", minDigits: 7, maxDigits: 8 },
  { name: "Mozambique", flag: "🇲🇿", dial: "+258", minDigits: 8, maxDigits: 9 },
  { name: "Namibia", flag: "🇳🇦", dial: "+264", minDigits: 8, maxDigits: 9 },
  { name: "Nigeria", flag: "🇳🇬", dial: "+234", minDigits: 10, maxDigits: 10 },
  { name: "Kenya", flag: "🇰🇪", dial: "+254", minDigits: 9, maxDigits: 9 },
  {
    name: "United Kingdom",
    flag: "🇬🇧",
    dial: "+44",
    minDigits: 9,
    maxDigits: 10,
  },
  {
    name: "United States",
    flag: "🇺🇸",
    dial: "+1",
    minDigits: 10,
    maxDigits: 10,
  },
];
const DEFAULT_COUNTRY = COUNTRIES[0];

const MONTHS = [
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

const EMPTY: RegisterFormData = {
  fullName: "",
  studentNumber: "",
  email: "",
  password: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  faculty: "",
  department: "",
  programme: "",
  academicLevel: "",
  semester: "",
  technologyInterests: [],
  programmingLanguages: [],
  experienceLevel: "",
  hasLaptop: false,
  githubUsername: "",
  linkedIn: "",
  portfolio: "",
  agreedToTerms: false,
};

// ─── Section header used at the top of every step card ───────
function SectionHeader({
  icon,
  title,
  subtitle,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIconWrap,
          { backgroundColor: colors.primary + "1A" },
        ]}
      >
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        <Text
          style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function PillSelect({
  options,
  value,
  onSelect,
  multi,
  colors,
}: {
  options: string[];
  value: string | string[];
  multi?: boolean;
  onSelect: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.pillWrap}>
      {options.map((opt) => {
        const selected = multi
          ? (value as string[]).includes(opt)
          : value === opt;
        return (
          <TouchableOpacity
            key={opt}
            activeOpacity={0.7}
            onPress={() => onSelect(opt)}
            style={[
              styles.pill,
              {
                backgroundColor: selected ? colors.primary : colors.muted,
                borderColor: selected ? colors.primary : colors.border,
                shadowOpacity: selected ? 0.18 : 0,
              },
            ]}
          >
            {selected && (
              <Ionicons
                name="checkmark"
                size={13}
                color="#fff"
                style={{ marginRight: -2 }}
              />
            )}
            <Text
              style={[
                styles.pillText,
                { color: selected ? "#fff" : colors.mutedForeground },
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function IconPillSelect({
  options,
  value,
  onSelect,
  multi,
  icons,
  colors,
  iconFamily = "ionicons",
}: {
  options: string[];
  value: string | string[];
  multi?: boolean;
  onSelect: (v: string) => void;
  icons: Record<string, any>;
  colors: ReturnType<typeof useColors>;
  iconFamily?: "ionicons" | "material";
}) {
  return (
    <View style={styles.iconPillWrap}>
      {options.map((opt) => {
        const selected = multi
          ? (value as string[]).includes(opt)
          : value === opt;
        return (
          <TouchableOpacity
            key={opt}
            activeOpacity={0.7}
            onPress={() => onSelect(opt)}
            style={[
              styles.iconPill,
              {
                backgroundColor: selected ? colors.primary + "14" : colors.muted,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
          >
            {iconFamily === "material" ? (
              <MaterialCommunityIcons
                name={icons[opt] ?? "code-tags"}
                size={16}
                color={selected ? colors.primary : colors.mutedForeground}
                style={{ marginRight: 6 }}
              />
            ) : (
              <Ionicons
                name={icons[opt] ?? "code-slash-outline"}
                size={15}
                color={selected ? colors.primary : colors.mutedForeground}
                style={{ marginRight: 6 }}
              />
            )}
            <Text
              style={[
                styles.iconPillText,
                {
                  color: selected ? colors.primary : colors.foreground,
                  fontFamily: selected
                    ? "Inter_600SemiBold"
                    : "Inter_500Medium",
                },
              ]}
            >
              {opt}
            </Text>
            {selected && (
              <View
                style={[styles.iconPillCheck, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="checkmark" size={9} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function getPasswordStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!pw) return { score: 0, label: "", color: "#ccc" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "Very weak", color: "#ef4444" },
    { label: "Weak", color: "#f97316" },
    { label: "Fair", color: "#eab308" },
    { label: "Good", color: "#22c55e" },
    { label: "Strong", color: "#16a34a" },
  ];
  const idx = Math.min(score, levels.length - 1);
  return { score, label: levels[idx].label, color: levels[idx].color };
}

function PhoneInput({
  country,
  localNumber,
  onCountryChange,
  onNumberChange,
  colors,
  error,
}: {
  country: Country;
  localNumber: string;
  onCountryChange: (c: Country) => void;
  onNumberChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
  error?: string | null;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const digits = localNumber.replace(/\D/g, "");
  const valid =
    digits.length >= country.minDigits && digits.length <= country.maxDigits;

  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
        Phone Number *
      </Text>
      <View
        style={[
          styles.phoneRow,
          {
            borderColor: error
              ? "#ef4444"
              : valid && digits.length > 0
                ? "#22c55e"
                : colors.border,
            backgroundColor: colors.muted,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setPickerOpen(true)}
          style={styles.countryBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.flagText}>{country.flag}</Text>
          <Text style={[styles.dialText, { color: colors.foreground }]}>
            {country.dial}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
        <View
          style={[styles.phoneDivider, { backgroundColor: colors.border }]}
        />
        <TextInput
          value={localNumber}
          onChangeText={(v) => onNumberChange(v.replace(/[^\d\s]/g, ""))}
          placeholder="77 123 4567"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="phone-pad"
          style={[styles.phoneInput, { color: colors.foreground }]}
        />
        {digits.length > 0 && (
          <Ionicons
            name={valid ? "checkmark-circle" : "alert-circle"}
            size={18}
            color={valid ? "#22c55e" : "#ef4444"}
            style={{ marginRight: 10 }}
          />
        )}
      </View>
      {error && <Text style={styles.errText}>{error}</Text>}

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalSheet, { backgroundColor: colors.background }]}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Select country
            </Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(c) => c.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryRow}
                  onPress={() => {
                    onCountryChange(item);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={styles.flagText}>{item.flag}</Text>
                  <Text
                    style={[styles.countryName, { color: colors.foreground }]}
                  >
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.mutedForeground }}>
                    {item.dial}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function daysInMonth(monthIndex: number, year: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

const WHEEL_ITEM_HEIGHT = 44;
const WHEEL_VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS;

// A single scrollable wheel column (used for day / month / year)
function WheelColumn({
  data,
  selectedIndex,
  onChange,
  width,
  colors,
}: {
  data: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  width: number;
  colors: ReturnType<typeof useColors>;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!isDragging.current) {
      scrollRef.current?.scrollTo({
        y: selectedIndex * WHEEL_ITEM_HEIGHT,
        animated: false,
      });
    }
  }, [selectedIndex, data.length]);

  function commit(y: number) {
    const idx = Math.max(
      0,
      Math.min(data.length - 1, Math.round(y / WHEEL_ITEM_HEIGHT)),
    );
    if (idx !== selectedIndex) onChange(idx);
    else
      scrollRef.current?.scrollTo({
        y: idx * WHEEL_ITEM_HEIGHT,
        animated: true,
      });
  }

  return (
    <View style={{ width, height: WHEEL_HEIGHT }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        onScrollBeginDrag={() => {
          isDragging.current = true;
        }}
        onMomentumScrollEnd={(e) => {
          isDragging.current = false;
          commit(e.nativeEvent.contentOffset.y);
        }}
        contentContainerStyle={{
          paddingVertical:
            WHEEL_ITEM_HEIGHT * Math.floor(WHEEL_VISIBLE_ROWS / 2),
        }}
      >
        {data.map((label, i) => {
          const distance = Math.abs(i - selectedIndex);
          const isCenter = distance === 0;
          return (
            <TouchableOpacity
              key={`${label}-${i}`}
              activeOpacity={0.6}
              style={styles.wheelItem}
              onPress={() => {
                scrollRef.current?.scrollTo({
                  y: i * WHEEL_ITEM_HEIGHT,
                  animated: true,
                });
                onChange(i);
              }}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.wheelItemText,
                  {
                    color: isCenter ? colors.foreground : colors.mutedForeground,
                    opacity: isCenter ? 1 : distance === 1 ? 0.55 : 0.28,
                    fontFamily: isCenter ? "Inter_700Bold" : "Inter_500Medium",
                    fontSize: isCenter ? 18 : 15,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Beautiful cross-platform date-of-birth picker: a scrollable
// day / month / year wheel inside a bottom sheet, with a live
// preview and age badge on the trigger button.
function DobPicker({
  value,
  onChange,
  colors,
  error,
}: {
  value: string;
  onChange: (iso: string) => void;
  colors: ReturnType<typeof useColors>;
  error?: string | null;
}) {
  const [open, setOpen] = useState(false);

  const today = new Date();
  const maxYear = today.getFullYear() - 15;
  const minYear = today.getFullYear() - 90;
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [maxYear, minYear]);

  const initial = value ? new Date(value) : new Date(maxYear, 0, 1);
  const initialYearIdx = Math.max(0, years.indexOf(initial.getFullYear()));

  const [tempDay, setTempDay] = useState(initial.getDate() - 1);
  const [tempMonth, setTempMonth] = useState(initial.getMonth());
  const [tempYear, setTempYear] = useState(
    initialYearIdx >= 0 ? initialYearIdx : 0,
  );

  const dayLabels = useMemo(() => {
    const count = daysInMonth(tempMonth, years[tempYear] ?? maxYear);
    return Array.from({ length: count }, (_, i) => String(i + 1));
  }, [tempMonth, tempYear, years, maxYear]);

  useEffect(() => {
    if (tempDay > dayLabels.length - 1) setTempDay(dayLabels.length - 1);
  }, [dayLabels.length, tempDay]);

  function openPicker() {
    if (value) {
      const d = new Date(value);
      setTempDay(d.getDate() - 1);
      setTempMonth(d.getMonth());
      const yIdx = years.indexOf(d.getFullYear());
      setTempYear(yIdx >= 0 ? yIdx : 0);
    }
    setOpen(true);
  }

  function confirm() {
    const y = years[tempYear] ?? maxYear;
    const d = new Date(y, tempMonth, tempDay + 1);
    onChange(d.toISOString().slice(0, 10));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(false);
  }

  const date = value ? new Date(value) : undefined;
  const age = useMemo(() => {
    if (!date) return null;
    const t = new Date();
    let a = t.getFullYear() - date.getFullYear();
    const m = t.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < date.getDate())) a--;
    return a;
  }, [date]);

  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
        Date of Birth *
      </Text>
      <TouchableOpacity
        onPress={openPicker}
        activeOpacity={0.7}
        style={[
          styles.dobBtn,
          {
            borderColor: error ? "#ef4444" : colors.border,
            backgroundColor: colors.muted,
          },
        ]}
      >
        <View
          style={[
            styles.dobIconWrap,
            { backgroundColor: colors.primary + "1A" },
          ]}
        >
          <Ionicons name="calendar-outline" size={17} color={colors.primary} />
        </View>
        <Text
          style={[
            styles.dobText,
            { color: value ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {value ? formatDate(date!) : "Select your date of birth"}
        </Text>
        {age !== null && (
          <View style={[styles.ageBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.ageBadgeText}>{age} yrs</Text>
          </View>
        )}
      </TouchableOpacity>
      {error && <Text style={styles.errText}>{error}</Text>}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalSheet, { backgroundColor: colors.background }]}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Date of birth
            </Text>
            <Text
              style={[styles.modalSubtitle, { color: colors.mutedForeground }]}
            >
              Scroll or tap to set day, month and year
            </Text>

            <View style={styles.wheelRow}>
              <View
                pointerEvents="none"
                style={[
                  styles.wheelHighlight,
                  {
                    backgroundColor: colors.primary + "14",
                    borderColor: colors.primary + "40",
                  },
                ]}
              />
              <WheelColumn
                data={dayLabels}
                selectedIndex={tempDay}
                onChange={setTempDay}
                width={64}
                colors={colors}
              />
              <WheelColumn
                data={MONTHS}
                selectedIndex={tempMonth}
                onChange={setTempMonth}
                width={140}
                colors={colors}
              />
              <WheelColumn
                data={years.map(String)}
                selectedIndex={tempYear}
                onChange={setTempYear}
                width={80}
                colors={colors}
              />

              <LinearGradient
                pointerEvents="none"
                colors={[colors.background, colors.background + "00"]}
                style={styles.wheelFadeTop}
              />
              <LinearGradient
                pointerEvents="none"
                colors={[colors.background + "00", colors.background]}
                style={styles.wheelFadeBottom}
              />
            </View>

            <View style={styles.dobFooterRow}>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={[styles.dobCancelBtn, { borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Button title="Confirm date" onPress={confirm} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Faculty picker: icon cards in a two-column grid ──────────
function FacultyCard({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.facultyCard,
        {
          backgroundColor: selected ? colors.primary + "14" : colors.muted,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.facultyIconWrap,
          {
            backgroundColor: selected ? colors.primary : colors.background,
          },
        ]}
      >
        <Ionicons
          name={FACULTY_ICONS[label] ?? "school-outline"}
          size={18}
          color={selected ? "#fff" : colors.primary}
        />
      </View>
      <Text
        numberOfLines={2}
        style={[
          styles.facultyLabel,
          {
            color: colors.foreground,
            fontFamily: selected ? "Inter_700Bold" : "Inter_500Medium",
          },
        ]}
      >
        {label.replace("Faculty of ", "")}
      </Text>
      {selected && (
        <View style={[styles.facultyCheck, { backgroundColor: colors.primary }]}>
          <Ionicons name="checkmark" size={11} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Academic level meter: connected numbered nodes + PG chip ─
function LevelMeter({
  value,
  onSelect,
  colors,
}: {
  value: string;
  onSelect: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const numericLevels = LEVELS;
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.levelRow}>
        {numericLevels.map((lvl, i) => {
          const selected = value === lvl;
          const num = i + 1;
          const passed = value ? numericLevels.indexOf(value) >= i : false;
          return (
            <React.Fragment key={lvl}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onSelect(lvl)}
                style={styles.levelNode}
              >
                <View
                  style={[
                    styles.levelCircle,
                    {
                      backgroundColor: selected
                        ? colors.primary
                        : passed
                          ? colors.primary + "22"
                          : colors.muted,
                      borderColor: selected
                        ? colors.primary
                        : passed
                          ? colors.primary + "55"
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selected ? "#fff" : colors.mutedForeground,
                      fontFamily: "Inter_700Bold",
                      fontSize: 13,
                    }}
                  >
                    {num}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 10.5,
                    color: selected ? colors.foreground : colors.mutedForeground,
                    fontFamily: selected ? "Inter_700Bold" : "Inter_500Medium",
                  }}
                >
                  Lvl {num}
                </Text>
              </TouchableOpacity>
              {i < numericLevels.length - 1 && (
                <View
                  style={[
                    styles.levelLine,
                    {
                      backgroundColor: passed
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

// ─── Semester toggle: two large side-by-side cards ─────────────
function SemesterToggle({
  value,
  onSelect,
  colors,
}: {
  value: string;
  onSelect: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      {SEMESTERS.map((s, i) => {
        const selected = value === s;
        return (
          <TouchableOpacity
            key={s}
            activeOpacity={0.85}
            onPress={() => onSelect(s)}
            style={[
              styles.semesterCard,
              {
                backgroundColor: selected ? colors.primary : colors.muted,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.semesterBadge,
                {
                  backgroundColor: selected
                    ? "rgba(255,255,255,0.25)"
                    : colors.primary + "1A",
                },
              ]}
            >
              <Text
                style={{
                  color: selected ? "#fff" : colors.primary,
                  fontFamily: "Inter_700Bold",
                  fontSize: 13,
                }}
              >
                {i + 1}
              </Text>
            </View>
            <Text
              style={{
                color: selected ? "#fff" : colors.foreground,
                fontFamily: "Inter_700Bold",
                fontSize: 13,
              }}
            >
              {s}
            </Text>
            {selected && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#fff"
                style={{ position: "absolute", top: 10, right: 10 }}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Step tracker: icon circles connected by an animated line ─
function StepTracker({
  step,
  colors,
}: {
  step: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.trackerRow}>
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <React.Fragment key={s.key}>
            <View style={styles.trackerNode}>
              <View
                style={[
                  styles.trackerCircle,
                  done && { backgroundColor: "#fff" },
                  active && styles.trackerCircleActive,
                  !done && !active && styles.trackerCircleIdle,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={14} color={colors.primary} />
                ) : (
                  <Ionicons
                    name={s.icon}
                    size={14}
                    color={active ? colors.primary : "rgba(255,255,255,0.75)"}
                  />
                )}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.trackerLabel,
                  {
                    color: active || done ? "#fff" : "rgba(255,255,255,0.65)",
                    fontFamily: active ? "Inter_700Bold" : "Inter_500Medium",
                  },
                ]}
              >
                {s.label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={styles.trackerLineWrap}>
                <View
                  style={[
                    styles.trackerLine,
                    {
                      backgroundColor:
                        i < step ? "#fff" : "rgba(255,255,255,0.3)",
                    },
                  ]}
                />
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export default function RegisterScreen() {
  const colors = useColors();
  const { register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegisterFormData>(EMPTY);
  const [loading, setLoading] = useState(false);

  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [localPhone, setLocalPhone] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>(
    {},
  );
  const [isValidatingStudentNumber, setIsValidatingStudentNumber] = useState(false);

  useEffect(() => {
    if (!form.studentNumber.trim()) {
      setFieldErrors((prev) => ({ ...prev, studentNumber: null }));
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidatingStudentNumber(true);
      try {
        const exists = await db.checkStudentNumberExists(form.studentNumber);
        if (exists) {
          setFieldErrors((prev) => ({
            ...prev,
            studentNumber: "This student number is already registered",
          }));
        } else {
          setFieldErrors((prev) => ({ ...prev, studentNumber: null }));
        }
      } catch (err) {
        console.error("Error validating student number:", err);
      } finally {
        setIsValidatingStudentNumber(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.studentNumber]);

  function set<K extends keyof RegisterFormData>(
    key: K,
    value: RegisterFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePhone(c: Country, local: string) {
    const digits = local.replace(/\D/g, "");
    set("phone", digits ? `${c.dial}${digits}` : "");
  }

  function toggleArray(
    key: "technologyInterests" | "programmingLanguages",
    val: string,
  ) {
    const arr = form[key] as string[];
    set(key, arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  }

  const passwordStrength = getPasswordStrength(form.password);

  async function validate(): Promise<string | null> {
    const errs: Record<string, string | null> = {};
    if (step === 0) {
      if (!form.fullName.trim()) errs.fullName = "Full name is required";
      if (!form.studentNumber.trim()) {
        errs.studentNumber = "Student number is required";
      } else {
        if (fieldErrors.studentNumber) {
          errs.studentNumber = fieldErrors.studentNumber;
        } else {
          try {
            const exists = await db.checkStudentNumberExists(form.studentNumber);
            if (exists) {
              errs.studentNumber = "This student number is already registered";
              setFieldErrors((prev) => ({
                ...prev,
                studentNumber: "This student number is already registered",
              }));
            }
          } catch (err) {
            console.error("Error checking student number uniqueness:", err);
          }
        }
      }
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = "Valid email is required";
      if (form.password.length < 6)
        errs.password = "Password must be at least 6 characters";
      const digits = localPhone.replace(/\D/g, "");
      if (
        digits.length < country.minDigits ||
        digits.length > country.maxDigits
      ) {
        errs.phone = `Enter a valid ${country.name} number (${country.minDigits}${country.minDigits !== country.maxDigits ? `-${country.maxDigits}` : ""} digits)`;
      }
      if (!form.gender) errs.gender = "Please select your gender";
      if (!form.dateOfBirth) {
        errs.dateOfBirth = "Please select your date of birth";
      } else {
        const d = new Date(form.dateOfBirth);
        const age = Math.floor(
          (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000),
        );
        if (age < 15) errs.dateOfBirth = "You must be at least 15 years old";
        if (age > 90) errs.dateOfBirth = "Please check the date of birth";
      }
    }
    if (step === 1) {
      if (!form.faculty) errs.faculty = "Please select your faculty";
      if (!form.department) errs.department = "Please select your department";
      if (!form.programme.trim()) errs.programme = "Programme is required";
      if (!form.academicLevel)
        errs.academicLevel = "Please select your academic level";
      if (!form.semester) errs.semester = "Please select your semester";
    }
    if (step === 2) {
      if (form.technologyInterests.length === 0)
        errs.technologyInterests = "Select at least one technology interest";
      if (!form.experienceLevel)
        errs.experienceLevel = "Please select your experience level";
      if (!form.agreedToTerms)
        errs.agreedToTerms = "You must agree to the terms and conditions";
    }
    setFieldErrors(errs);
    const firstKey = Object.keys(errs)[0];
    return firstKey ? (errs[firstKey] ?? null) : null;
  }

  async function handleNext() {
    const err = await validate();
    if (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("warning", "Missing information", err);
      return;
    }
    if (step < TOTAL - 1) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => s + 1);
      return;
    }
    setLoading(true);
    try {
      const user = await register(form);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(
        "success",
        "Registration successful!",
        `Welcome, ${user.fullName}!`,
      );
      router.replace({
        pathname: "/(auth)/verify-email",
        params: { memberId: user.memberId },
      });
    } catch (err: unknown) {
      console.error("Registration submission failed error:", err);
      const msg = err instanceof Error ? err.message : "Registration failed.";
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("error", "Registration failed", msg);
    } finally {
      setLoading(false);
    }
  }

  const depts = form.faculty ? (DEPARTMENTS[form.faculty] ?? []) : [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ─── Gradient header with icon step tracker ────────── */}
      <LinearGradient
        colors={[colors.primary, shade(colors.primary, -18)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Platform.OS === "web" ? 24 : 58 }]}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => (step > 0 ? setStep((s) => s - 1) : router.back())}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Join ITIC Club</Text>
            <Text style={styles.headerSubtitle}>{STEPS[step].subtitle}</Text>
          </View>
        </View>
        <StepTracker step={step} colors={colors} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Step 1: Personal ─────────────────────────── */}
        {step === 0 && (
          <Animated.View
            entering={FadeInRight.springify().damping(16)}
            style={[
              styles.card,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <SectionHeader
              icon="person-outline"
              title="Personal Information"
              subtitle="Who's joining us?"
              colors={colors}
            />

            <Animated.View entering={FadeInDown.delay(40)}>
              <Input
                label="Full Name *"
                placeholder="Your full name"
                value={form.fullName}
                onChangeText={(v) => set("fullName", v)}
                leftIcon="person-outline"
                error={fieldErrors.fullName ?? undefined}
              />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(80)}>
              <Input
                label="Student Number *"
                placeholder="Your student number"
                value={form.studentNumber}
                onChangeText={(v) => set("studentNumber", v)}
                autoCapitalize="characters"
                leftIcon="card-outline"
                error={fieldErrors.studentNumber ?? undefined}
              />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(120)}>
              <Input
                label="Email Address *"
                placeholder="your@email.com"
                value={form.email}
                onChangeText={(v) => set("email", v)}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
                error={fieldErrors.email ?? undefined}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(160)}>
              <Input
                label="Password *"
                placeholder="At least 6 characters"
                value={form.password}
                onChangeText={(v) => set("password", v)}
                secureTextEntry
                leftIcon="lock-closed-outline"
                error={fieldErrors.password ?? undefined}
              />
              {form.password.length > 0 && (
                <Animated.View
                  entering={FadeIn}
                  style={{ gap: 4, marginTop: -6 }}
                >
                  <View style={styles.strengthTrack}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.strengthLabel,
                      { color: passwordStrength.color },
                    ]}
                  >
                    {passwordStrength.label}
                  </Text>
                </Animated.View>
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200)}>
              <PhoneInput
                country={country}
                localNumber={localPhone}
                onCountryChange={(c) => {
                  setCountry(c);
                  updatePhone(c, localPhone);
                }}
                onNumberChange={(v) => {
                  setLocalPhone(v);
                  updatePhone(country, v);
                }}
                colors={colors}
                error={fieldErrors.phone}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(240)}>
              <DobPicker
                value={form.dateOfBirth}
                onChange={(iso) => set("dateOfBirth", iso)}
                colors={colors}
                error={fieldErrors.dateOfBirth}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(280)} style={{ gap: 8 }}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Gender
              </Text>
              <PillSelect
                options={GENDERS.map((g) => g.label)}
                value={
                  GENDERS.find((g) => g.value === form.gender)?.label ?? ""
                }
                onSelect={(label) => {
                  const found = GENDERS.find((g) => g.label === label);
                  if (found) set("gender", found.value);
                }}
                colors={colors}
              />
            </Animated.View>
          </Animated.View>
        )}

        {/* ─── Step 2: Academic ─────────────────────────── */}
        {step === 1 && (
          <Animated.View
            entering={FadeInRight.springify().damping(16)}
            style={[
              styles.card,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <SectionHeader
              icon="school-outline"
              title="Academic Details"
              subtitle="Your faculty and study track"
              colors={colors}
            />

            <Animated.View entering={FadeInDown.delay(40)} style={{ gap: 10 }}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Faculty *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.facultyScroll}
                contentContainerStyle={styles.facultyScrollContent}
              >
                <View style={styles.facultyGridContainer}>
                  <View style={styles.facultyRow}>
                    {FACULTIES_ROW1.map((f) => (
                      <FacultyCard
                        key={f}
                        label={f}
                        selected={form.faculty === f}
                        onPress={() => {
                          set("faculty", f);
                          set("department", "");
                        }}
                        colors={colors}
                      />
                    ))}
                  </View>
                  <View style={styles.facultyRow}>
                    {FACULTIES_ROW2.map((f) => (
                      <FacultyCard
                        key={f}
                        label={f}
                        selected={form.faculty === f}
                        onPress={() => {
                          set("faculty", f);
                          set("department", "");
                        }}
                        colors={colors}
                      />
                    ))}
                  </View>
                </View>
              </ScrollView>
            </Animated.View>

            {depts.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(80)}
                style={[
                  styles.deptBox,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <View style={styles.deptHead}>
                  <Ionicons
                    name="git-branch-outline"
                    size={15}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.deptHeadText, { color: colors.foreground }]}
                  >
                    Department *
                  </Text>
                </View>
                <View style={{ gap: 8, marginTop: 4 }}>
                  {depts.map((dept) => {
                    const selected = form.department === dept;
                    return (
                      <TouchableOpacity
                        key={dept}
                        activeOpacity={0.7}
                        onPress={() => set("department", dept)}
                        style={[
                          styles.deptCard,
                          {
                            backgroundColor: selected ? colors.primary + "10" : colors.muted,
                            borderColor: selected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.deptCardText,
                            {
                              color: colors.foreground,
                              fontFamily: selected
                                ? "Inter_600SemiBold"
                                : "Inter_500Medium",
                            },
                          ]}
                        >
                          {dept}
                        </Text>
                        <View
                          style={[
                            styles.deptRadioCircle,
                            {
                              borderColor: selected
                                ? colors.primary
                                : colors.mutedForeground + "55",
                            },
                          ]}
                        >
                          {selected && (
                            <View
                              style={[
                                styles.deptRadioDot,
                                { backgroundColor: colors.primary },
                              ]}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(120)}>
              <Input
                label="Programme *"
                placeholder="e.g. BSc Computer Science"
                value={form.programme}
                onChangeText={(v) => set("programme", v)}
                leftIcon="library-outline"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(160)} style={{ gap: 10 }}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Academic Level *
              </Text>
              <LevelMeter
                value={form.academicLevel}
                onSelect={(v) => set("academicLevel", v)}
                colors={colors}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200)} style={{ gap: 10 }}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Semester *
              </Text>
              <SemesterToggle
                value={form.semester}
                onSelect={(v) => set("semester", v)}
                colors={colors}
              />
            </Animated.View>
          </Animated.View>
        )}

        {/* ─── Step 3: Tech & Finish ─────────────────────── */}
        {step === 2 && (
          <Animated.View
            entering={FadeInRight.springify().damping(16)}
            style={[
              styles.card,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <SectionHeader
              icon="hardware-chip-outline"
              title="Tech Profile & Terms"
              subtitle="Help us tailor sessions to you"
              colors={colors}
            />

            <Animated.View entering={FadeInDown.delay(40)} style={{ gap: 8 }}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Technology Interests * (select all that apply)
              </Text>
              <IconPillSelect
                options={TECH_INTERESTS}
                value={form.technologyInterests}
                multi
                onSelect={(v) => toggleArray("technologyInterests", v)}
                icons={TECH_INTEREST_ICONS}
                colors={colors}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80)} style={{ gap: 8 }}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Programming Languages (select all that apply)
              </Text>
              <IconPillSelect
                options={LANGUAGES}
                value={form.programmingLanguages}
                multi
                onSelect={(v) => toggleArray("programmingLanguages", v)}
                icons={LANGUAGE_ICONS}
                colors={colors}
                iconFamily="material"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120)} style={{ gap: 8 }}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Experience Level *
              </Text>
              <View style={styles.experienceGrid}>
                {EXPERIENCE.map((exp) => {
                  const selected = form.experienceLevel === exp.value;
                  return (
                    <TouchableOpacity
                      key={exp.value}
                      activeOpacity={0.7}
                      onPress={() => set("experienceLevel", exp.value)}
                      style={[
                        styles.experienceCard,
                        {
                          backgroundColor: selected ? colors.primary + "14" : colors.muted,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          exp.label === "Beginner"
                            ? "leaf-outline"
                            : exp.label === "Intermediate"
                              ? "code-working-outline"
                              : exp.label === "Advanced"
                                ? "rocket-outline"
                                : "trophy-outline"
                        }
                        size={20}
                        color={selected ? colors.primary : colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.experienceLabel,
                          {
                            color: selected ? colors.primary : colors.foreground,
                            fontFamily: selected ? "Inter_700Bold" : "Inter_500Medium",
                          },
                        ]}
                      >
                        {exp.label}
                      </Text>
                      {selected && (
                        <View
                          style={[
                            styles.experienceCheck,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(160)} style={{ gap: 8 }}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Do you have a laptop? *
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {[
                  { label: "Yes", value: true, icon: "laptop-outline" as const },
                  { label: "No", value: false, icon: "close-circle-outline" as const },
                ].map((opt) => {
                  const selected = form.hasLaptop === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      activeOpacity={0.8}
                      onPress={() => set("hasLaptop", opt.value)}
                      style={[
                        styles.laptopCard,
                        {
                          backgroundColor: selected ? colors.primary + "14" : colors.muted,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={18}
                        color={selected ? colors.primary : colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.laptopLabel,
                          {
                            color: selected ? colors.primary : colors.foreground,
                            fontFamily: selected
                              ? "Inter_600SemiBold"
                              : "Inter_500Medium",
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200)}>
              <Input
                label="GitHub Username"
                placeholder="yourusername"
                value={form.githubUsername}
                onChangeText={(v) => set("githubUsername", v)}
                leftIcon="logo-github"
                autoCapitalize="none"
              />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(220)}>
              <Input
                label="LinkedIn Profile"
                placeholder="linkedin.com/in/you"
                value={form.linkedIn}
                onChangeText={(v) => set("linkedIn", v)}
                leftIcon="logo-linkedin"
                autoCapitalize="none"
              />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(240)}>
              <Input
                label="Portfolio Website"
                placeholder="https://yoursite.com"
                value={form.portfolio}
                onChangeText={(v) => set("portfolio", v)}
                leftIcon="globe-outline"
                autoCapitalize="none"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(280)}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => set("agreedToTerms", !form.agreedToTerms)}
                style={[
                  styles.termsRow,
                  {
                    backgroundColor: colors.muted,
                    borderColor: form.agreedToTerms
                      ? colors.primary
                      : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: form.agreedToTerms
                        ? colors.primary
                        : colors.mutedForeground,
                      backgroundColor: form.agreedToTerms
                        ? colors.primary
                        : "transparent",
                    },
                  ]}
                >
                  {form.agreedToTerms && (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  )}
                </View>
                <Text style={[styles.termsText, { color: colors.foreground }]}>
                  I agree to the ITIC Club constitution, code of conduct, and
                  member terms. My data will be used solely for club management
                  purposes.
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        {/* ─── Step 4: Review ───────────────────────────── */}
        {step === 3 && (
          <Animated.View
            entering={FadeInRight.springify().damping(16)}
            style={[
              styles.card,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <SectionHeader
              icon="checkmark-done-outline"
              title="Review Your Details"
              subtitle='Tap "Edit" on any section to change it'
              colors={colors}
            />

            <ReviewSection
              colors={colors}
              title="Personal"
              icon="person-outline"
              onEdit={() => setStep(0)}
              rows={[
                ["Name", form.fullName],
                ["Student No.", form.studentNumber],
                ["Email", form.email],
                ["Phone", form.phone],
                [
                  "Date of Birth",
                  form.dateOfBirth
                    ? formatDate(new Date(form.dateOfBirth))
                    : "—",
                ],
                [
                  "Gender",
                  GENDERS.find((g) => g.value === form.gender)?.label ?? "—",
                ],
              ]}
            />

            <ReviewSection
              colors={colors}
              title="Academic"
              icon="school-outline"
              onEdit={() => setStep(1)}
              rows={[
                ["Faculty", form.faculty],
                ["Department", form.department],
                ["Programme", form.programme],
                ["Level", form.academicLevel],
                ["Semester", form.semester],
              ]}
            />

            <ReviewSection
              colors={colors}
              title="Tech Profile"
              icon="hardware-chip-outline"
              onEdit={() => setStep(2)}
              rows={[
                ["Interests", form.technologyInterests.join(", ") || "—"],
                ["Languages", form.programmingLanguages.join(", ") || "—"],
                [
                  "Experience",
                  EXPERIENCE.find((e) => e.value === form.experienceLevel)
                    ?.label ?? "—",
                ],
                ["Has laptop", form.hasLaptop ? "Yes" : "No"],
                ["GitHub", form.githubUsername || "—"],
              ]}
            />
          </Animated.View>
        )}

        <View style={{ height: 8 }} />
      </ScrollView>

      {/* ─── Sticky footer ─────────────────────────────── */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Button
          title={step < TOTAL - 1 ? `Continue` : "Create Account"}
          onPress={handleNext}
          loading={loading}
        />
        {step < TOTAL - 1 ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ alignItems: "center", paddingTop: 10 }}
          >
            <Text style={[styles.cancel, { color: colors.mutedForeground }]}>
              Cancel registration
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setStep((s) => s - 1)}
            style={{ alignItems: "center", paddingTop: 10 }}
          >
            <Text style={[styles.cancel, { color: colors.mutedForeground }]}>
              Go back and edit
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function ReviewSection({
  title,
  icon,
  rows,
  onEdit,
  colors,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  rows: [string, string][];
  onEdit: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.reviewCard,
        { backgroundColor: colors.muted, borderColor: colors.border },
      ]}
    >
      <View style={styles.reviewCardHead}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name={icon} size={16} color={colors.primary} />
          <Text style={[styles.reviewCardTitle, { color: colors.foreground }]}>
            {title}
          </Text>
        </View>
        <TouchableOpacity onPress={onEdit} hitSlop={8}>
          <Text style={[styles.reviewEdit, { color: colors.primary }]}>
            Edit
          </Text>
        </TouchableOpacity>
      </View>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.reviewRow}>
          <Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>
            {label}
          </Text>
          <Text
            style={[styles.reviewValue, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {value || "—"}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Darkens/lightens a hex color by `percent` (-100..100) for the gradient's second stop
function shade(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(num)) return hex;
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

const styles = StyleSheet.create({
  // Header
  header: { paddingHorizontal: 20, paddingBottom: 20, gap: 18 },
  headerTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 19, fontFamily: "Inter_700Bold" },
  headerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },

  // Step tracker
  trackerRow: { flexDirection: "row", alignItems: "flex-start" },
  trackerNode: { alignItems: "center", width: 56, gap: 6 },
  trackerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  trackerCircleActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  trackerCircleIdle: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.3)",
  },
  trackerLabel: { fontSize: 10.5 },
  trackerLineWrap: { flex: 1, paddingTop: 15, paddingHorizontal: 2 },
  trackerLine: { height: 2, borderRadius: 1 },

  // Layout
  scroll: { padding: 16, paddingBottom: 24, gap: 16 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    borderTopWidth: 1,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 2,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionSubtitle: {
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },

  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  pillText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  iconPillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  iconPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    position: "relative",
  },
  iconPillText: {
    fontSize: 13,
  },
  iconPillCheck: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  experienceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  experienceCard: {
    width: "48%",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
    position: "relative",
  },
  experienceLabel: {
    fontSize: 13,
  },
  experienceCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  laptopCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  laptopLabel: {
    fontSize: 14,
  },
  termsRow: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "flex-start",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  cancel: { fontSize: 13, fontFamily: "Inter_400Regular" },

  strengthTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: 3 },
  strengthLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    height: 50,
  },
  countryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
  },
  flagText: { fontSize: 18 },
  dialText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  phoneDivider: { width: 1, height: 24 },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    height: "100%",
  },
  errText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#ef4444" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    maxHeight: "78%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 20,
    paddingBottom: 2,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 20,
    paddingBottom: 8,
    textAlign: "center",
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  countryName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },

  dobBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 10,
  },
  dobIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dobText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  ageBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  ageBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  dobFooterRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  dobCancelBtn: {
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  // Wheel date picker
  wheelRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: WHEEL_HEIGHT,
    position: "relative",
  },
  wheelHighlight: {
    position: "absolute",
    left: 12,
    right: 12,
    top: WHEEL_ITEM_HEIGHT * Math.floor(WHEEL_VISIBLE_ROWS / 2),
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
  },
  wheelFadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_HEIGHT * 1.4,
  },
  wheelFadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_HEIGHT * 1.4,
  },
  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelItemText: { fontSize: 16 },

  // Faculty grid
  facultyScroll: {
    marginHorizontal: -20,
  },
  facultyScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  facultyGridContainer: {
    flexDirection: "column",
    gap: 10,
  },
  facultyRow: {
    flexDirection: "row",
    gap: 10,
  },
  facultyCard: {
    width: 180,
    minHeight: 110,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  facultyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  facultyLabel: { fontSize: 12.5, lineHeight: 16 },
  facultyCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  deptBox: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  deptHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  deptHeadText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  deptCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  deptCardText: {
    fontSize: 13.5,
    flex: 1,
    paddingRight: 10,
    lineHeight: 18,
  },
  deptRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  deptRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Level meter
  levelRow: { flexDirection: "row", alignItems: "flex-start" },
  levelNode: { alignItems: "center", gap: 5, width: 48 },
  levelCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  levelLine: { flex: 1, height: 2, marginTop: 15, borderRadius: 1 },
  pgChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },

  // Semester toggle
  semesterCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  semesterBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  reviewCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  reviewCardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  reviewCardTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  reviewEdit: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  reviewRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  reviewLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  reviewValue: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
    textAlign: "right",
  },
});