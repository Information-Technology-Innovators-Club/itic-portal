import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeInRight,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RegisterFormData } from "@/types";
import * as db from "@/services/db";
import { apiSendWelcomeEmail } from "@/services/api";
import { LEVELS } from "@/components/Gamification";
import { FACULTIES, FACULTY_ICONS, DEPARTMENTS } from "@/data/faculties";
import { EMPTY } from "@/data/RegisterFormData";
import {
  Country,
  DEFAULT_COUNTRY,
  EXPERIENCE,
  GENDERS,
  LANGUAGE_ICONS,
  LANGUAGES,
  SEMESTERS,
  STEPS,
  TECH_INTEREST_ICONS,
  TECH_INTERESTS,
  TOTAL,
} from "@/data/steps";
import { SectionHeader } from "@/components/auth/SectionHeader";
import { styles } from "@/constants/styles";

const FACULTIES_ROW1 = FACULTIES.filter((_, idx) => idx % 2 === 0);
const FACULTIES_ROW2 = FACULTIES.filter((_, idx) => idx % 2 !== 0);

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
  const [isValidatingStudentNumber, setIsValidatingStudentNumber] =
    useState(false);

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
            const exists = await db.checkStudentNumberExists(
              form.studentNumber,
            );
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
      db.createNotification({
        userId: user.id,
        type: "system",
        title: "🎉 Welcome to ITIC!",
        body: `Your Member ID is ${user.memberId}. Your application is under executive review.`,
      }).catch(() => {});
      apiSendWelcomeEmail(user).catch(() => {});
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
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
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
                            backgroundColor: selected
                              ? colors.primary + "10"
                              : colors.muted,
                            borderColor: selected
                              ? colors.primary
                              : colors.border,
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
                          backgroundColor: selected
                            ? colors.primary + "14"
                            : colors.muted,
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
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
                        color={
                          selected ? colors.primary : colors.mutedForeground
                        }
                      />
                      <Text
                        style={[
                          styles.experienceLabel,
                          {
                            color: selected
                              ? colors.primary
                              : colors.foreground,
                            fontFamily: selected
                              ? "Inter_700Bold"
                              : "Inter_500Medium",
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
                  {
                    label: "Yes",
                    value: true,
                    icon: "laptop-outline" as const,
                  },
                  {
                    label: "No",
                    value: false,
                    icon: "close-circle-outline" as const,
                  },
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
                          backgroundColor: selected
                            ? colors.primary + "14"
                            : colors.muted,
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={18}
                        color={
                          selected ? colors.primary : colors.mutedForeground
                        }
                      />
                      <Text
                        style={[
                          styles.laptopLabel,
                          {
                            color: selected
                              ? colors.primary
                              : colors.foreground,
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
