import { styles } from "@/constants/styles";
import { STEPS } from "@/data/steps";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

// ─── Step tracker: icon circles connected by an animated line ─
export function StepTracker({
  step,
  colors,
}: {
  step: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.trackerRow}>
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <React.Fragment key={s.key}>
            <View style={styles.trackerNode}>
              <View
                style={[
                  styles.trackerCircle,
                  done && { backgroundColor: "#fff" },
                  active && styles.trackerCircleActive,
                  !done && !active && styles.trackerCircleIdle,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={14} color={colors.primary} />
                ) : (
                  <Ionicons
                    name={s.icon}
                    size={14}
                    color={active ? colors.primary : "rgba(255,255,255,0.75)"}
                  />
                )}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.trackerLabel,
                  {
                    color: active || done ? "#fff" : "rgba(255,255,255,0.65)",
                    fontFamily: active ? "Inter_700Bold" : "Inter_500Medium",
                  },
                ]}
              >
                {s.label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={styles.trackerLineWrap}>
                <View
                  style={[
                    styles.trackerLine,
                    {
                      backgroundColor:
                        i < step ? "#fff" : "rgba(255,255,255,0.3)",
                    },
                  ]}
                />
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
