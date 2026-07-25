import { styles } from "@/constants/styles";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, Text } from "react-native";

export function ReviewSection({
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
