import { styles } from "@/constants/styles";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text } from "react-native";

export function PillSelect({
  options,
  value,
  onSelect,
  multi,
  colors,
}: {
  options: string[];
  value: string | string[];
  multi?: boolean;
  onSelect: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.pillWrap}>
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
              styles.pill,
              {
                backgroundColor: selected ? colors.primary : colors.muted,
                borderColor: selected ? colors.primary : colors.border,
                shadowOpacity: selected ? 0.18 : 0,
              },
            ]}
          >
            {selected && (
              <Ionicons
                name="checkmark"
                size={13}
                color="#fff"
                style={{ marginRight: -2 }}
              />
            )}
            <Text
              style={[
                styles.pillText,
                { color: selected ? "#fff" : colors.mutedForeground },
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
