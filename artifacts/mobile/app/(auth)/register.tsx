import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RegisterFormData, Gender, ExperienceLevel } from '@/types';

const STEPS = ['Personal', 'Academic', 'Tech & Finish'];
const TOTAL = STEPS.length;

const FACULTIES = [
  'Faculty of Science and Technology',
  'Faculty of Engineering',
  'Faculty of Commerce',
  'Faculty of Social Sciences',
  'Faculty of Agriculture',
  'Faculty of Law',
];

const DEPARTMENTS: Record<string, string[]> = {
  'Faculty of Science and Technology': ['Computer Science', 'Information Technology', 'Mathematics', 'Physics', 'Statistics'],
  'Faculty of Engineering': ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Chemical Engineering'],
  'Faculty of Commerce': ['Accounting', 'Finance', 'Marketing', 'Business Studies'],
  'Faculty of Social Sciences': ['Psychology', 'Sociology', 'History', 'Geography'],
  'Faculty of Agriculture': ['Crop Science', 'Animal Science', 'Agricultural Economics'],
  'Faculty of Law': ['Law'],
};

const TECH_INTERESTS = [
  'Web Development', 'Mobile Development', 'AI/Machine Learning', 'Data Science',
  'Cybersecurity', 'Cloud Computing', 'DevOps', 'Blockchain',
  'IoT', 'Game Development', 'UI/UX Design', 'Database Systems',
];

const LANGUAGES = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C', 'C++', 'C#',
  'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'SQL', 'R',
];

const LEVELS = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Postgraduate'];
const SEMESTERS = ['Semester 1', 'Semester 2'];
const GENDERS: { label: string; value: Gender }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];
const EXPERIENCE: { label: string; value: ExperienceLevel }[] = [
  { label: '🌱 Beginner', value: 'beginner' },
  { label: '⚡ Intermediate', value: 'intermediate' },
  { label: '🚀 Advanced', value: 'advanced' },
];

const EMPTY: RegisterFormData = {
  fullName: '', studentNumber: '', email: '', password: '',
  phone: '', gender: '', dateOfBirth: '',
  faculty: '', department: '', programme: '', academicLevel: '', semester: '',
  technologyInterests: [], programmingLanguages: [], experienceLevel: '',
  hasLaptop: false, githubUsername: '', linkedIn: '', portfolio: '',
  agreedToTerms: false,
};

function PillSelect({
  options, value, onSelect, multi, colors,
}: {
  options: string[]; value: string | string[]; multi?: boolean;
  onSelect: (v: string) => void; colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.pillWrap}>
      {options.map(opt => {
        const selected = multi
          ? (value as string[]).includes(opt)
          : value === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            style={[
              styles.pill,
              {
                backgroundColor: selected ? colors.primary : colors.muted,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.pillText, { color: selected ? '#fff' : colors.mutedForeground }]}>
              {opt}
            </Text>
          </TouchableOpacity>
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

  function set<K extends keyof RegisterFormData>(key: K, value: RegisterFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function toggleArray(key: 'technologyInterests' | 'programmingLanguages', val: string) {
    const arr = form[key] as string[];
    set(key, arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  }

  function validate(): string | null {
    if (step === 0) {
      if (!form.fullName.trim()) return 'Full name is required';
      if (!form.studentNumber.trim()) return 'Student number is required';
      if (!form.email.trim() || !form.email.includes('@')) return 'Valid email is required';
      if (form.password.length < 6) return 'Password must be at least 6 characters';
      if (!form.phone.trim()) return 'Phone number is required';
      if (!form.gender) return 'Please select your gender';
    }
    if (step === 1) {
      if (!form.faculty) return 'Please select your faculty';
      if (!form.department) return 'Please select your department';
      if (!form.programme.trim()) return 'Programme is required';
      if (!form.academicLevel) return 'Please select your academic level';
      if (!form.semester) return 'Please select your semester';
    }
    if (step === 2) {
      if (form.technologyInterests.length === 0) return 'Select at least one technology interest';
      if (!form.experienceLevel) return 'Please select your experience level';
      if (!form.agreedToTerms) return 'You must agree to the terms and conditions';
    }
    return null;
  }

  async function handleNext() {
    const err = validate();
    if (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('warning', 'Missing information', err);
      return;
    }
    if (step < TOTAL - 1) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(s => s + 1);
      return;
    }
    // Submit
    setLoading(true);
    try {
      const user = await register(form);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('success', 'Registration successful!', `Welcome, ${user.fullName}!`);
      router.replace({ pathname: '/(auth)/verify-email', params: { memberId: user.memberId } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', 'Registration failed', msg);
    } finally {
      setLoading(false);
    }
  }

  const depts = form.faculty ? (DEPARTMENTS[form.faculty] ?? []) : [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.topBar, { paddingTop: Platform.OS === 'web' ? 20 : 56, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
            Step {step + 1} of {TOTAL} · {STEPS[step]}
          </Text>
          {/* Progress bar */}
          <View style={[styles.progBg, { backgroundColor: colors.muted }]}>
            <Animated.View
              style={[styles.progFill, { backgroundColor: colors.primary, width: `${((step + 1) / TOTAL) * 100}%` }]}
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Step 1: Personal ─────────────────────────── */}
        {step === 0 && (
          <Animated.View entering={FadeInRight.springify()} style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Personal Information</Text>
            <Input label="Full Name *" placeholder="e.g. Takunda Moyo" value={form.fullName} onChangeText={v => set('fullName', v)} leftIcon="person-outline" />
            <Input label="Student Number *" placeholder="e.g. C221456B" value={form.studentNumber} onChangeText={v => set('studentNumber', v)} autoCapitalize="characters" leftIcon="card-outline" />
            <Input label="Email Address *" placeholder="your@email.com" value={form.email} onChangeText={v => set('email', v)} keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" />
            <Input label="Password *" placeholder="At least 6 characters" value={form.password} onChangeText={v => set('password', v)} secureTextEntry leftIcon="lock-closed-outline" />
            <Input label="Phone Number *" placeholder="+263 77 123 4567" value={form.phone} onChangeText={v => set('phone', v)} keyboardType="phone-pad" leftIcon="call-outline" />
            <Input label="Date of Birth" placeholder="YYYY-MM-DD" value={form.dateOfBirth} onChangeText={v => set('dateOfBirth', v)} leftIcon="calendar-outline" />

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Gender</Text>
            <PillSelect
              options={GENDERS.map(g => g.label)}
              value={GENDERS.find(g => g.value === form.gender)?.label ?? ''}
              onSelect={label => {
                const found = GENDERS.find(g => g.label === label);
                if (found) set('gender', found.value);
              }}
              colors={colors}
            />
          </Animated.View>
        )}

        {/* ─── Step 2: Academic ─────────────────────────── */}
        {step === 1 && (
          <Animated.View entering={FadeInRight.springify()} style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Academic Details</Text>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Faculty *</Text>
            <PillSelect options={FACULTIES} value={form.faculty} onSelect={v => { set('faculty', v); set('department', ''); }} colors={colors} />

            {depts.length > 0 && (
              <>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Department *</Text>
                <PillSelect options={depts} value={form.department} onSelect={v => set('department', v)} colors={colors} />
              </>
            )}

            <Input label="Programme *" placeholder="e.g. BSc Computer Science" value={form.programme} onChangeText={v => set('programme', v)} leftIcon="library-outline" />

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Academic Level *</Text>
            <PillSelect options={LEVELS} value={form.academicLevel} onSelect={v => set('academicLevel', v)} colors={colors} />

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Semester *</Text>
            <PillSelect options={SEMESTERS} value={form.semester} onSelect={v => set('semester', v)} colors={colors} />
          </Animated.View>
        )}

        {/* ─── Step 3: Tech & Finish ─────────────────────── */}
        {step === 2 && (
          <Animated.View entering={FadeInRight.springify()} style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tech Profile & Terms</Text>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Technology Interests * (select all that apply)</Text>
            <PillSelect options={TECH_INTERESTS} value={form.technologyInterests} multi onSelect={v => toggleArray('technologyInterests', v)} colors={colors} />

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Programming Languages</Text>
            <PillSelect options={LANGUAGES} value={form.programmingLanguages} multi onSelect={v => toggleArray('programmingLanguages', v)} colors={colors} />

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Experience Level *</Text>
            <PillSelect
              options={EXPERIENCE.map(e => e.label)}
              value={EXPERIENCE.find(e => e.value === form.experienceLevel)?.label ?? ''}
              onSelect={label => {
                const found = EXPERIENCE.find(e => e.label === label);
                if (found) set('experienceLevel', found.value);
              }}
              colors={colors}
            />

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Do you have a laptop?</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['Yes', 'No'].map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => set('hasLaptop', opt === 'Yes')}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: form.hasLaptop === (opt === 'Yes') ? colors.primary : colors.muted,
                      borderColor: form.hasLaptop === (opt === 'Yes') ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: form.hasLaptop === (opt === 'Yes') ? '#fff' : colors.mutedForeground }]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="GitHub Username" placeholder="yourusername" value={form.githubUsername} onChangeText={v => set('githubUsername', v)} leftIcon="logo-github" autoCapitalize="none" />
            <Input label="LinkedIn Profile" placeholder="linkedin.com/in/you" value={form.linkedIn} onChangeText={v => set('linkedIn', v)} leftIcon="logo-linkedin" autoCapitalize="none" />
            <Input label="Portfolio Website" placeholder="https://yoursite.com" value={form.portfolio} onChangeText={v => set('portfolio', v)} leftIcon="globe-outline" autoCapitalize="none" />

            {/* Terms */}
            <TouchableOpacity
              onPress={() => set('agreedToTerms', !form.agreedToTerms)}
              style={[styles.termsRow, { backgroundColor: colors.muted, borderColor: form.agreedToTerms ? colors.primary : colors.border }]}
            >
              <View style={[styles.checkbox, { borderColor: form.agreedToTerms ? colors.primary : colors.mutedForeground, backgroundColor: form.agreedToTerms ? colors.primary : 'transparent' }]}>
                {form.agreedToTerms && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={[styles.termsText, { color: colors.foreground }]}>
                I agree to the ITIC Club constitution, code of conduct, and member terms. My data will be used solely for club management purposes.
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Button
          title={step < TOTAL - 1 ? `Next: ${STEPS[step + 1]}` : 'Create Account'}
          onPress={handleNext}
          loading={loading}
          style={{ marginTop: 8 }}
        />

        {step < TOTAL - 1 && (
          <TouchableOpacity onPress={() => router.back()} style={{ alignItems: 'center' }}>
            <Text style={[styles.cancel, { color: colors.mutedForeground }]}>Cancel registration</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  stepLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  progBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 2 },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  stepContent: { gap: 14 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: -4 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  termsRow: {
    flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'flex-start',
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  termsText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  cancel: { fontSize: 13, fontFamily: 'Inter_400Regular', paddingVertical: 8 },
});
