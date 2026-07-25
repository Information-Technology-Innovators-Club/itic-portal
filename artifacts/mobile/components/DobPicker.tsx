// Beautiful cross-platform date-of-birth picker: a scrollable
// day / month / year wheel inside a bottom sheet, with a live
// preview and age badge on the trigger button.

import { styles } from "@/constants/styles";
import { Button } from "@/components/ui/Button";
import { MONTHS } from "@/data/steps";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useMemo, useEffect } from "react";
import { View, TouchableOpacity, Modal, Text } from "react-native";
import { daysInMonth, WheelColumn } from "./WheelColumn";
import * as Haptics from "expo-haptics";

/**
 * Parses a "YYYY-MM-DD" string as a *local* calendar date (no UTC
 * conversion). Returns null if the string is malformed or doesn't
 * correspond to a real calendar date (e.g. "2024-02-30").
 */
function parseLocalDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day;

  return isValid ? date : null;
}

/** Formats a Date back to "YYYY-MM-DD" using local components (no UTC shift). */
function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DobPicker({
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

  // Parsed once per `value` change — local-date-safe, and null-checked
  // instead of trusting the string is always well-formed.
  const parsedDate = useMemo(() => parseLocalDate(value), [value]);

  const initial = parsedDate ?? new Date(maxYear, 0, 1);
  const initialYearIdx = Math.max(0, years.indexOf(initial.getFullYear()));

  const [tempDay, setTempDay] = useState(initial.getDate() - 1);
  const [tempMonth, setTempMonth] = useState(initial.getMonth());
  const [tempYear, setTempYear] = useState(initialYearIdx);

  const dayLabels = useMemo(() => {
    const count = daysInMonth(tempMonth, years[tempYear] ?? maxYear);
    return Array.from({ length: count }, (_, i) => String(i + 1));
  }, [tempMonth, tempYear, years, maxYear]);

  useEffect(() => {
    if (tempDay > dayLabels.length - 1) setTempDay(dayLabels.length - 1);
  }, [dayLabels.length, tempDay]);

  function openPicker() {
    if (parsedDate) {
      setTempDay(parsedDate.getDate() - 1);
      setTempMonth(parsedDate.getMonth());
      const yIdx = years.indexOf(parsedDate.getFullYear());
      setTempYear(yIdx >= 0 ? yIdx : 0);
    }
    setOpen(true);
  }

  function confirm() {
    const y = years[tempYear] ?? maxYear;
    const d = new Date(y, tempMonth, tempDay + 1);
    onChange(toLocalISODate(d));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(false);
  }

  const age = useMemo(() => {
    if (!parsedDate) return null;
    const t = new Date();
    let a = t.getFullYear() - parsedDate.getFullYear();
    const m = t.getMonth() - parsedDate.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < parsedDate.getDate())) a--;
    return a;
  }, [parsedDate]);

  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
        Date of Birth *
      </Text>
      <TouchableOpacity
        onPress={openPicker}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={
          parsedDate
            ? `Date of birth: ${formatDate(parsedDate)}`
            : "Select your date of birth"
        }
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
            { color: parsedDate ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {parsedDate ? formatDate(parsedDate) : "Select your date of birth"}
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
                accessibilityRole="button"
                accessibilityLabel="Cancel"
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
