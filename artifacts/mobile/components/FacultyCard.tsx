import { styles } from "@/constants/styles";
import { FACULTY_ICONS } from "@/data/faculties";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text } from "react-native";

// ─── Faculty picker: icon cards in a two-column grid ──────────
export function FacultyCard({
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
        <View
          style={[styles.facultyCheck, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="checkmark" size={11} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}
