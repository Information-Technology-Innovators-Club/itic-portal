import { styles } from "@/constants/styles";
import { SEMESTERS } from "@/data/steps";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, Text } from "react-native";

// ─── Semester toggle: two large side-by-side cards ─────────────
export function SemesterToggle({
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
