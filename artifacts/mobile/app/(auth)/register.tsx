import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RegisterFormData, Gender, ExperienceLevel } from '@/types';

const FACULTIES = [
  'Faculty of Science and Technology',
  'Faculty of Engineering and the Built Environment',
  'Faculty of Business Sciences',
  'Faculty of Social Sciences and Humanities',
  'Faculty of Natural Sciences and Mathematics',
  'Faculty of Health Sciences',
];

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Software Engineering',
  'Electronic Engineering', 'Business Information Systems', 'Mathematics',
  'Physics', 'Cybersecurity', 'Artificial Intelligence',
];

const INTERESTS = [
  'Web Development', 'Mobile Development', 'AI / Machine Learning',
  'Cybersecurity', 'Cloud Computing', 'Data Science', 'Blockchain',
  'Internet of Things', 'Game Development', 'DevOps', 'UI/UX Design',
  'Embedded Systems', 'Robotics', 'Quantum Computing',
];

const LANGUAGES = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C', 'C++', 'C#',
  'PHP', 'Swift', 'Kotlin', 'Go', 'Rust', 'SQL', 'R', 'MATLAB',
];

const LEVELS = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Postgraduate'];
const SEMESTERS = ['Semester 1', 'Semester 2'];
const GENDERS: { label: string; value: Gender }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];
const EXPERIENCES: { label: string; value: ExperienceLevel }[] = [
  { label: 'Beginner (< 1 year)', value: 'beginner' },
  { label: 'Intermediate (1–3 years)', value: 'intermediate' },
  { label: 'Advanced (3+ years)', value: 'advanced' },
];

const TOTAL_STEPS = 4;
const EMPTY_FORM: RegisterFormData = {
  fullName: '', studentNumber: '', email: '', password: '',
  phone: '', gender: '', dateOfBirth: '',
  faculty: '', department: '', programme: '', academicLevel: '', semester: '',
  technologyInterests: [], programmingLanguages: [], experienceLevel: '',
  hasLaptop: false, githubUsername: '', linkedIn: '', portfolio: '',
  emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
  agreedToTerms: false,
};

function OptionPill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.pill,
        {
          backgroundColor: selected ? colors.primary : colors.muted,
          borderColor: selected ? colors.primary : colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <Text style={[styles.pillText, { color: selected ? '#fff' : colors.mutedForeground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SelectOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.selectOpt,
        {
          backgroundColor: selected ? colors.accent : colors.muted,
          borderColor: selected ? colors.primary : colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      {selected && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
      <Text style={[styles.selectOptText, { color: selected ? colors.primary : colors.mutedForeground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RegisterFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(key: keyof RegisterFormData, value: any) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function toggleArray(key: 'technologyInterests' | 'programmingLanguages', val: string) {
    setForm(f => {
      const arr = f[key] as string[];
      return { ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.fullName.trim()) return 'Full name is required';
      if (!form.studentNumber.trim()) return 'Student number is required';
      if (!form.email.trim()) return 'Email is required';
      if (!form.email.includes('@')) return 'Enter a valid email address';
      if (form.password.length < 6) return 'Password must be at least 6 characters';
      if (!form.phone.trim()) return 'Phone number is required';
      if (!form.gender) return 'Please select your gender';
      if (!form.dateOfBirth) return 'Date of birth is required';
    } else if (step === 2) {
      if (!form.faculty) return 'Please select your faculty';
      if (!form.department) return 'Please select your department';
      if (!form.programme.trim()) return 'Programme is required';
      if (!form.academicLevel) return 'Please select your academic level';
      if (!form.semester) return 'Please select your semester';
    } else if (step === 3) {
      if (form.technologyInterests.length === 0) return 'Select at least one technology interest';
      if (!form.experienceLevel) return 'Please select your experience level';
    } else if (step === 4) {
      if (!form.emergencyContactName.trim()) return 'Emergency contact name is required';
      if (!form.emergencyContactPhone.trim()) return 'Emergency contact phone is required';
      if (!form.emergencyContactRelation.trim()) return 'Relationship is required';
      if (!form.agreedToTerms) return 'Please accept the terms and conditions';
    }
    return null;
  }

  async function handleNext() {
    const validErr = validateStep();
    if (validErr) { setError(validErr); return; }
    setError('');
    if (step < TOTAL_STEPS) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(s => s + 1);
    } else {
      await handleSubmit();
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      await register(form);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(auth)/verify-email');
    } catch (err: any) {
      setError(err.message ?? 'Registration failed');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  const stepTitles = ['Personal Info', 'Academic Info', 'Tech Profile', 'Final Step'];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => step > 1 ? setStep(s => s - 1) : router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {stepTitles[step - 1]}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Step {step} of {TOTAL_STEPS}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: `${(step / TOTAL_STEPS) * 100}%` },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <Animated.View entering={FadeInRight.springify()} style={styles.stepContent}>
            <Input label="Full Name" placeholder="e.g. Takunda Moyo" value={form.fullName}
              onChangeText={v => update('fullName', v)} leftIcon="person-outline" />
            <Input label="Student Number" placeholder="e.g. C221456B" value={form.studentNumber}
              onChangeText={v => update('studentNumber', v.toUpperCase())} leftIcon="card-outline"
              autoCapitalize="characters" />
            <Input label="University Email" placeholder="e.g. C221456B@cut.ac.zw" value={form.email}
              onChangeText={v => update('email', v)} leftIcon="mail-outline"
              keyboardType="email-address" autoCapitalize="none" />
            <Input label="Password" placeholder="Minimum 6 characters" value={form.password}
              onChangeText={v => update('password', v)} leftIcon="lock-closed-outline" secure />
            <Input label="Phone Number" placeholder="e.g. +263 77 123 4567" value={form.phone}
              onChangeText={v => update('phone', v)} leftIcon="call-outline" keyboardType="phone-pad" />

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Gender</Text>
              <View style={styles.pillRow}>
                {GENDERS.map(g => (
                  <OptionPill key={g.value} label={g.label}
                    selected={form.gender === g.value}
                    onPress={() => update('gender', g.value)} />
                ))}
              </View>
            </View>

            <Input label="Date of Birth" placeholder="YYYY-MM-DD" value={form.dateOfBirth}
              onChangeText={v => update('dateOfBirth', v)} leftIcon="calendar-outline" />
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInRight.springify()} style={styles.stepContent}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Faculty</Text>
              {FACULTIES.map(f => (
                <SelectOption key={f} label={f} selected={form.faculty === f}
                  onPress={() => update('faculty', f)} />
              ))}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Department</Text>
              {DEPARTMENTS.map(d => (
                <SelectOption key={d} label={d} selected={form.department === d}
                  onPress={() => update('department', d)} />
              ))}
            </View>

            <Input label="Programme" placeholder="e.g. BSc Computer Science" value={form.programme}
              onChangeText={v => update('programme', v)} leftIcon="school-outline" />

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Academic Level</Text>
              <View style={styles.pillRow}>
                {LEVELS.map(l => (
                  <OptionPill key={l} label={l} selected={form.academicLevel === l}
                    onPress={() => update('academicLevel', l)} />
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Semester</Text>
              <View style={styles.pillRow}>
                {SEMESTERS.map(s => (
                  <OptionPill key={s} label={s} selected={form.semester === s}
                    onPress={() => update('semester', s)} />
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeInRight.springify()} style={styles.stepContent}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Technology Interests (select all that apply)
              </Text>
              <View style={styles.pillRow}>
                {INTERESTS.map(i => (
                  <OptionPill key={i} label={i}
                    selected={form.technologyInterests.includes(i)}
                    onPress={() => toggleArray('technologyInterests', i)} />
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Programming Languages (select all that apply)
              </Text>
              <View style={styles.pillRow}>
                {LANGUAGES.map(l => (
                  <OptionPill key={l} label={l}
                    selected={form.programmingLanguages.includes(l)}
                    onPress={() => toggleArray('programmingLanguages', l)} />
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Experience Level</Text>
              {EXPERIENCES.map(e => (
                <SelectOption key={e.value} label={e.label}
                  selected={form.experienceLevel === e.value}
                  onPress={() => update('experienceLevel', e.value)} />
              ))}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Do you own a laptop?</Text>
              <View style={styles.pillRow}>
                <OptionPill label="Yes" selected={form.hasLaptop}
                  onPress={() => update('hasLaptop', true)} />
                <OptionPill label="No" selected={!form.hasLaptop}
                  onPress={() => update('hasLaptop', false)} />
              </View>
            </View>

            <Input label="GitHub Username (optional)" placeholder="e.g. johndoe" value={form.githubUsername}
              onChangeText={v => update('githubUsername', v)} leftIcon="logo-github" autoCapitalize="none" />
            <Input label="LinkedIn Profile (optional)" placeholder="linkedin.com/in/username"
              value={form.linkedIn} onChangeText={v => update('linkedIn', v)} leftIcon="logo-linkedin"
              autoCapitalize="none" />
            <Input label="Portfolio URL (optional)" placeholder="yoursite.com" value={form.portfolio}
              onChangeText={v => update('portfolio', v)} leftIcon="globe-outline" autoCapitalize="none" />
          </Animated.View>
        )}

        {step === 4 && (
          <Animated.View entering={FadeInRight.springify()} style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Emergency Contact</Text>

            <Input label="Contact Name" placeholder="e.g. Rose Moyo" value={form.emergencyContactName}
              onChangeText={v => update('emergencyContactName', v)} leftIcon="person-outline" />
            <Input label="Contact Phone" placeholder="e.g. +263 71 987 6543"
              value={form.emergencyContactPhone}
              onChangeText={v => update('emergencyContactPhone', v)}
              leftIcon="call-outline" keyboardType="phone-pad" />
            <Input label="Relationship" placeholder="e.g. Mother, Father, Guardian"
              value={form.emergencyContactRelation}
              onChangeText={v => update('emergencyContactRelation', v)} leftIcon="heart-outline" />

            {/* Terms */}
            <TouchableOpacity
              onPress={() => update('agreedToTerms', !form.agreedToTerms)}
              activeOpacity={0.75}
              style={[styles.termsRow, { backgroundColor: colors.muted, borderRadius: colors.radius }]}
            >
              <View style={[
                styles.checkbox,
                { borderColor: form.agreedToTerms ? colors.primary : colors.border,
                  backgroundColor: form.agreedToTerms ? colors.primary : 'transparent',
                  borderRadius: colors.radius / 2 }
              ]}>
                {form.agreedToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
                I agree to the ITIC{' '}
                <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
                  Terms &amp; Conditions
                </Text>
                {' '}and{' '}
                <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Summary */}
            <View style={[styles.summaryBox, { backgroundColor: colors.accent, borderRadius: colors.radius }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.summaryText, { color: colors.accentForeground }]}>
                Your registration will be reviewed by an executive. You will receive confirmation once approved.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Error */}
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + '15', borderRadius: colors.radius, marginHorizontal: 24 }]}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        ) : null}

        {/* Buttons */}
        <View style={styles.btnRow}>
          <Button
            title={step === TOTAL_STEPS ? 'Submit Registration' : 'Continue'}
            onPress={handleNext}
            loading={loading}
            fullWidth
            style={{ marginHorizontal: 24 }}
          />
        </View>

        <View style={styles.loginRow}>
          <Text style={[styles.loginLabel, { color: colors.mutedForeground }]}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={[styles.loginLink, { color: colors.primary }]}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  progressTrack: { height: 3, marginHorizontal: 24, borderRadius: 2 },
  progressFill: { height: 3, borderRadius: 2 },
  scroll: { paddingTop: 20, gap: 0 },
  stepContent: { paddingHorizontal: 24, gap: 14 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginLeft: 2 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1.5 },
  pillText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  selectOpt: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderWidth: 1.5,
  },
  selectOptText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  checkbox: { width: 20, height: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  termsText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, flex: 1 },
  summaryBox: { flexDirection: 'row', gap: 10, padding: 14, alignItems: 'flex-start' },
  summaryText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20, flex: 1 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginTop: 12,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  btnRow: { marginTop: 24 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, paddingBottom: 8 },
  loginLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  loginLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
