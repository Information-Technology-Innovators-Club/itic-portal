// Beautiful cross-platform date-of-birth picker: a scrollable
// day / month / year wheel inside a bottom sheet, with a live

import { styles } from "@/constants/styles";
import { MONTHS } from "@/data/steps";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useMemo, useEffect } from "react";
import { View, TouchableOpacity, Modal, Button, Text } from "react-native";
import { daysInMonth, WheelColumn } from "./WheelColumn";
import * as Haptics from "expo-haptics";

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
// preview and age badge on the trigger button.
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
