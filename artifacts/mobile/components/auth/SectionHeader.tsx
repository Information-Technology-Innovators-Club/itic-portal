import { styles } from "@/constants/styles";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";

// ─── Section header used at the top of every step card ───────
export function SectionHeader({
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
