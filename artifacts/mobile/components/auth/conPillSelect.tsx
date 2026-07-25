import { styles } from "@/constants/styles";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Text, View, TouchableOpacity } from "react-native";

export function IconPillSelect({
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
                backgroundColor: selected
                  ? colors.primary + "14"
                  : colors.muted,
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
                style={[
                  styles.iconPillCheck,
                  { backgroundColor: colors.primary },
                ]}
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
